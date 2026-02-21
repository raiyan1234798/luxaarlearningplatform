/**
 * Luxaar AI Service Client v3.0 — Cloud + Local Edition
 * 
 * Dual-provider AI service:
 *   - Google Gemini (cloud) — works for all users, free tier
 *   - Ollama (local) — works for local development
 *   
 * Auto-fallback: Gemini → Ollama → Error
 */

import { db } from "@/lib/firebase/client";
import {
    collection,
    addDoc,
    getDocs,
    doc,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    limit,
} from "firebase/firestore";
import { GoogleGenerativeAI } from "@google/generative-ai";

// ============================================================
// Config
// ============================================================

const AI_SERVER_URL = process.env.NEXT_PUBLIC_AI_SERVER_URL || "http://localhost:3001";

export type AIMode = "tutor" | "notes" | "deepdive" | "exam" | "code";
export type AIProvider = "gemini" | "ollama";

export interface ChatMessage {
    role: "user" | "assistant" | "system";
    content: string;
    timestamp?: string;
    mode?: AIMode;
    metrics?: StreamMetrics;
}

export interface CourseContext {
    courseId: string;
    courseTitle: string;
    lessonTitle?: string;
    lessonDescription?: string;
    instructorNotes?: string;
    moduleTitle?: string;
}

export interface ChatSession {
    id?: string;
    userId: string;
    courseId: string;
    courseTitle: string;
    messages: ChatMessage[];
    mode: AIMode;
    model: string;
    createdAt: string;
    updatedAt: string;
}

export interface AISettings {
    enabled: boolean;
    model: string;
    maxTokens: number;
    temperature: number;
    enabledCourses: string[];
    provider?: AIProvider;
    geminiApiKey?: string;
    geminiModel?: string;
}

export interface StreamMetrics {
    totalTokens: number;
    totalDurationMs: number;
    timeToFirstTokenMs: number;
    tokensPerSecond: number;
    model: string;
    provider?: AIProvider;
    contextOptimized?: boolean;
}

// ============================================================
// Mode System Prompts
// ============================================================

const MODE_PROMPTS: Record<AIMode, string> = {
    tutor: `You are Luxaar AI Tutor — a patient, friendly, and expert teacher. 
Your job is to explain concepts simply and clearly, using analogies and examples.
- Break down complex topics into digestible pieces
- Use encouraging language
- Ask follow-up questions to check understanding
- If the student seems confused, try a different explanation approach`,

    notes: `You are Luxaar AI Notes Assistant. 
Your job is to create concise, well-organized study notes.
- Use bullet points and numbered lists
- Highlight key terms in **bold**
- Create clear section headers
- Include important formulas or definitions
- Keep notes brief but comprehensive
- Format for easy review`,

    deepdive: `You are Luxaar AI Deep Dive Expert.
Your job is to provide thorough, detailed explanations.
- Go in-depth on every aspect
- Provide historical context when relevant
- Include technical details
- Explain underlying principles and mechanisms
- Connect related concepts
- Cite specific examples and use cases`,

    exam: `You are Luxaar AI Exam Prep Assistant.
Your job is to give short, exam-ready answers.
- Be concise and precise
- Focus on what would appear on an exam
- Use point-form answers when appropriate
- Include key definitions
- Highlight common exam pitfalls
- Provide memory aids (mnemonics) when helpful`,

    code: `You are Luxaar AI Code Helper.
Your job is to help with programming and code.
- Write clean, well-commented code
- Explain code line by line when asked
- Debug errors with clear explanations
- Follow best practices
- Use proper formatting with code blocks
- Suggest optimizations
- Support multiple programming languages`,
};

export const MODE_LABELS: Record<AIMode, { label: string; emoji: string; desc: string }> = {
    tutor: { label: "Tutor", emoji: "🎓", desc: "Simple explanations with examples" },
    notes: { label: "Notes", emoji: "📝", desc: "Summarize into study notes" },
    deepdive: { label: "Deep Dive", emoji: "🔬", desc: "Detailed, thorough explanations" },
    exam: { label: "Exam Prep", emoji: "📋", desc: "Short, exam-ready answers" },
    code: { label: "Code Helper", emoji: "💻", desc: "Debug and explain code" },
};

