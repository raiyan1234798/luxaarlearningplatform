/**
 * Luxaar AI Proxy Server v2.0 — Ultra-Premium Edition
 * 
 * Express server acting as a secure proxy between Luxaar frontend
 * and locally-running Ollama LLM engine.
 * 
 * Features:
 *   - Streaming SSE with per-token metadata (timing, token count)
 *   - Multi-model hot-switching
 *   - Request queuing with concurrency control
 *   - Context length optimization (auto-truncation)
 *   - Performance metrics per response
 *   - Warm-up endpoint for model preloading
 */

const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.AI_PORT || 3001;
const OLLAMA_URL = process.env.OLLAMA_URL || "http://localhost:11434";

// ============================================================
// Concurrency & Queue
// ============================================================
const MAX_CONCURRENT = 2;
let activeRequests = 0;
const requestQueue = [];

function enqueueRequest(handler) {
    return new Promise((resolve, reject) => {
        const task = async () => {
            activeRequests++;
            try {
                const result = await handler();
                resolve(result);
            } catch (err) {
                reject(err);
            } finally {
                activeRequests--;
                processQueue();
            }
        };

        if (activeRequests < MAX_CONCURRENT) {
            task();
        } else {
            requestQueue.push(task);
        }
    });
}

function processQueue() {
    while (requestQueue.length > 0 && activeRequests < MAX_CONCURRENT) {
        const next = requestQueue.shift();
        next();
    }
}

// ============================================================
// Performance stats (in-memory)
// ============================================================
const stats = {
    totalRequests: 0,
    totalTokens: 0,
    avgResponseTimeMs: 0,
    modelUsage: {},
    errors: 0,
};

// CORS — allow frontend origins
const ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://localhost:5173",
    "http://127.0.0.1:3000",
    "https://luxaarlearning.web.app",
    "https://luxaarlearning.firebaseapp.com",
];

app.use(cors({
    origin: (origin, callback) => {
        if (!origin || ALLOWED_ORIGINS.includes(origin)) {
            callback(null, true);
        } else {
            console.warn(`Blocked CORS request from: ${origin}`);
            callback(null, true); // Allow all in dev
        }
    },
    credentials: true,
}));

app.use(express.json({ limit: "10mb" }));

// ============================================================
// Context Length Optimization — Compress messages to fit context window
// ============================================================

const MODEL_CONTEXT_LIMITS = {
    "llama3": 8192,
    "llama3.1": 8192,
    "llama3.2": 8192,
    "llama3:latest": 8192,
    "llama3.1:latest": 8192,
    "llama3.2:latest": 8192,
    "mistral": 32768,
    "mistral:latest": 32768,
    "mixtral": 32768,
    "phi3": 4096,
    "gemma2": 8192,
    "qwen2": 32768,
};

function estimateTokens(text) {
    // Rough estimation: ~4 chars per token for English
    return Math.ceil((text || "").length / 4);
}

function optimizeContext(model, messages, maxResponseTokens = 1024) {
    const modelBase = model.split(":")[0];
    const contextLimit = MODEL_CONTEXT_LIMITS[model] || MODEL_CONTEXT_LIMITS[modelBase] || 8192;
    const availableTokens = contextLimit - maxResponseTokens - 200; // 200 token buffer

    // Estimate total current tokens
    let totalTokens = 0;
    for (const msg of messages) {
        totalTokens += estimateTokens(msg.content) + 4; // overhead per message
    }

    // If within limit, return as-is
    if (totalTokens <= availableTokens) {
        return { messages, truncated: false, estimatedTokens: totalTokens };
    }

    // Strategy: Keep system prompt + last N messages, compress middle
    const optimized = [];
    const systemMsg = messages.find(m => m.role === "system");
    const nonSystem = messages.filter(m => m.role !== "system");

    if (systemMsg) {
        optimized.push(systemMsg);
        totalTokens = estimateTokens(systemMsg.content) + 4;
    } else {
        totalTokens = 0;
    }

    // Keep as many recent messages as possible
    const recentMessages = [];
    for (let i = nonSystem.length - 1; i >= 0; i--) {
        const msgTokens = estimateTokens(nonSystem[i].content) + 4;
        if (totalTokens + msgTokens > availableTokens) {
            // Compress older messages into a summary placeholder
            if (i > 0) {
                const skipped = i + 1;
                optimized.push({
                    role: "system",
                    content: `[${skipped} earlier messages omitted for context optimization. Focus on the most recent conversation.]`,
                });
            }
            break;
        }
        totalTokens += msgTokens;
        recentMessages.unshift(nonSystem[i]);
    }

    optimized.push(...recentMessages);

    return {
        messages: optimized,
        truncated: true,
        estimatedTokens: totalTokens,
        originalTokens: messages.reduce((sum, m) => sum + estimateTokens(m.content) + 4, 0),
    };
}

