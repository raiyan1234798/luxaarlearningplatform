"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
    Bot, Save, RefreshCw, Trash2, Sparkles,
    Activity, Cpu, Thermometer, Hash, ToggleLeft, ToggleRight,
    AlertCircle,
} from "lucide-react";
import toast from "react-hot-toast";
import {
    checkAIHealth, getAvailableModels,
    getAISettings, saveAISettings,
    type AISettings,
} from "@/lib/ai/aiService";
import { collection, getDocs, query, where, deleteDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase/client";

export default function AISettingsClient() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [health, setHealth] = useState<{ status: string; ollama: string; models: string[] }>({
        status: "unknown",
        ollama: "unknown",
        models: [],
    });
    const [availableModels, setAvailableModels] = useState<{ name: string; size: number }[]>([]);
    const [settings, setSettings] = useState<AISettings>({
        enabled: true,
        model: "llama3",
        maxTokens: 1024,
        temperature: 0.7,
        enabledCourses: [],
    });
    const [chatStats, setChatStats] = useState({ totalChats: 0, totalMessages: 0 });
    const [clearingHistory, setClearingHistory] = useState(false);

    useEffect(() => {
        loadAll();
    }, []);

    async function loadAll() {
        setLoading(true);
        try {
            const [healthData, models, savedSettings] = await Promise.all([
                checkAIHealth(),
                getAvailableModels(),
                getAISettings(),
            ]);
            setHealth(healthData);
            setAvailableModels(models);
            setSettings(savedSettings);
            await loadChatStats();
        } catch (err) {
            console.error("Error loading AI settings:", err);
        } finally {
            setLoading(false);
        }
    }

    async function loadChatStats() {
        try {
            const snap = await getDocs(collection(db, "ai_chats"));
            let totalMessages = 0;
            snap.forEach((d) => {
                const data = d.data();
                totalMessages += (data.messages || []).length;
            });
            setChatStats({ totalChats: snap.size, totalMessages });
        } catch { /* ignore */ }
    }

    async function handleSave() {
        setSaving(true);
        try {
            await saveAISettings(settings);
            toast.success("AI settings saved!");
        } catch (err) {
            toast.error("Failed to save settings");
        } finally {
            setSaving(false);
        }
    }

    async function handleClearAllHistory() {
        if (!confirm("Are you sure you want to delete ALL AI chat history for ALL users? This cannot be undone.")) return;
        setClearingHistory(true);
        try {
            const snap = await getDocs(collection(db, "ai_chats"));
            const deletePromises: Promise<void>[] = [];
            snap.forEach((d) => {
                deletePromises.push(deleteDoc(doc(db, "ai_chats", d.id)));
            });
            await Promise.all(deletePromises);
            setChatStats({ totalChats: 0, totalMessages: 0 });
            toast.success("All AI chat history cleared!");
        } catch (err) {
            toast.error("Failed to clear history");
        } finally {
            setClearingHistory(false);
        }
    }

    async function refreshHealth() {
        const h = await checkAIHealth();
        setHealth(h);
        const m = await getAvailableModels();
        setAvailableModels(m);
        toast.success("Status refreshed!");
    }

    if (loading) {
        return (
            <div style={{ padding: 40, textAlign: "center", color: "var(--text-muted)" }}>
                <div style={{
                    width: 40, height: 40, borderRadius: "50%",
                    border: "3px solid var(--border)", borderTopColor: "#7c3aed",
                    animation: "spin 0.8s linear infinite",
                    margin: "0 auto 16px",
                }} />
                Loading AI settings...
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    return (
        <div style={{ maxWidth: 900 }}>
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ marginBottom: 28 }}
            >
                <h1 style={{
                    fontFamily: "Poppins, sans-serif",
                    fontSize: "clamp(1.5rem, 3vw, 2rem)",
                    fontWeight: 700,
                    color: "var(--text-primary)",
                    marginBottom: 8,
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                }}>
                    <Bot size={28} color="#7c3aed" />
                    Luxaar AI Settings
                </h1>
                <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>
                    Configure the AI tutor powered by Ollama.
                </p>
            </motion.div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
                {/* Status Card */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 }}
                    className="card"
                    style={{ padding: 20 }}
                >
                    <div style={{
                        display: "flex", justifyContent: "space-between",
                        alignItems: "center", marginBottom: 16,
                    }}>
                        <h2 style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 8 }}>
                            <Activity size={16} color="#7c3aed" />
                            AI Status
                        </h2>
                        <button
                            onClick={refreshHealth}
                            className="btn-secondary"
                            style={{ fontSize: 11, padding: "4px 10px" }}
                        >
                            <RefreshCw size={12} style={{ marginRight: 4 }} />
                            Refresh
                        </button>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>Proxy Server</span>
                            <span style={{
                                fontSize: 11, fontWeight: 600,
                                padding: "2px 10px", borderRadius: 999,
                                background: health.status === "online" ? "rgba(74,222,128,0.1)" : "rgba(248,113,113,0.1)",
                                color: health.status === "online" ? "#4ade80" : "#f87171",
                            }}>
                                {health.status === "online" ? "Online" : "Offline"}
                            </span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>Ollama Engine</span>
                            <span style={{
                                fontSize: 11, fontWeight: 600,
                                padding: "2px 10px", borderRadius: 999,
                                background: health.ollama === "connected" ? "rgba(74,222,128,0.1)" : "rgba(248,113,113,0.1)",
                                color: health.ollama === "connected" ? "#4ade80" : "#f87171",
                            }}>
                                {health.ollama === "connected" ? "Connected" : "Disconnected"}
                            </span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>Available Models</span>
                            <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                                {health.models?.length || 0} models
                            </span>
                        </div>
                        {health.models && health.models.length > 0 && (
                            <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                                {health.models.map((m) => (
                                    <span key={m} style={{
                                        fontSize: 10, fontWeight: 600,
                                        padding: "2px 8px", borderRadius: 999,
                                        background: "rgba(124,58,237,0.1)",
                                        color: "#a78bfa",
                                        border: "1px solid rgba(124,58,237,0.2)",
                                    }}>
                                        {m}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                </motion.div>

                {/* Stats Card */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="card"
                    style={{ padding: 20 }}
                >
                    <h2 style={{
                        fontSize: 15, fontWeight: 600,
                        color: "var(--text-primary)",
                        display: "flex", alignItems: "center", gap: 8,
                        marginBottom: 16,
                    }}>
                        <Sparkles size={16} color="#7c3aed" />
                        AI Usage Stats
                    </h2>

                    <div style={{
                        display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12,
                    }}>
                        <div style={{
                            padding: 16, borderRadius: 12,
                            background: "rgba(124,58,237,0.06)",
                            border: "1px solid rgba(124,58,237,0.12)",
                            textAlign: "center",
                        }}>
                            <div style={{ fontSize: 28, fontWeight: 800, color: "#a78bfa", fontFamily: "Poppins" }}>
                                {chatStats.totalChats}
                            </div>
                            <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
                                Total Chats
                            </div>
                        </div>
                        <div style={{
                            padding: 16, borderRadius: 12,
                            background: "rgba(124,58,237,0.06)",
                            border: "1px solid rgba(124,58,237,0.12)",
                            textAlign: "center",
                        }}>
                            <div style={{ fontSize: 28, fontWeight: 800, color: "#a78bfa", fontFamily: "Poppins" }}>
                                {chatStats.totalMessages}
                            </div>
                            <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
                                Total Messages
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={handleClearAllHistory}
                        disabled={clearingHistory || chatStats.totalChats === 0}
                        className="btn-secondary"
                        style={{
                            width: "100%", marginTop: 14,
                            fontSize: 12, color: "#f87171",
                            borderColor: "rgba(248,113,113,0.2)",
                            opacity: clearingHistory || chatStats.totalChats === 0 ? 0.5 : 1,
                        }}
                    >
                        <Trash2 size={13} style={{ marginRight: 6 }} />
                        {clearingHistory ? "Clearing..." : "Clear All Chat History"}
                    </button>
                </motion.div>
            </div>

            {/* Configuration */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="card"
                style={{ padding: 24, marginBottom: 20 }}
            >
                <h2 style={{
                    fontSize: 15, fontWeight: 600,
                    color: "var(--text-primary)",
                    display: "flex", alignItems: "center", gap: 8,
                    marginBottom: 20,
                }}>
                    <Cpu size={16} color="#7c3aed" />
                    Configuration
                </h2>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                    {/* Enable/Disable */}
                    <div style={{ gridColumn: "1 / -1" }}>
                        <label style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}>
                            <button
                                onClick={() => setSettings(p => ({ ...p, enabled: !p.enabled }))}
                                style={{
                                    width: 44, height: 24, borderRadius: 12,
                                    background: settings.enabled
                                        ? "linear-gradient(135deg, #7c3aed, #5b21b6)"
                                        : "var(--bg-secondary)",
                                    border: settings.enabled
                                        ? "none"
                                        : "1px solid var(--border)",
                                    cursor: "pointer",
                                    position: "relative",
                                    transition: "all 0.3s",
                                    flexShrink: 0,
                                }}
                            >
                                <span style={{
                                    position: "absolute",
                                    top: 2, left: settings.enabled ? 22 : 2,
                                    width: 20, height: 20,
                                    borderRadius: "50%",
                                    background: "#fff",
                                    transition: "left 0.3s",
                                    boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
                                }} />
                            </button>
                            <div>
                                <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>
                                    Enable AI Chatbot
                                </div>
                                <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                                    Show AI tutor widget for students on the platform
                                </div>
                            </div>
                        </label>
                    </div>

                    {/* Model Selection */}
                    <div>
                        <label className="label" style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <Bot size={12} /> AI Model
                        </label>
                        <select
                            className="input"
                            value={settings.model}
                            onChange={(e) => setSettings(p => ({ ...p, model: e.target.value }))}
                        >
                            <option value="llama3">LLaMA 3 (Recommended)</option>
                            <option value="llama3.1">LLaMA 3.1</option>
                            <option value="llama3.2">LLaMA 3.2</option>
                            <option value="mistral">Mistral</option>
                            <option value="mixtral">Mixtral</option>
                            <option value="phi3">Phi-3</option>
                            <option value="gemma2">Gemma 2</option>
                            <option value="qwen2">Qwen 2</option>
                            {availableModels
                                .filter(m => !["llama3", "llama3.1", "llama3.2", "mistral", "mixtral", "phi3", "gemma2", "qwen2"].includes(m.name.split(":")[0]))
                                .map(m => (
                                    <option key={m.name} value={m.name}>
                                        {m.name} (Local)
                                    </option>
                                ))
                            }
                        </select>
                    </div>

                    {/* Max Tokens */}
                    <div>
                        <label className="label" style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <Hash size={12} /> Max Response Tokens
                        </label>
                        <input
                            className="input"
                            type="number"
                            min={128}
                            max={8192}
                            value={settings.maxTokens}
                            onChange={(e) => setSettings(p => ({ ...p, maxTokens: parseInt(e.target.value) || 1024 }))}
                        />
                        <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>
                            Higher = longer responses but slower. Default: 1024
                        </p>
                    </div>

                    {/* Temperature */}
                    <div style={{ gridColumn: "1 / -1" }}>
                        <label className="label" style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <Thermometer size={12} /> Temperature: {settings.temperature.toFixed(1)}
                        </label>
                        <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.1"
                            value={settings.temperature}
                            onChange={(e) => setSettings(p => ({ ...p, temperature: parseFloat(e.target.value) }))}
                            style={{ width: "100%", accentColor: "#7c3aed" }}
                        />
                        <div style={{
                            display: "flex", justifyContent: "space-between",
                            fontSize: 10, color: "var(--text-muted)", marginTop: 2,
                        }}>
                            <span>Precise (0.0)</span>
                            <span>Balanced (0.5)</span>
                            <span>Creative (1.0)</span>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Setup Guide */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="card"
                style={{ padding: 24, marginBottom: 20 }}
            >
                <h2 style={{
                    fontSize: 15, fontWeight: 600,
                    color: "var(--text-primary)",
                    display: "flex", alignItems: "center", gap: 8,
                    marginBottom: 16,
                }}>
                    <AlertCircle size={16} color="#c9a84c" />
                    Quick Setup Guide
                </h2>

                <div style={{
                    background: "var(--bg-secondary)",
                    borderRadius: 12,
                    padding: 16,
                    fontSize: 13,
                    lineHeight: 1.8,
                    color: "var(--text-secondary)",
                }}>
                    <div style={{ marginBottom: 12 }}>
                        <strong style={{ color: "var(--text-primary)" }}>1. Install Ollama</strong>
                        <div style={{
                            background: "rgba(0,0,0,0.3)",
                            padding: "8px 12px",
                            borderRadius: 8,
                            fontFamily: "monospace",
                            fontSize: 12,
                            marginTop: 4,
                            color: "#a78bfa",
                        }}>
                            curl -fsSL https://ollama.com/install.sh | sh
                        </div>
                    </div>
                    <div style={{ marginBottom: 12 }}>
                        <strong style={{ color: "var(--text-primary)" }}>2. Pull a model</strong>
                        <div style={{
                            background: "rgba(0,0,0,0.3)",
                            padding: "8px 12px",
                            borderRadius: 8,
                            fontFamily: "monospace",
                            fontSize: 12,
                            marginTop: 4,
                            color: "#a78bfa",
                        }}>
                            ollama pull llama3
                        </div>
                    </div>
                    <div style={{ marginBottom: 12 }}>
                        <strong style={{ color: "var(--text-primary)" }}>3. Start Ollama</strong>
                        <div style={{
                            background: "rgba(0,0,0,0.3)",
                            padding: "8px 12px",
                            borderRadius: 8,
                            fontFamily: "monospace",
                            fontSize: 12,
                            marginTop: 4,
                            color: "#a78bfa",
                        }}>
                            ollama serve
                        </div>
                    </div>
                    <div>
                        <strong style={{ color: "var(--text-primary)" }}>4. Start AI Proxy Server</strong>
                        <div style={{
                            background: "rgba(0,0,0,0.3)",
                            padding: "8px 12px",
                            borderRadius: 8,
                            fontFamily: "monospace",
                            fontSize: 12,
                            marginTop: 4,
                            color: "#a78bfa",
                        }}>
                            cd server && npm install && npm start
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Save Button */}
            <div style={{
                position: "sticky", bottom: 0,
                background: "var(--bg-primary)",
                padding: "16px 0",
                borderTop: "1px solid var(--border)",
                display: "flex", justifyContent: "flex-end",
            }}>
                <button
                    className="btn-primary"
                    onClick={handleSave}
                    disabled={saving}
                    style={{ display: "flex", alignItems: "center", gap: 8 }}
                >
                    <Save size={16} />
                    {saving ? "Saving..." : "Save Settings"}
                </button>
            </div>
        </div>
    );
}