// ============================================================
// Smart Prompt Compression
// ============================================================

export function compressMessages(messages: ChatMessage[], maxMessages = 10): ChatMessage[] {
    if (messages.length <= maxMessages) return messages;

    const systemMsgs = messages.filter(m => m.role === "system");
    const nonSystem = messages.filter(m => m.role !== "system");

    const recent = nonSystem.slice(-maxMessages);
    const olderCount = nonSystem.length - maxMessages;
    if (olderCount > 0) {
        const compressionNote: ChatMessage = {
            role: "system",
            content: `[Context: ${olderCount} earlier messages omitted. Continue naturally based on recent messages below.]`,
        };
        return [...systemMsgs, compressionNote, ...recent];
    }
    return [...systemMsgs, ...recent];
}

export function compressPrompt(prompt: string): string {
    return prompt
        .replace(/\n{3,}/g, "\n\n")
        .replace(/[ \t]{2,}/g, " ")
        .trim();
}

// ============================================================
// Build System Prompt
// ============================================================

export function buildSystemPrompt(mode: AIMode, context?: CourseContext): string {
    let prompt = MODE_PROMPTS[mode];

    prompt += `\n\nIMPORTANT RULES:
- Only answer based on the course context provided below.
- If the question is outside the course scope, politely redirect the student.
- Never make up information. If unsure, say so.
- Keep responses focused and well-structured.
- Use markdown formatting for readability.
- End every response with a small "✦ Generated by Luxaar AI" watermark.`;

    if (context) {
        prompt += `\n\n--- COURSE CONTEXT ---`;
        prompt += `\nCourse: ${context.courseTitle}`;
        if (context.moduleTitle) prompt += `\nModule: ${context.moduleTitle}`;
        if (context.lessonTitle) prompt += `\nLesson: ${context.lessonTitle}`;
        if (context.lessonDescription) prompt += `\nDescription: ${context.lessonDescription}`;
        if (context.instructorNotes) {
            const notes = context.instructorNotes.length > 1500
                ? context.instructorNotes.substring(0, 1500) + "...[truncated]"
                : context.instructorNotes;
            prompt += `\nInstructor Notes:\n${notes}`;
        }
        prompt += `\n--- END CONTEXT ---`;
    }

    return compressPrompt(prompt);
}

// ============================================================
// Provider Detection
// ============================================================

let _cachedSettings: AISettings | null = null;
let _settingsCacheTime = 0;

async function getCachedSettings(): Promise<AISettings> {
    const now = Date.now();
    if (_cachedSettings && now - _settingsCacheTime < 30000) {
        return _cachedSettings;
    }
    const settings = await getAISettings();
    _cachedSettings = settings;
    _settingsCacheTime = now;
    return settings;
}

export async function detectProvider(): Promise<{
    provider: AIProvider;
    available: boolean;
    model: string;
    geminiApiKey?: string;
}> {
    const settings = await getCachedSettings();

    // Check env var first, then Firestore settings
    const geminiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || settings.geminiApiKey;

    // If admin chose a specific provider
    if (settings.provider === "ollama") {
        const ollamaHealth = await checkOllamaHealth();
        if (ollamaHealth) {
            return { provider: "ollama", available: true, model: settings.model };
        }
    }

    // Try Gemini first (cloud — works for all users)
    if (geminiKey) {
        return {
            provider: "gemini",
            available: true,
            model: settings.geminiModel || "gemini-2.0-flash",
            geminiApiKey: geminiKey,
        };
    }

    // Fall back to Ollama (local)
    const ollamaHealth = await checkOllamaHealth();
    if (ollamaHealth) {
        return { provider: "ollama", available: true, model: settings.model };
    }

    // Nothing available
    return { provider: "gemini", available: false, model: "none" };
}

async function checkOllamaHealth(): Promise<boolean> {
    try {
        const res = await fetch(`${AI_SERVER_URL}/health`, { signal: AbortSignal.timeout(3000) });
        if (!res.ok) return false;
        const data = await res.json();
        return data.ollama === "connected";
    } catch {
        return false;
    }
}