// ============================================================
// Health check (enhanced)
// ============================================================
app.get("/health", async (req, res) => {
    try {
        const startTime = Date.now();
        const response = await fetch(`${OLLAMA_URL}/api/tags`);
        const latencyMs = Date.now() - startTime;

        if (response.ok) {
            const data = await response.json();
            res.json({
                status: "online",
                ollama: "connected",
                latencyMs,
                models: data.models?.map(m => m.name) || [],
                stats: {
                    totalRequests: stats.totalRequests,
                    totalTokens: stats.totalTokens,
                    avgResponseTimeMs: Math.round(stats.avgResponseTimeMs),
                    activeRequests,
                    queuedRequests: requestQueue.length,
                },
                timestamp: new Date().toISOString(),
            });
        } else {
            res.json({ status: "online", ollama: "disconnected", latencyMs });
        }
    } catch (err) {
        res.json({ status: "online", ollama: "disconnected", error: err.message });
    }
});

// ============================================================
// List available models (enhanced with details)
// ============================================================
app.get("/models", async (req, res) => {
    try {
        const response = await fetch(`${OLLAMA_URL}/api/tags`);
        if (!response.ok) throw new Error("Ollama not reachable");
        const data = await response.json();
        res.json({
            models: (data.models || []).map(m => ({
                name: m.name,
                size: m.size,
                modified_at: m.modified_at,
                contextLength: MODEL_CONTEXT_LIMITS[m.name] || MODEL_CONTEXT_LIMITS[m.name.split(":")[0]] || 8192,
                details: m.details || {},
            })),
        });
    } catch (err) {
        res.status(503).json({ error: "Ollama is offline", details: err.message });
    }
});

// ============================================================
// Warm-up endpoint — preload model into memory
// ============================================================
app.post("/warmup", async (req, res) => {
    const { model } = req.body;
    if (!model) return res.status(400).json({ error: "model is required" });

    try {
        const response = await fetch(`${OLLAMA_URL}/api/chat`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                model,
                messages: [{ role: "user", content: "hi" }],
                stream: false,
                options: { num_predict: 1 },
            }),
        });
        if (response.ok) {
            res.json({ status: "warmed_up", model });
        } else {
            res.status(500).json({ error: "Warmup failed" });
        }
    } catch (err) {
        res.status(503).json({ error: "Ollama offline", details: err.message });
    }
});

