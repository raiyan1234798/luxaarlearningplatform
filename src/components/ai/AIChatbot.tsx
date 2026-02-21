"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Bot, X, Send, Sparkles, Maximize2, Minimize2,
    Trash2, ChevronDown, RotateCcw, Loader2,
    GraduationCap, FileText, Microscope, ClipboardList, Code2,
    WifiOff, History, Zap, Brain, Activity, Square, ArrowDown,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useAuth } from "@/lib/contexts/AuthContext";
import {
    type AIMode, type AIProvider, type ChatMessage, type CourseContext, type ChatSession,
    type StreamMetrics,
    MODE_LABELS, buildSystemPrompt, streamChat, checkAIHealth,
    saveChatSession, loadChatSessions, deleteChatSession, getAISettings,
    getAvailableModels, warmupModel,
} from "@/lib/ai/aiService";

interface AIChatbotProps {
    courseContext?: CourseContext;
}

const MODE_ICONS: Record<AIMode, React.ReactNode> = {
    tutor: <GraduationCap size={14} />,
    notes: <FileText size={14} />,
    deepdive: <Microscope size={14} />,
    exam: <ClipboardList size={14} />,
    code: <Code2 size={14} />,
};

export default function AIChatbot({ courseContext }: AIChatbotProps) {
    const { user, profile } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [mode, setMode] = useState<AIMode>("tutor");
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState("");
    const [isStreaming, setIsStreaming] = useState(false);
    const [streamingText, setStreamingText] = useState("");
    const [aiOnline, setAiOnline] = useState<boolean | null>(null);
    const [model, setModel] = useState("llama3");
    const [maxTokens, setMaxTokens] = useState(1024);
    const [temperature, setTemperature] = useState(0.7);
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [showHistory, setShowHistory] = useState(false);
    const [chatHistory, setChatHistory] = useState<ChatSession[]>([]);
    const [aiEnabled, setAiEnabled] = useState(true);

    // v2 Premium state
    const [availableModels, setAvailableModels] = useState<{ name: string; size: number; contextLength?: number; provider?: AIProvider }[]>([]);
    const [showModelPicker, setShowModelPicker] = useState(false);
    const [thinkingPhase, setThinkingPhase] = useState<string | null>(null);
    const [streamMetrics, setStreamMetrics] = useState<StreamMetrics | null>(null);
    const [tokenCount, setTokenCount] = useState(0);
    const [showScrollBtn, setShowScrollBtn] = useState(false);
    const [isWarmingUp, setIsWarmingUp] = useState(false);

    // v3 Cloud provider state
    const [activeProvider, setActiveProvider] = useState<AIProvider>("gemini");
    const [activeModel, setActiveModel] = useState("gemini-2.0-flash");

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const abortRef = useRef<AbortController | null>(null);
    const chatContainerRef = useRef<HTMLDivElement>(null);
    const streamStartTimeRef = useRef<number>(0);

    // Check AI health on mount
    useEffect(() => {
        checkHealth();
        loadSettings();
    }, []);

    // Auto scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, streamingText]);

    // Scroll detection
    useEffect(() => {
        const container = chatContainerRef.current;
        if (!container) return;
        const handleScroll = () => {
            const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 80;
            setShowScrollBtn(!isNearBottom);
        };
        container.addEventListener("scroll", handleScroll);
        return () => container.removeEventListener("scroll", handleScroll);
    }, [isOpen]);

    async function checkHealth() {
        const health = await checkAIHealth();
        const isOnline = health.gemini === "connected" || health.ollama === "connected";
        setAiOnline(isOnline);
        setActiveProvider(health.activeProvider || "gemini");
        if (health.activeProvider === "gemini" && health.geminiModel) {
            setActiveModel(health.geminiModel);
        } else if (health.activeProvider === "ollama") {
            setActiveModel(model);
        }
    }

    async function loadSettings() {
        try {
            const [settings, models] = await Promise.all([
                getAISettings(),
                getAvailableModels(),
            ]);
            setAiEnabled(settings.enabled);
            setModel(settings.model || "llama3");
            setMaxTokens(settings.maxTokens || 1024);
            setTemperature(settings.temperature || 0.7);
            setAvailableModels(models);
        } catch { /* use defaults */ }
    }

    async function loadHistory() {
        if (!user || !courseContext) return;
        const sessions = await loadChatSessions(user.uid, courseContext.courseId);
        setChatHistory(sessions);
        setShowHistory(true);
    }

    async function resumeSession(session: ChatSession) {
        setMessages(session.messages.filter(m => m.role !== "system"));
        setSessionId(session.id || null);
        setMode(session.mode);
        setShowHistory(false);
    }

    async function deleteSession(sessionIdToDelete: string) {
        await deleteChatSession(sessionIdToDelete);
        setChatHistory(prev => prev.filter(s => s.id !== sessionIdToDelete));
        if (sessionId === sessionIdToDelete) {
            clearChat();
        }
    }

    function clearChat() {
        setMessages([]);
        setStreamingText("");
        setSessionId(null);
        setStreamMetrics(null);
        setTokenCount(0);
    }

    async function handleModelSwitch(newModel: string) {
        setModel(newModel);
        setShowModelPicker(false);

        // Warm up the model in background
        setIsWarmingUp(true);
        try {
            await warmupModel(newModel);
        } catch { /* ignore */ }
        setIsWarmingUp(false);
    }

    function scrollToBottom() {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }

    async function handleSend() {
        const text = input.trim();
        if (!text || isStreaming) return;

        const userMsg: ChatMessage = {
            role: "user",
            content: text,
            timestamp: new Date().toISOString(),
            mode,
        };

        const updatedMessages = [...messages, userMsg];
        setMessages(updatedMessages);
        setInput("");
        setIsStreaming(true);
        setStreamingText("");
        setStreamMetrics(null);
        setTokenCount(0);
        streamStartTimeRef.current = Date.now();

        // Thinking phases
        setThinkingPhase("Analyzing your question...");
        setTimeout(() => {
            if (streamStartTimeRef.current && !streamingText) {
                setThinkingPhase("Building context...");
            }
        }, 800);
        setTimeout(() => {
            if (streamStartTimeRef.current && !streamingText) {
                setThinkingPhase("Generating response...");
            }
        }, 2000);

        // Build full message array with system prompt
        const systemMsg: ChatMessage = {
            role: "system",
            content: buildSystemPrompt(mode, courseContext),
        };
        const fullMessages = [systemMsg, ...updatedMessages];

        const controller = new AbortController();
        abortRef.current = controller;

        let accumulated = "";
        let localTokenCount = 0;

        await streamChat(
            model,
            fullMessages,
            (content, done, metrics) => {
                if (content) {
                    accumulated += content;
                    localTokenCount++;
                    setStreamingText(accumulated);
                    setTokenCount(localTokenCount);
                    setThinkingPhase(null); // Stop thinking indicator on first token
                }
                if (done) {
                    const assistantMsg: ChatMessage = {
                        role: "assistant",
                        content: accumulated,
                        timestamp: new Date().toISOString(),
                        mode,
                        metrics: metrics || undefined,
                    };
                    setMessages(prev => [...prev, assistantMsg]);
                    setStreamingText("");
                    setIsStreaming(false);
                    setThinkingPhase(null);
                    setStreamMetrics(metrics || null);
                    streamStartTimeRef.current = 0;

                    // Save to Firestore
                    if (user && courseContext) {
                        const session: ChatSession = {
                            id: sessionId || undefined,
                            userId: user.uid,
                            courseId: courseContext.courseId,
                            courseTitle: courseContext.courseTitle,
                            messages: [...updatedMessages, assistantMsg],
                            mode,
                            model,
                            createdAt: new Date().toISOString(),
                            updatedAt: new Date().toISOString(),
                        };
                        saveChatSession(session).then(id => setSessionId(id)).catch(() => { });
                    }
                }
            },
            (error) => {
                setStreamingText("");
                setIsStreaming(false);
                setThinkingPhase(null);
                streamStartTimeRef.current = 0;
                const errMsg: ChatMessage = {
                    role: "assistant",
                    content: `⚠️ ${error}\n\n✦ Generated by Luxaar AI`,
                    timestamp: new Date().toISOString(),
                };
                setMessages(prev => [...prev, errMsg]);
            },
            { temperature, max_tokens: maxTokens },
            controller.signal,
            (meta) => {
                if (meta.provider) setActiveProvider(meta.provider);
                if (meta.model) setActiveModel(meta.model);
                setThinkingPhase(`Using ${meta.provider === "gemini" ? "Gemini Cloud" : "Ollama Local"}...`);
            }
        );
    }

    function stopStreaming() {
        abortRef.current?.abort();
        if (streamingText) {
            const assistantMsg: ChatMessage = {
                role: "assistant",
                content: streamingText + "\n\n*[Response stopped]*",
                timestamp: new Date().toISOString(),
            };
            setMessages(prev => [...prev, assistantMsg]);
        }
        setStreamingText("");
        setIsStreaming(false);
        setThinkingPhase(null);
        streamStartTimeRef.current = 0;
    }

    function handleKeyDown(e: React.KeyboardEvent) {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    }

    if (!user || !aiEnabled) return null;

    const chatWindowStyle: React.CSSProperties = isFullscreen
        ? {
            position: "fixed", inset: 0, zIndex: 9999,
            width: "100%", height: "100%", borderRadius: 0,
        }
        : {
            position: "fixed", bottom: 96, right: 24,
            width: 440, maxWidth: "calc(100vw - 32px)",
            height: 640, maxHeight: "calc(100dvh - 120px)",
            borderRadius: 20, zIndex: 9999,
        };

    return (
        <>
            {/* Floating Trigger Button */}
            <AnimatePresence>
                {!isOpen && (
                    <motion.button
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        whileHover={{ scale: 1.08 }}
                        whileTap={{ scale: 0.92 }}
                        onClick={() => { setIsOpen(true); checkHealth(); }}
                        title="Open Luxaar AI Chatbot"
                        aria-label="Open Luxaar AI Chatbot"
                        style={{
                            position: "fixed", bottom: 24, right: 90,
                            width: 56, height: 56, borderRadius: "50%",
                            background: "linear-gradient(135deg, #7c3aed, #6d28d9, #5b21b6)",
                            border: "none",
                            boxShadow: "0 4px 24px rgba(124,58,237,0.5), inset 0 1px 0 rgba(255,255,255,0.2)",
                            color: "white", display: "flex", alignItems: "center", justifyContent: "center",
                            cursor: "pointer", zIndex: 51,
                        }}
                        id="ai-chatbot-trigger"
                    >
                        <Bot size={26} />
                        <span style={{
                            position: "absolute", inset: -4,
                            borderRadius: "50%",
                            border: "2px solid rgba(124,58,237,0.4)",
                            animation: "ai-pulse 2s ease-in-out infinite",
                        }} />
                    </motion.button>
                )}
            </AnimatePresence>

            {/* Chat Window */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 30, scale: 0.92 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 30, scale: 0.92 }}
                        transition={{ type: "spring", damping: 25, stiffness: 350 }}
                        style={{
                            ...chatWindowStyle,
                            display: "flex", flexDirection: "column",
                            background: "var(--bg-primary)",
                            border: isFullscreen ? "none" : "1px solid var(--border)",
                            boxShadow: isFullscreen ? "none" : "0 20px 60px rgba(0,0,0,0.3), 0 0 40px rgba(124,58,237,0.1)",
                            overflow: "hidden",
                            backdropFilter: "blur(20px)",
                        }}
                    >
                        {/* Header */}
                        <div style={{
                            padding: "12px 16px",
                            background: "linear-gradient(135deg, rgba(124,58,237,0.15), rgba(109,40,217,0.08))",
                            borderBottom: "1px solid var(--border)",
                            display: "flex", alignItems: "center", justifyContent: "space-between",
                            flexShrink: 0,
                        }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                <div style={{
                                    width: 34, height: 34, borderRadius: 10,
                                    background: "linear-gradient(135deg, #7c3aed, #5b21b6)",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    position: "relative",
                                }}>
                                    <Sparkles size={16} color="#fff" />
                                    {isStreaming && (
                                        <motion.span
                                            animate={{ rotate: 360 }}
                                            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                            style={{
                                                position: "absolute", inset: -2,
                                                borderRadius: 12,
                                                border: "2px solid transparent",
                                                borderTopColor: "#a78bfa",
                                            }}
                                        />
                                    )}
                                </div>
                                <div>
                                    <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.01em" }}>
                                        Luxaar AI
                                    </div>
                                    <div style={{
                                        fontSize: 10, color: aiOnline ? "#4ade80" : "#f87171",
                                        display: "flex", alignItems: "center", gap: 4,
                                    }}>
                                        <span style={{
                                            width: 6, height: 6, borderRadius: "50%",
                                            background: aiOnline ? "#4ade80" : "#f87171",
                                            display: "inline-block",
                                            animation: aiOnline ? "ai-status-pulse 2s ease-in-out infinite" : "none",
                                        }} />
                                        {aiOnline === null ? "Checking..." : aiOnline ? `${activeProvider === "gemini" ? "☁️ Cloud" : "💻 Local"} • ${activeModel.split(":")[0]}` : "Offline"}
                                        {isWarmingUp && (
                                            <span style={{ color: "#fbbf24", marginLeft: 4, fontSize: 9 }}>
                                                (warming up...)
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                                {/* Model Switcher */}
                                <div style={{ position: "relative" }}>
                                    <button
                                        onClick={() => setShowModelPicker(!showModelPicker)}
                                        title="Switch Model"
                                        aria-label="Switch AI Model"
                                        style={{
                                            ...iconBtnStyle,
                                            fontSize: 9, fontWeight: 700,
                                            minWidth: 30,
                                            color: showModelPicker ? "#a78bfa" : "var(--text-secondary)",
                                            borderColor: showModelPicker ? "rgba(124,58,237,0.3)" : "rgba(255,255,255,0.08)",
                                        }}
                                    >
                                        <Zap size={13} />
                                    </button>

                                    <AnimatePresence>
                                        {showModelPicker && (
                                            <motion.div
                                                initial={{ opacity: 0, y: -4, scale: 0.95 }}
                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                exit={{ opacity: 0, y: -4, scale: 0.95 }}
                                                style={{
                                                    position: "absolute", top: "100%", right: 0,
                                                    marginTop: 6, minWidth: 200,
                                                    background: "var(--bg-primary)",
                                                    border: "1px solid var(--border)",
                                                    borderRadius: 12,
                                                    boxShadow: "0 12px 40px rgba(0,0,0,0.3)",
                                                    overflow: "hidden",
                                                    zIndex: 100,
                                                }}
                                            >
                                                <div style={{
                                                    padding: "10px 12px 6px",
                                                    fontSize: 10, fontWeight: 700,
                                                    color: "var(--text-muted)",
                                                    textTransform: "uppercase",
                                                    letterSpacing: 1,
                                                }}>
                                                    Switch Model
                                                </div>
                                                {availableModels.length > 0 ? (
                                                    availableModels.map(m => (
                                                        <button
                                                            key={m.name}
                                                            onClick={() => handleModelSwitch(m.name)}
                                                            style={{
                                                                width: "100%",
                                                                padding: "10px 12px",
                                                                border: "none",
                                                                background: model === m.name
                                                                    ? "rgba(124,58,237,0.1)"
                                                                    : "transparent",
                                                                color: model === m.name
                                                                    ? "#a78bfa"
                                                                    : "var(--text-primary)",
                                                                fontSize: 12, fontWeight: 500,
                                                                cursor: "pointer",
                                                                display: "flex",
                                                                justifyContent: "space-between",
                                                                alignItems: "center",
                                                                textAlign: "left",
                                                                transition: "background 0.15s",
                                                            }}
                                                            onMouseEnter={e => e.currentTarget.style.background = "rgba(124,58,237,0.06)"}
                                                            onMouseLeave={e => e.currentTarget.style.background = model === m.name ? "rgba(124,58,237,0.1)" : "transparent"}
                                                        >
                                                            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                                                {activeModel === m.name && <span style={{
                                                                    width: 6, height: 6, borderRadius: "50%",
                                                                    background: "#4ade80",
                                                                }} />}
                                                                {m.name.split(":")[0]}
                                                            </span>
                                                            <span style={{
                                                                fontSize: 9, color: "var(--text-muted)",
                                                                background: "var(--bg-secondary)",
                                                                padding: "2px 6px",
                                                                borderRadius: 4,
                                                            }}>
                                                                {m.provider === "gemini" ? "☁️ Cloud" : m.size ? `💻 ${(m.size / 1e9).toFixed(1)}GB` : "💻 Local"}
                                                            </span>
                                                        </button>
                                                    ))
                                                ) : (
                                                    <div style={{
                                                        padding: "12px",
                                                        fontSize: 11,
                                                        color: "var(--text-muted)",
                                                        textAlign: "center",
                                                    }}>
                                                        No AI configured.
                                                        <br />Set Gemini API key in Admin → AI Settings
                                                    </div>
                                                )}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>

                                {courseContext && (
                                    <button onClick={loadHistory} title="Chat History" aria-label="Chat History"
                                        style={iconBtnStyle}><History size={15} /></button>
                                )}
                                <button onClick={clearChat} title="New Chat" aria-label="New Chat"
                                    style={iconBtnStyle}><RotateCcw size={15} /></button>
                                <button onClick={() => setIsFullscreen(!isFullscreen)} title="Toggle Fullscreen" aria-label="Toggle Fullscreen"
                                    style={iconBtnStyle}>
                                    {isFullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
                                </button>
                                <button onClick={() => { setIsOpen(false); setIsFullscreen(false); setShowModelPicker(false); }} title="Close" aria-label="Close"
                                    style={iconBtnStyle}><X size={15} /></button>
                            </div>
                        </div>

                        {/* Mode Selector */}
                        <div style={{
                            padding: "8px 12px",
                            borderBottom: "1px solid var(--border)",
                            display: "flex", gap: 4, overflowX: "auto",
                            flexShrink: 0,
                            scrollbarWidth: "none",
                        }}>
                            {(Object.keys(MODE_LABELS) as AIMode[]).map((m) => (
                                <button
                                    key={m}
                                    onClick={() => setMode(m)}
                                    style={{
                                        padding: "5px 10px",
                                        borderRadius: 8,
                                        border: mode === m ? "1px solid rgba(124,58,237,0.4)" : "1px solid transparent",
                                        background: mode === m ? "rgba(124,58,237,0.12)" : "transparent",
                                        color: mode === m ? "#a78bfa" : "var(--text-muted)",
                                        fontSize: 11, fontWeight: 600,
                                        cursor: "pointer",
                                        display: "flex", alignItems: "center", gap: 4,
                                        whiteSpace: "nowrap",
                                        transition: "all 0.2s",
                                    }}
                                    title={MODE_LABELS[m].desc}
                                >
                                    {MODE_LABELS[m].emoji} {MODE_LABELS[m].label}
                                </button>
                            ))}
                        </div>

                        {/* Chat History Panel */}
                        <AnimatePresence>
                            {showHistory && (
                                <motion.div
                                    initial={{ height: 0 }}
                                    animate={{ height: "auto" }}
                                    exit={{ height: 0 }}
                                    style={{
                                        overflow: "hidden",
                                        borderBottom: "1px solid var(--border)",
                                        background: "var(--bg-secondary)",
                                        flexShrink: 0,
                                    }}
                                >
                                    <div style={{ padding: "10px 12px", maxHeight: 200, overflowY: "auto" }}>
                                        <div style={{
                                            display: "flex", justifyContent: "space-between",
                                            alignItems: "center", marginBottom: 8,
                                        }}>
                                            <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)" }}>
                                                Chat History
                                            </span>
                                            <button onClick={() => setShowHistory(false)}
                                                style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: 11 }}>
                                                Close
                                            </button>
                                        </div>
                                        {chatHistory.length === 0 ? (
                                            <p style={{ fontSize: 12, color: "var(--text-muted)", textAlign: "center", padding: 16 }}>
                                                No previous chats for this course.
                                            </p>
                                        ) : (
                                            chatHistory.map((s) => (
                                                <div
                                                    key={s.id}
                                                    style={{
                                                        padding: "8px 10px",
                                                        borderRadius: 8,
                                                        border: "1px solid var(--border)",
                                                        marginBottom: 6,
                                                        display: "flex",
                                                        justifyContent: "space-between",
                                                        alignItems: "center",
                                                        cursor: "pointer",
                                                        background: sessionId === s.id ? "rgba(124,58,237,0.08)" : "transparent",
                                                    }}
                                                    onClick={() => resumeSession(s)}
                                                >
                                                    <div>
                                                        <div style={{ fontSize: 12, fontWeight: 500, color: "var(--text-primary)" }}>
                                                            {MODE_LABELS[s.mode]?.emoji} {s.messages.filter(m => m.role === "user").length} messages
                                                        </div>
                                                        <div style={{ fontSize: 10, color: "var(--text-muted)" }}>
                                                            {new Date(s.updatedAt).toLocaleDateString()}
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); deleteSession(s.id!); }}
                                                        style={{ background: "none", border: "none", color: "#f87171", cursor: "pointer", padding: 4 }}
                                                    >
                                                        <Trash2 size={12} />
                                                    </button>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Messages */}
                        <div
                            ref={chatContainerRef}
                            style={{
                                flex: 1, overflowY: "auto", padding: "16px 14px",
                                display: "flex", flexDirection: "column", gap: 14,
                                position: "relative",
                            }}
                        >
                            {/* Offline Banner */}
                            {aiOnline === false && (
                                <div style={{
                                    padding: "12px 14px", borderRadius: 12,
                                    background: "rgba(248,113,113,0.08)",
                                    border: "1px solid rgba(248,113,113,0.2)",
                                    display: "flex", alignItems: "center", gap: 10,
                                    fontSize: 13, color: "#f87171",
                                }}>
                                    <WifiOff size={18} />
                                    <div>
                                        <div style={{ fontWeight: 600 }}>AI Temporarily Unavailable</div>
                                        <div style={{ fontSize: 11, opacity: 0.8 }}>
                                            Please ensure Ollama is running locally.
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Welcome */}
                            {messages.length === 0 && !streamingText && (
                                <div style={{ textAlign: "center", padding: "30px 20px" }}>
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{ type: "spring", delay: 0.1 }}
                                    >
                                        <div style={{
                                            width: 64, height: 64, borderRadius: 18,
                                            background: "linear-gradient(135deg, #7c3aed, #5b21b6)",
                                            display: "flex", alignItems: "center", justifyContent: "center",
                                            margin: "0 auto 16px",
                                            boxShadow: "0 8px 30px rgba(124,58,237,0.3)",
                                        }}>
                                            <Sparkles size={28} color="#fff" />
                                        </div>
                                    </motion.div>
                                    <h3 style={{
                                        fontSize: 18, fontWeight: 700,
                                        color: "var(--text-primary)",
                                        fontFamily: "Poppins, sans-serif",
                                        marginBottom: 6,
                                    }}>
                                        Luxaar AI {MODE_LABELS[mode].label}
                                    </h3>
                                    <p style={{
                                        fontSize: 13, color: "var(--text-muted)",
                                        lineHeight: 1.5, maxWidth: 280, margin: "0 auto 6px",
                                    }}>
                                        {courseContext
                                            ? `Ask me anything about "${courseContext.courseTitle}".`
                                            : "Ask me anything about your courses."
                                        }
                                    </p>

                                    {/* Model indicator */}
                                    <div style={{
                                        fontSize: 10, color: "var(--text-muted)",
                                        display: "flex", alignItems: "center", gap: 4,
                                        justifyContent: "center", marginBottom: 16, opacity: 0.7,
                                    }}>
                                        <Zap size={10} /> {activeProvider === "gemini" ? "☁️" : "💻"} {activeModel.split(":")[0]} • {MODE_LABELS[mode].emoji} {MODE_LABELS[mode].label} Mode
                                    </div>

                                    {/* Quick Suggestions */}
                                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                                        {[
                                            "Explain the key concepts of this lesson",
                                            "Create summary notes for revision",
                                            "Help me prepare for the exam",
                                        ].map((suggestion, i) => (
                                            <motion.button
                                                key={i}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: 0.2 + i * 0.1 }}
                                                onClick={() => { setInput(suggestion); }}
                                                style={{
                                                    padding: "10px 14px",
                                                    borderRadius: 10,
                                                    border: "1px solid var(--border)",
                                                    background: "var(--bg-secondary)",
                                                    color: "var(--text-secondary)",
                                                    fontSize: 12, cursor: "pointer",
                                                    textAlign: "left",
                                                    transition: "all 0.2s",
                                                }}
                                                onMouseEnter={(e) => {
                                                    e.currentTarget.style.borderColor = "rgba(124,58,237,0.3)";
                                                    e.currentTarget.style.background = "rgba(124,58,237,0.05)";
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.currentTarget.style.borderColor = "var(--border)";
                                                    e.currentTarget.style.background = "var(--bg-secondary)";
                                                }}
                                            >
                                                {suggestion}
                                            </motion.button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Message Bubbles */}
                            {messages.map((msg, i) => (
                                <MessageBubble key={i} message={msg} />
                            ))}

                            {/* Streaming Message */}
                            {isStreaming && streamingText && (
                                <MessageBubble
                                    message={{ role: "assistant", content: streamingText }}
                                    isStreaming
                                    tokenCount={tokenCount}
                                    elapsedMs={Date.now() - streamStartTimeRef.current}
                                />
                            )}

                            {/* AI Thinking Indicator — Premium */}
                            {isStreaming && !streamingText && (
                                <ThinkingIndicator phase={thinkingPhase} />
                            )}

                            <div ref={messagesEndRef} />
                        </div>

                        {/* Scroll to bottom button */}
                        <AnimatePresence>
                            {showScrollBtn && (
                                <motion.button
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.8 }}
                                    onClick={scrollToBottom}
                                    aria-label="Scroll to bottom"
                                    style={{
                                        position: "absolute", bottom: 100, left: "50%", transform: "translateX(-50%)",
                                        width: 32, height: 32, borderRadius: "50%",
                                        background: "var(--bg-primary)",
                                        border: "1px solid var(--border)",
                                        color: "var(--text-muted)",
                                        cursor: "pointer",
                                        display: "flex", alignItems: "center", justifyContent: "center",
                                        boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
                                        zIndex: 10,
                                    }}
                                >
                                    <ArrowDown size={14} />
                                </motion.button>
                            )}
                        </AnimatePresence>

                        {/* Performance Metrics Bar */}
                        <AnimatePresence>
                            {streamMetrics && !isStreaming && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    style={{
                                        flexShrink: 0,
                                        borderTop: "1px solid var(--border)",
                                        background: "rgba(124,58,237,0.03)",
                                        overflow: "hidden",
                                    }}
                                >
                                    <div style={{
                                        padding: "6px 14px",
                                        display: "flex", gap: 12, justifyContent: "center",
                                        fontSize: 10, color: "var(--text-muted)",
                                    }}>
                                        <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
                                            <Activity size={10} color="#a78bfa" />
                                            {streamMetrics.tokensPerSecond} tok/s
                                        </span>
                                        <span>•</span>
                                        <span>{streamMetrics.totalTokens} tokens</span>
                                        <span>•</span>
                                        <span>
                                            {streamMetrics.timeToFirstTokenMs
                                                ? `TTFT: ${streamMetrics.timeToFirstTokenMs}ms`
                                                : `${(streamMetrics.totalDurationMs / 1000).toFixed(1)}s`
                                            }
                                        </span>
                                        {streamMetrics.contextOptimized && (
                                            <>
                                                <span>•</span>
                                                <span style={{ color: "#fbbf24" }}>context optimized</span>
                                            </>
                                        )}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Input Area */}
                        <div style={{
                            padding: "12px 14px",
                            borderTop: "1px solid var(--border)",
                            background: "var(--bg-secondary)",
                            flexShrink: 0,
                        }}>
                            {isStreaming && (
                                <div style={{ marginBottom: 8, display: "flex", justifyContent: "center" }}>
                                    <button
                                        onClick={stopStreaming}
                                        style={{
                                            padding: "5px 16px",
                                            borderRadius: 999,
                                            border: "1px solid rgba(248,113,113,0.3)",
                                            background: "rgba(248,113,113,0.1)",
                                            color: "#f87171",
                                            fontSize: 11, fontWeight: 600,
                                            cursor: "pointer",
                                            display: "flex", alignItems: "center", gap: 5,
                                            transition: "all 0.2s",
                                        }}
                                    >
                                        <Square size={10} style={{ fill: "#f87171" }} /> Stop generating
                                    </button>
                                </div>
                            )}
                            <div style={{
                                display: "flex", gap: 8, alignItems: "flex-end",
                            }}>
                                <textarea
                                    ref={inputRef}
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder={aiOnline === false ? "AI is offline..." : `Ask Luxaar AI (${MODE_LABELS[mode].label} mode)...`}
                                    disabled={aiOnline === false || isStreaming}
                                    style={{
                                        flex: 1,
                                        padding: "10px 14px",
                                        borderRadius: 12,
                                        border: "1px solid var(--border)",
                                        background: "var(--bg-primary)",
                                        color: "var(--text-primary)",
                                        fontSize: 13,
                                        resize: "none",
                                        minHeight: 42, maxHeight: 120,
                                        outline: "none",
                                        fontFamily: "inherit",
                                        lineHeight: 1.5,
                                        transition: "border-color 0.2s",
                                    }}
                                    onFocus={(e) => e.currentTarget.style.borderColor = "rgba(124,58,237,0.5)"}
                                    onBlur={(e) => e.currentTarget.style.borderColor = "var(--border)"}
                                    rows={1}
                                />
                                <button
                                    onClick={handleSend}
                                    disabled={!input.trim() || isStreaming || aiOnline === false}
                                    aria-label="Send message"
                                    style={{
                                        width: 42, height: 42, borderRadius: 12,
                                        background: input.trim() && !isStreaming
                                            ? "linear-gradient(135deg, #7c3aed, #5b21b6)"
                                            : "var(--bg-secondary)",
                                        border: "none",
                                        color: input.trim() && !isStreaming ? "#fff" : "var(--text-muted)",
                                        cursor: input.trim() && !isStreaming ? "pointer" : "not-allowed",
                                        display: "flex", alignItems: "center", justifyContent: "center",
                                        flexShrink: 0,
                                        transition: "all 0.2s",
                                    }}
                                >
                                    <Send size={16} />
                                </button>
                            </div>
                            <div style={{
                                fontSize: 10, color: "var(--text-muted)",
                                textAlign: "center", marginTop: 6, opacity: 0.6,
                            }}>
                                Powered by {activeProvider === "gemini" ? "Google Gemini" : "Ollama"} • Privacy-first AI
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Global styles */}
            <style>{`
                @keyframes ai-pulse {
                    0%, 100% { transform: scale(1); opacity: 0.6; }
                    50% { transform: scale(1.3); opacity: 0; }
                }
                @keyframes ai-status-pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.4; }
                }
                @keyframes ai-shimmer {
                    0% { background-position: -200% 0; }
                    100% { background-position: 200% 0; }
                }
                @keyframes ai-thinking-dot {
                    0%, 80%, 100% { transform: scale(0.6); opacity: 0.3; }
                    40% { transform: scale(1); opacity: 1; }
                }
                @keyframes ai-cursor-blink {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0; }
                }
                .ai-markdown-content h1, .ai-markdown-content h2, .ai-markdown-content h3 {
                    margin: 8px 0 4px; font-weight: 700;
                }
                .ai-markdown-content h1 { font-size: 16px; }
                .ai-markdown-content h2 { font-size: 14px; }
                .ai-markdown-content h3 { font-size: 13px; }
                .ai-markdown-content p { margin: 4px 0; }
                .ai-markdown-content ul, .ai-markdown-content ol {
                    margin: 4px 0; padding-left: 18px;
                }
                .ai-markdown-content li { margin: 2px 0; }
                .ai-markdown-content code {
                    background: rgba(124,58,237,0.1);
                    padding: 1px 5px; border-radius: 4px;
                    font-size: 12px; font-family: "SF Mono", "Fira Code", monospace;
                }
                .ai-markdown-content pre {
                    background: rgba(0,0,0,0.3);
                    border-radius: 8px;
                    padding: 12px;
                    overflow-x: auto;
                    margin: 8px 0;
                }
                .ai-markdown-content pre code {
                    background: transparent;
                    padding: 0; font-size: 12px;
                }
                .ai-markdown-content blockquote {
                    border-left: 3px solid #7c3aed;
                    padding-left: 12px;
                    margin: 8px 0;
                    opacity: 0.85;
                }
                .ai-markdown-content strong { color: var(--text-primary); }
                .ai-markdown-content table {
                    border-collapse: collapse;
                    width: 100%;
                    margin: 8px 0;
                    font-size: 12px;
                }
                .ai-markdown-content th, .ai-markdown-content td {
                    border: 1px solid var(--border);
                    padding: 6px 10px;
                    text-align: left;
                }
                .ai-markdown-content th {
                    background: var(--bg-secondary);
                    font-weight: 600;
                }
            `}</style>
        </>
    );
}

// ============================================================
// Premium Thinking Indicator
// ============================================================

function ThinkingIndicator({ phase }: { phase: string | null }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
                display: "flex", gap: 10, alignItems: "center",
                padding: "14px 16px",
                background: "var(--bg-secondary)",
                borderRadius: "16px 16px 16px 4px",
                width: "fit-content",
                border: "1px solid var(--border)",
            }}
        >
            {/* Animated brain icon */}
            <div style={{ position: "relative", width: 24, height: 24 }}>
                <motion.div
                    animate={{
                        scale: [1, 1.15, 1],
                        rotate: [0, 5, -5, 0],
                    }}
                    transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut",
                    }}
                    style={{
                        display: "flex", alignItems: "center", justifyContent: "center",
                    }}
                >
                    <Brain size={20} color="#7c3aed" />
                </motion.div>
                {/* Orbiting dots */}
                {[0, 1, 2].map(i => (
                    <motion.span
                        key={i}
                        animate={{
                            rotate: 360,
                        }}
                        transition={{
                            duration: 1.5,
                            repeat: Infinity,
                            ease: "linear",
                            delay: i * 0.5,
                        }}
                        style={{
                            position: "absolute",
                            top: -2, left: 10,
                            width: 4, height: 4,
                            borderRadius: "50%",
                            background: "#a78bfa",
                            opacity: 0.7,
                            transformOrigin: "2px 14px",
                        }}
                    />
                ))}
            </div>

            {/* Phase text with shimmer */}
            <div>
                <motion.div
                    key={phase}
                    initial={{ opacity: 0, x: -4 }}
                    animate={{ opacity: 1, x: 0 }}
                    style={{
                        fontSize: 12, fontWeight: 600,
                        background: "linear-gradient(90deg, #a78bfa, #7c3aed, #c4b5fd, #a78bfa)",
                        backgroundSize: "200% 100%",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        animation: "ai-shimmer 2s linear infinite",
                    }}
                >
                    {phase || "Thinking..."}
                </motion.div>
                <div style={{
                    display: "flex", gap: 3, marginTop: 4,
                }}>
                    {[0, 1, 2, 3, 4, 5].map(i => (
                        <motion.span
                            key={i}
                            animate={{ scaleY: [0.3, 1, 0.3] }}
                            transition={{
                                duration: 0.8,
                                repeat: Infinity,
                                delay: i * 0.1,
                                ease: "easeInOut",
                            }}
                            style={{
                                width: 3, height: 12,
                                borderRadius: 2,
                                background: "linear-gradient(to top, #7c3aed, #a78bfa)",
                                display: "block",
                                transformOrigin: "bottom",
                            }}
                        />
                    ))}
                </div>
            </div>
        </motion.div>
    );
}