// ============================================================
// Health Check (Enhanced — checks both providers)
// ============================================================

export async function checkAIHealth(): Promise<{
    status: string;
    ollama: string;
    models: string[];
    gemini: string;
    geminiModel?: string;
    activeProvider: AIProvider;
    latencyMs?: number;
}> {
    const settings = await getCachedSettings();
    const geminiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || settings.geminiApiKey;

    let ollamaStatus = "disconnected";
    let ollamaModels: string[] = [];
    let latencyMs: number | undefined;

    // Check Ollama
    try {
        const start = Date.now();
        const res = await fetch(`${AI_SERVER_URL}/health`, { signal: AbortSignal.timeout(3000) });
        latencyMs = Date.now() - start;
        if (res.ok) {
            const data = await res.json();
            ollamaStatus = data.ollama || "disconnected";
            ollamaModels = data.models || [];
        }
    } catch { /* offline */ }

    // Check Gemini
    let geminiStatus = "not_configured";
    let geminiModel: string | undefined;
    if (geminiKey) {
        try {
            const genAI = new GoogleGenerativeAI(geminiKey);
            const model = genAI.getGenerativeModel({ model: settings.geminiModel || "gemini-2.0-flash" });
            // Quick test — countTokens is fast and validates the key
            await model.countTokens("test");
            geminiStatus = "connected";
            geminiModel = settings.geminiModel || "gemini-2.0-flash";
        } catch (err: any) {
            geminiStatus = err.message?.includes("API_KEY") ? "invalid_key" : "error";
        }
    }

    // Determine active provider
    let activeProvider: AIProvider = "gemini";
    if (settings.provider === "ollama" && ollamaStatus === "connected") {
        activeProvider = "ollama";
    } else if (geminiStatus === "connected") {
        activeProvider = "gemini";
    } else if (ollamaStatus === "connected") {
        activeProvider = "ollama";
    }

    return {
        status: geminiStatus === "connected" || ollamaStatus === "connected" ? "online" : "offline",
        ollama: ollamaStatus,
        models: ollamaModels,
        gemini: geminiStatus,
        geminiModel,
        activeProvider,
        latencyMs,
    };
}

// ============================================================
// Get Available Models
// ============================================================

export async function getAvailableModels(): Promise<{
    name: string;
    size: number;
    contextLength?: number;
    provider?: AIProvider;
}[]> {
    const models: { name: string; size: number; contextLength?: number; provider?: AIProvider }[] = [];

    // Add Gemini models (always available if key exists)
    const settings = await getCachedSettings();
    const geminiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || settings.geminiApiKey;
    if (geminiKey) {
        models.push(
            { name: "gemini-2.0-flash", size: 0, contextLength: 1048576, provider: "gemini" },
            { name: "gemini-1.5-flash", size: 0, contextLength: 1048576, provider: "gemini" },
            { name: "gemini-1.5-pro", size: 0, contextLength: 2097152, provider: "gemini" },
        );
    }

    // Add Ollama models
    try {
        const res = await fetch(`${AI_SERVER_URL}/models`, { signal: AbortSignal.timeout(3000) });
        if (res.ok) {
            const data = await res.json();
            for (const m of (data.models || [])) {
                models.push({ ...m, provider: "ollama" as AIProvider });
            }
        }
    } catch { /* offline */ }

    return models;
}

// ============================================================
// Model Warm-up (Ollama only)
// ============================================================

export async function warmupModel(model: string): Promise<boolean> {
    try {
        const res = await fetch(`${AI_SERVER_URL}/warmup`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ model }),
            signal: AbortSignal.timeout(30000),
        });
        return res.ok;
    } catch {
        return false;
    }
}

// ============================================================
// Google Gemini Streaming
// ============================================================