// ============================================================
// Chat endpoint (streaming) — Ultra-Premium v2
// ============================================================
app.post("/chat", async (req, res) => {
    const { model, messages, options } = req.body;

    if (!model || !messages || !Array.isArray(messages)) {
        return res.status(400).json({ error: "model and messages[] are required" });
    }

    const startTime = Date.now();
    stats.totalRequests++;
    stats.modelUsage[model] = (stats.modelUsage[model] || 0) + 1;

    // Optimize context length
    const maxTokens = options?.max_tokens ?? 1024;
    const { messages: optimizedMessages, truncated, estimatedTokens } = optimizeContext(model, messages, maxTokens);

    try {
        await enqueueRequest(async () => {
            const ollamaRes = await fetch(`${OLLAMA_URL}/api/chat`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    model,
                    messages: optimizedMessages,
                    stream: true,
                    options: {
                        temperature: options?.temperature ?? 0.7,
                        num_predict: maxTokens,
                        top_p: options?.top_p ?? 0.9,
                        top_k: options?.top_k ?? 40,
                        repeat_penalty: 1.1,
                    },
                }),
            });

            if (!ollamaRes.ok) {
                stats.errors++;
                const errorText = await ollamaRes.text();
                if (!res.headersSent) {
                    res.status(ollamaRes.status).json({
                        error: "Ollama request failed",
                        details: errorText,
                    });
                }
                return;
            }

            // Stream SSE response with enhanced metadata
            res.setHeader("Content-Type", "text/event-stream");
            res.setHeader("Cache-Control", "no-cache");
            res.setHeader("Connection", "keep-alive");
            res.setHeader("X-Accel-Buffering", "no");

            // Send initial metadata
            res.write(`data: ${JSON.stringify({
                type: "meta",
                model,
                contextOptimized: truncated,
                estimatedInputTokens: estimatedTokens,
                queuePosition: 0,
                startTime: Date.now(),
            })}\n\n`);

            const reader = ollamaRes.body.getReader();
            const decoder = new TextDecoder();
            let buffer = "";
            let tokenCount = 0;
            let firstTokenTime = null;

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split("\n");
                buffer = lines.pop() || "";

                for (const line of lines) {
                    if (!line.trim()) continue;
                    try {
                        const parsed = JSON.parse(line);
                        const content = parsed.message?.content || "";
                        if (content) {
                            tokenCount++;
                            if (!firstTokenTime) firstTokenTime = Date.now();

                            res.write(`data: ${JSON.stringify({
                                type: "token",
                                content,
                                done: false,
                                tokenIndex: tokenCount,
                                elapsedMs: Date.now() - startTime,
                            })}\n\n`);
                        }
                        if (parsed.done) {
                            const totalDuration = Date.now() - startTime;
                            const timeToFirstToken = firstTokenTime ? firstTokenTime - startTime : 0;

                            stats.totalTokens += tokenCount;
                            stats.avgResponseTimeMs = (stats.avgResponseTimeMs * (stats.totalRequests - 1) + totalDuration) / stats.totalRequests;

                            res.write(`data: ${JSON.stringify({
                                type: "done",
                                content: "",
                                done: true,
                                metrics: {
                                    totalTokens: tokenCount,
                                    totalDurationMs: totalDuration,
                                    timeToFirstTokenMs: timeToFirstToken,
                                    tokensPerSecond: tokenCount > 0 ? Math.round(tokenCount / (totalDuration / 1000)) : 0,
                                    model,
                                    contextOptimized: truncated,
                                },
                            })}\n\n`);
                        }
                    } catch (e) { /* skip */ }
                }
            }

            // Process remaining buffer
            if (buffer.trim()) {
                try {
                    const parsed = JSON.parse(buffer);
                    if (parsed.message?.content) {
                        tokenCount++;
                        res.write(`data: ${JSON.stringify({
                            type: "token",
                            content: parsed.message.content,
                            done: false,
                            tokenIndex: tokenCount,
                        })}\n\n`);
                    }
                    if (parsed.done) {
                        const totalDuration = Date.now() - startTime;
                        stats.totalTokens += tokenCount;

                        res.write(`data: ${JSON.stringify({
                            type: "done",
                            content: "",
                            done: true,
                            metrics: {
                                totalTokens: tokenCount,
                                totalDurationMs: totalDuration,
                                tokensPerSecond: Math.round(tokenCount / (totalDuration / 1000)),
                                model,
                            },
                        })}\n\n`);
                    }
                } catch (e) { }
            }

            res.write("data: [DONE]\n\n");
            res.end();
        });
    } catch (err) {
        stats.errors++;
        console.error("Chat error:", err);
        if (!res.headersSent) {
            res.status(503).json({
                error: "AI is temporarily unavailable",
                details: err.message,
            });
        } else {
            res.write(`data: ${JSON.stringify({ type: "error", error: "Stream interrupted" })}\n\n`);
            res.end();
        }
    }
});

// ============================================================
// Chat endpoint (non-streaming)
// ============================================================
app.post("/chat/sync", async (req, res) => {
    const { model, messages, options } = req.body;

    if (!model || !messages) {
        return res.status(400).json({ error: "model and messages[] are required" });
    }

    const maxTokens = options?.max_tokens ?? 1024;
    const { messages: optimizedMessages } = optimizeContext(model, messages, maxTokens);

    try {
        const ollamaRes = await fetch(`${OLLAMA_URL}/api/chat`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                model,
                messages: optimizedMessages,
                stream: false,
                options: {
                    temperature: options?.temperature ?? 0.7,
                    num_predict: maxTokens,
                },
            }),
        });

        if (!ollamaRes.ok) {
            const errText = await ollamaRes.text();
            return res.status(ollamaRes.status).json({ error: errText });
        }

        const data = await ollamaRes.json();
        res.json({
            content: data.message?.content || "",
            model: data.model,
            total_duration: data.total_duration,
        });
    } catch (err) {
        res.status(503).json({ error: "AI is temporarily unavailable", details: err.message });
    }
});

// ============================================================
// Server stats endpoint (for admin)
// ============================================================
app.get("/stats", (req, res) => {
    res.json({
        ...stats,
        activeRequests,
        queuedRequests: requestQueue.length,
        uptime: process.uptime(),
    });
});

// ============================================================
// Start server
// ============================================================
app.listen(PORT, () => {
    console.log(`
╔══════════════════════════════════════════╗
║   🧠 Luxaar AI Proxy Server v2.0       ║
║   Port: ${PORT}                            ║
║   Ollama: ${OLLAMA_URL}       ║
║   Max Concurrent: ${MAX_CONCURRENT}                     ║
╚══════════════════════════════════════════╝
    `);
    // Check Ollama connection on startup
    fetch(`${OLLAMA_URL}/api/tags`)
        .then(r => r.json())
        .then(data => {
            const models = data.models?.map(m => m.name).join(", ") || "none";
            console.log(`✅ Ollama connected! Available models: ${models}`);
        })
        .catch(() => {
            console.log("⚠️  Ollama is not running. Start it with: ollama serve");
        });
});