// ============================================================
// Message Bubble Component (Enhanced)
// ============================================================

function MessageBubble({
    message,
    isStreaming,
    tokenCount,
    elapsedMs,
}: {
    message: ChatMessage;
    isStreaming?: boolean;
    tokenCount?: number;
    elapsedMs?: number;
}) {
    const isUser = message.role === "user";

    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            style={{
                display: "flex",
                justifyContent: isUser ? "flex-end" : "flex-start",
            }}
        >
            <div style={{
                maxWidth: "85%",
                padding: "10px 14px",
                borderRadius: isUser ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                background: isUser
                    ? "linear-gradient(135deg, #7c3aed, #6d28d9)"
                    : "var(--bg-secondary)",
                color: isUser ? "#fff" : "var(--text-primary)",
                fontSize: 13,
                lineHeight: 1.55,
                border: isUser ? "none" : "1px solid var(--border)",
                position: "relative",
            }}>
                {isUser ? (
                    <div style={{ whiteSpace: "pre-wrap" }}>{message.content}</div>
                ) : (
                    <div className="ai-markdown-content">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {message.content}
                        </ReactMarkdown>
                    </div>
                )}

                {/* Streaming cursor */}
                {isStreaming && (
                    <span style={{
                        display: "inline-block",
                        width: 2, height: 16,
                        background: "#7c3aed",
                        borderRadius: 1,
                        marginLeft: 2,
                        verticalAlign: "text-bottom",
                        animation: "ai-cursor-blink 0.6s ease-in-out infinite",
                    }} />
                )}

                {/* Live streaming stats */}
                {isStreaming && tokenCount !== undefined && tokenCount > 0 && (
                    <div style={{
                        fontSize: 9, color: "var(--text-muted)",
                        marginTop: 6, opacity: 0.5,
                        display: "flex", alignItems: "center", gap: 6,
                    }}>
                        <span style={{ display: "flex", alignItems: "center", gap: 2 }}>
                            <Activity size={8} /> {tokenCount} tokens
                        </span>
                        {elapsedMs && elapsedMs > 0 && (
                            <span>• {Math.round(tokenCount / (elapsedMs / 1000))} tok/s</span>
                        )}
                    </div>
                )}

                {/* Completed response metrics */}
                {!isStreaming && message.metrics && (
                    <div style={{
                        fontSize: 9, color: "var(--text-muted)",
                        marginTop: 6, opacity: 0.5,
                        display: "flex", alignItems: "center", gap: 6,
                    }}>
                        <Activity size={8} />
                        <span>{message.metrics.totalTokens} tokens</span>
                        <span>• {message.metrics.tokensPerSecond} tok/s</span>
                        <span>• {(message.metrics.totalDurationMs / 1000).toFixed(1)}s</span>
                    </div>
                )}
            </div>
        </motion.div>
    );
}

// Shared icon button style
const iconBtnStyle: React.CSSProperties = {
    width: 30, height: 30, borderRadius: 8,
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.08)",
    color: "var(--text-secondary)",
    cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center",
    transition: "all 0.2s",
    flexShrink: 0,
};