async function streamGemini(
    apiKey: string,
    modelName: string,
    messages: ChatMessage[],
    onChunk: (content: string, done: boolean, metrics?: StreamMetrics) => void,
    onError: (error: string) => void,
    options?: { temperature?: number; max_tokens?: number },
    signal?: AbortSignal
): Promise<void> {
    const startTime = Date.now();
    let tokenCount = 0;
    let firstTokenTime: number | null = null;

    try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
            model: modelName,
            generationConfig: {
                temperature: options?.temperature ?? 0.7,
                maxOutputTokens: options?.max_tokens ?? 1024,
                topP: 0.9,
            },
        });

        // Separate system prompt and conversation
        const systemPrompt = messages.find(m => m.role === "system")?.content || "";
        const chatMessages = messages
            .filter(m => m.role !== "system")
            .map(m => ({
                role: m.role === "assistant" ? "model" as const : "user" as const,
                parts: [{ text: m.content }],
            }));

        // Get the last user message and prior history
        const lastMsg = chatMessages.pop();
        if (!lastMsg) {
            onError("No message to send");
            return;
        }

        const chat = model.startChat({
            history: chatMessages,
            systemInstruction: systemPrompt || undefined,
        });

        // Stream response
        const result = await chat.sendMessageStream(lastMsg.parts[0].text);

        for await (const chunk of result.stream) {
            // Check for abort
            if (signal?.aborted) return;

            const text = chunk.text();
            if (text) {
                tokenCount++;
                if (!firstTokenTime) firstTokenTime = Date.now();
                onChunk(text, false);
            }
        }

        // Done
        const totalDuration = Date.now() - startTime;
        const metrics: StreamMetrics = {
            totalTokens: tokenCount,
            totalDurationMs: totalDuration,
            timeToFirstTokenMs: firstTokenTime ? firstTokenTime - startTime : 0,
            tokensPerSecond: tokenCount > 0 ? Math.round(tokenCount / (totalDuration / 1000)) : 0,
            model: modelName,
            provider: "gemini",
        };
        onChunk("", true, metrics);
    } catch (err: any) {
        if (err.name === "AbortError") return;
        if (signal?.aborted) return;

        const errorMsg = err.message || "Gemini API error";
        if (errorMsg.includes("API_KEY_INVALID") || errorMsg.includes("API key not valid")) {
            onError("Invalid Gemini API key. Please check your settings.");
        } else if (errorMsg.includes("RATE_LIMIT") || errorMsg.includes("quota")) {
            onError("Gemini rate limit reached. Please wait a moment and try again.");
        } else if (errorMsg.includes("SAFETY")) {
            onError("The response was blocked by safety filters. Try rephrasing your question.");
        } else {
            onError(`AI error: ${errorMsg}`);
        }
    }
}

// ============================================================
// Ollama Streaming (via proxy server)
// ============================================================

async function streamOllama(
    model: string,
    messages: ChatMessage[],
    onChunk: (content: string, done: boolean, metrics?: StreamMetrics) => void,
    onError: (error: string) => void,
    options?: { temperature?: number; max_tokens?: number },
    signal?: AbortSignal
): Promise<void> {
    try {
        const res = await fetch(`${AI_SERVER_URL}/chat`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                model,
                messages: messages.map(m => ({ role: m.role, content: m.content })),
                options,
            }),
            signal,
        });

        if (!res.ok) {
            const err = await res.json().catch(() => ({ error: "Unknown error" }));
            onError(err.error || "AI request failed");
            return;
        }

        const reader = res.body?.getReader();
        if (!reader) { onError("No response stream"); return; }

        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() || "";

            for (const line of lines) {
                const trimmed = line.trim();
                if (!trimmed || !trimmed.startsWith("data: ")) continue;
                const payload = trimmed.slice(6);
                if (payload === "[DONE]") { onChunk("", true); return; }
                try {
                    const parsed = JSON.parse(payload);
                    if (parsed.error) { onError(parsed.error); return; }
                    if (parsed.type === "token") {
                        onChunk(parsed.content || "", false);
                    } else if (parsed.type === "done") {
                        onChunk("", true, parsed.metrics ? { ...parsed.metrics, provider: "ollama" } : undefined);
                    } else if (parsed.type === "error") {
                        onError(parsed.error || "Stream error");
                    } else if (parsed.type !== "meta") {
                        // Backwards compat
                        onChunk(parsed.content || "", parsed.done || false);
                    }
                } catch { /* skip */ }
            }
        }
        onChunk("", true);
    } catch (err: any) {
        if (err.name === "AbortError") return;
        onError("Ollama is unavailable. Please ensure it is running locally.");
    }
}

