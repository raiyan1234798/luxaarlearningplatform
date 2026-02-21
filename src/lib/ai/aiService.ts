/**
 * Luxaar AI Service Client v2.0 — Ultra-Premium Edition
 * 
 * Handles communication with the Luxaar AI proxy server.
 * Features:
 *   - Token-by-token streaming with performance metrics
 *   - Smart prompt compression
 *   - Multi-model support with warm-up
 *   - Context length optimization
 *   - Firestore-based chat memory
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

// ============================================================
// Config
// ============================================================

const AI_SERVER_URL = process.env.NEXT_PUBLIC_AI_SERVER_URL || "http://localhost:3001";

export type AIMode = "tutor" | "notes" | "deepdive" | "exam" | "code";

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
}

export interface StreamMetrics {
    totalTokens: number;
    totalDurationMs: number;
    timeToFirstTokenMs: number;
    tokensPerSecond: number;
    model: string;
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

/**
 * Compresses conversation history to reduce token usage.
 * Keeps the most recent messages and summarizes older ones.
 */
export function compressMessages(messages: ChatMessage[], maxMessages = 10): ChatMessage[] {
    if (messages.length <= maxMessages) return messages;

    const systemMsgs = messages.filter(m => m.role === "system");
    const nonSystem = messages.filter(m => m.role !== "system");

    // Keep last N messages
    const recent = nonSystem.slice(-maxMessages);

    // Summarize older messages
    const olderCount = nonSystem.length - maxMessages;
    if (olderCount > 0) {
        const compressionNote: ChatMessage = {
            role: "system",
            content: `[Context: ${olderCount} earlier messages omitted. The student has been asking about topics in this course. Continue the conversation naturally based on the recent messages below.]`,
        };
        return [...systemMsgs, compressionNote, ...recent];
    }

    return [...systemMsgs, ...recent];
}

/**
 * Strips unnecessary whitespace and redundant content from prompts.
 */
export function compressPrompt(prompt: string): string {
    return prompt
        .replace(/\n{3,}/g, "\n\n")      // Collapse multiple newlines
        .replace(/[ \t]{2,}/g, " ")       // Collapse multiple spaces
        .replace(/^\s+/gm, "")            // Remove leading whitespace per line (but preserve markdown)
        .trim();
}

// ============================================================
// Build System Prompt (Enhanced)
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
            // Compress instructor notes if too long
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
// Health Check (Enhanced)
// ============================================================

export async function checkAIHealth(): Promise<{
    status: string;
    ollama: string;
    models: string[];
    latencyMs?: number;
    stats?: {
        totalRequests: number;
        totalTokens: number;
        avgResponseTimeMs: number;
        activeRequests: number;
        queuedRequests: number;
    };
}> {
    try {
        const res = await fetch(`${AI_SERVER_URL}/health`, { signal: AbortSignal.timeout(5000) });
        if (!res.ok) throw new Error("Server unreachable");
        return await res.json();
    } catch {
        return { status: "offline", ollama: "disconnected", models: [] };
    }
}

// ============================================================
// Get Available Models (Enhanced)
// ============================================================

export async function getAvailableModels(): Promise<{
    name: string;
    size: number;
    contextLength?: number;
}[]> {
    try {
        const res = await fetch(`${AI_SERVER_URL}/models`, { signal: AbortSignal.timeout(5000) });
        if (!res.ok) throw new Error("Failed to fetch models");
        const data = await res.json();
        return data.models || [];
    } catch {
        return [];
    }
}

// ============================================================
// Model Warm-up
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
// Streaming Chat v2.0 — Token-by-token with metrics
// ============================================================

export async function streamChat(
    model: string,
    messages: ChatMessage[],
    onChunk: (content: string, done: boolean, metrics?: StreamMetrics) => void,
    onError: (error: string) => void,
    options?: { temperature?: number; max_tokens?: number },
    signal?: AbortSignal,
    onMeta?: (meta: { type: string; estimatedInputTokens?: number; contextOptimized?: boolean }) => void
): Promise<void> {
    // Compress messages before sending
    const compressed = compressMessages(messages, 12);

    try {
        const res = await fetch(`${AI_SERVER_URL}/chat`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                model,
                messages: compressed.map(m => ({ role: m.role, content: m.content })),
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

                    // Handle different message types from v2 server
                    if (parsed.type === "meta") {
                        onMeta?.({
                            type: "meta",
                            estimatedInputTokens: parsed.estimatedInputTokens,
                            contextOptimized: parsed.contextOptimized,
                        });
                    } else if (parsed.type === "token") {
                        onChunk(parsed.content || "", false);
                    } else if (parsed.type === "done") {
                        onChunk("", true, parsed.metrics);
                    } else if (parsed.type === "error") {
                        onError(parsed.error || "Stream error");
                    } else {
                        // Backwards compatibility with v1 format
                        onChunk(parsed.content || "", parsed.done || false);
                    }
                } catch { /* skip */ }
            }
        }

        onChunk("", true);
    } catch (err: any) {
        if (err.name === "AbortError") return;
        onError("AI is temporarily unavailable. Please ensure Ollama is running.");
    }
}

// ============================================================
// Firestore Chat Memory
// ============================================================

export async function saveChatSession(session: ChatSession): Promise<string> {
    try {
        // Strip metrics from messages before saving (reduce Firestore size)
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
    };
}

export async function saveAISettings(settings: AISettings): Promise<void> {
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