// ============================================================
// Unified Streaming Chat — Auto-selects provider
// ============================================================

export async function streamChat(
    model: string,
    messages: ChatMessage[],
    onChunk: (content: string, done: boolean, metrics?: StreamMetrics) => void,
    onError: (error: string) => void,
    options?: { temperature?: number; max_tokens?: number },
    signal?: AbortSignal,
    onMeta?: (meta: { provider: AIProvider; model: string }) => void,
    forceProvider?: AIProvider
): Promise<void> {
    // Compress messages
    const compressed = compressMessages(messages, 12);

    // Detect which provider to use
    const detection = await detectProvider();

    if (!detection.available) {
        onError("No AI provider available. Configure Gemini API key or run Ollama locally.");
        return;
    }

    const provider = forceProvider || detection.provider;
    const activeModel = provider === "gemini" ? (detection.geminiApiKey ? (detection.model || "gemini-2.0-flash") : model) : model;

    // Notify caller of which provider is being used
    onMeta?.({ provider, model: activeModel });

    if (provider === "gemini" && detection.geminiApiKey) {
        await streamGemini(
            detection.geminiApiKey,
            activeModel,
            compressed,
            onChunk,
            onError,
            options,
            signal
        );
    } else {
        await streamOllama(
            activeModel,
            compressed,
            onChunk,
            onError,
            options,
            signal
        );
    }
}

// ============================================================
// Firestore Chat Memory
// ============================================================

export async function saveChatSession(session: ChatSession): Promise<string> {
    try {
        const cleanMessages = session.messages.map(m => ({
            role: m.role,
            content: m.content,
            timestamp: m.timestamp,
            mode: m.mode,
        }));

        if (session.id) {
            await updateDoc(doc(db, "ai_chats", session.id), {
                messages: cleanMessages,
                mode: session.mode,
                model: session.model,
                updatedAt: new Date().toISOString(),
            });
            return session.id;
        } else {
            const docRef = await addDoc(collection(db, "ai_chats"), {
                userId: session.userId,
                courseId: session.courseId,
                courseTitle: session.courseTitle,
                messages: cleanMessages,
                mode: session.mode,
                model: session.model,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            });
            return docRef.id;
        }
    } catch (err) {
        console.error("Error saving chat session:", err);
        throw err;
    }
}

export async function loadChatSessions(
    userId: string,
    courseId: string
): Promise<ChatSession[]> {
    try {
        const q = query(
            collection(db, "ai_chats"),
            where("userId", "==", userId),
            where("courseId", "==", courseId),
            orderBy("updatedAt", "desc"),
            limit(10)
        );
        const snap = await getDocs(q);
        const sessions: ChatSession[] = [];
        snap.forEach((d) => {
            sessions.push({ id: d.id, ...d.data() } as ChatSession);
        });
        return sessions;
    } catch {
        return [];
    }
}

export async function deleteChatSession(sessionId: string): Promise<void> {
    await deleteDoc(doc(db, "ai_chats", sessionId));
}

// ============================================================
// Admin AI Settings
// ============================================================

export async function getAISettings(): Promise<AISettings> {
    try {
        const snap = await getDocs(collection(db, "ai_settings"));
        if (!snap.empty) {
            return snap.docs[0].data() as AISettings;
        }
    } catch { /* ignore */ }
    return {
        enabled: true,
        model: "llama3",
        maxTokens: 1024,
        temperature: 0.7,
        enabledCourses: [],
        provider: "gemini",
        geminiApiKey: "",
        geminiModel: "gemini-2.0-flash",
    };
}

export async function saveAISettings(settings: AISettings): Promise<void> {
    // Clear the cache when settings are saved
    _cachedSettings = null;
    _settingsCacheTime = 0;

    try {
        const snap = await getDocs(collection(db, "ai_settings"));
        if (!snap.empty) {
            await updateDoc(doc(db, "ai_settings", snap.docs[0].id), settings as any);
        } else {
            await addDoc(collection(db, "ai_settings"), settings as any);
        }
    } catch (err) {
        console.error("Error saving AI settings:", err);
        throw err;
    }
}
