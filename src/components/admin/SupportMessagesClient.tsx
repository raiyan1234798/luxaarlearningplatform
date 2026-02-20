"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { collection, query, orderBy, getDocs, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { CheckCircle, Clock, Mail, MessageSquare, Trash2, User } from "lucide-react";
import toast from "react-hot-toast";

interface SupportMessage {
    id: string;
    user_id: string;
    user_email: string;
    user_name: string;
    message: string;
    status: "new" | "resolved";
    created_at: string;
}

export default function SupportMessagesClient() {
    const [messages, setMessages] = useState<SupportMessage[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<"all" | "new" | "resolved">("all");

    useEffect(() => {
        fetchMessages();
    }, []);

    async function fetchMessages() {
        setLoading(true);
        try {
            const q = query(collection(db, "support_messages"), orderBy("created_at", "desc"));
            const querySnapshot = await getDocs(q);
            const msgs: SupportMessage[] = [];
            querySnapshot.forEach((doc) => {
                msgs.push({ id: doc.id, ...doc.data() } as SupportMessage);
            });
            setMessages(msgs);
        } catch (error) {
            console.error("Error fetching messages:", error);
            toast.error("Failed to load messages");
        } finally {
            setLoading(false);
        }
    }

    async function markResolved(id: string) {
        try {
            await updateDoc(doc(db, "support_messages", id), {
                status: "resolved"
            });
            setMessages(prev => prev.map(msg =>
                msg.id === id ? { ...msg, status: "resolved" } : msg
            ));
            toast.success("Marked as resolved");
        } catch (error) {
            console.error("Error updating message:", error);
            toast.error("Failed to update message");
        }
    }

    async function deleteMessage(id: string) {
        if (!confirm("Are you sure you want to delete this message?")) return;
        try {
            await deleteDoc(doc(db, "support_messages", id));
            setMessages(prev => prev.filter(msg => msg.id !== id));
            toast.success("Message deleted");
        } catch (error) {
            console.error("Error deleting message:", error);
            toast.error("Failed to delete message");
        }
    }

    const filteredMessages = messages.filter(msg => {
        if (filter === "all") return true;
        return msg.status === filter;
    });

    if (loading) {
        return <div className="p-8 text-center">Loading messages...</div>;
    }

    return (
        <div style={{ maxWidth: 1000 }}>
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
                    marginBottom: 8
                }}>
                    Support Messages
                </h1>
                <p style={{ color: "var(--text-secondary)" }}>
                    View and manage inquiries from students.
                </p>
            </motion.div>

            {/* Filters */}
            <div style={{ display: "flex", gap: 12, marginBottom: 24 }}>
                <button
                    className={filter === "all" ? "btn-primary" : "btn-secondary"}
                    onClick={() => setFilter("all")}
                    style={{ fontSize: 13, padding: "6px 16px" }}
                >
                    All Messages
                </button>
                <button
                    className={filter === "new" ? "btn-primary" : "btn-secondary"}
                    onClick={() => setFilter("new")}
                    style={{ fontSize: 13, padding: "6px 16px" }}
                >
                    Found New ({messages.filter(m => m.status === "new").length})
                </button>
                <button
                    className={filter === "resolved" ? "btn-primary" : "btn-secondary"}
                    onClick={() => setFilter("resolved")}
                    style={{ fontSize: 13, padding: "6px 16px" }}
                >
                    Resolved
                </button>
            </div>

            {/* Messages List */}
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {filteredMessages.length === 0 ? (
                    <div className="card" style={{ padding: 40, textAlign: "center", color: "var(--text-muted)" }}>
                        <MessageSquare size={48} style={{ opacity: 0.2, marginBottom: 16 }} />
                        <p>No messages found matching your filter.</p>
                    </div>
                ) : (
                    filteredMessages.map((msg, index) => (
                        <motion.div
                            key={msg.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="card"
                            style={{
                                padding: 20,
                                borderLeft: msg.status === "new" ? "4px solid #c9a84c" : "4px solid var(--border)",
                                opacity: msg.status === "resolved" ? 0.8 : 1
                            }}
                        >
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                                <div style={{ display: "flex", gap: 12 }}>
                                    <div style={{
                                        width: 40, height: 40, borderRadius: "50%",
                                        background: "var(--bg-secondary)",
                                        display: "flex", alignItems: "center", justifyContent: "center"
                                    }}>
                                        <User size={20} color="var(--text-secondary)" />
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>{msg.user_name}</div>
                                        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--text-muted)" }}>
                                            <Mail size={12} />
                                            {msg.user_email}
                                        </div>
                                    </div>
                                </div>
                                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
                                    <div style={{
                                        display: "flex", alignItems: "center", gap: 6,
                                        fontSize: 12, color: "var(--text-muted)"
                                    }}>
                                        <Clock size={12} />
                                        {new Date(msg.created_at).toLocaleString()}
                                    </div>
                                    {msg.status === "new" && (
                                        <span style={{
                                            fontSize: 10, fontWeight: 600,
                                            background: "rgba(201,168,76,0.15)", color: "#c9a84c",
                                            padding: "2px 8px", borderRadius: 999
                                        }}>
                                            NEW
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div style={{
                                background: "var(--bg-secondary)",
                                padding: 16,
                                borderRadius: 8,
                                fontSize: 14,
                                lineHeight: 1.6,
                                color: "var(--text-primary)",
                                marginBottom: 16,
                                whiteSpace: "pre-wrap"
                            }}>
                                {msg.message}
                            </div>

                            <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
                                <button
                                    onClick={() => deleteMessage(msg.id)}
                                    className="btn-secondary"
                                    style={{ fontSize: 12, color: "#ef4444", borderColor: "rgba(239,68,68,0.2)" }}
                                >
                                    <Trash2 size={14} style={{ marginRight: 6 }} />
                                    Delete
                                </button>
                                {msg.status === "new" && (
                                    <button
                                        onClick={() => markResolved(msg.id)}
                                        className="btn-primary"
                                        style={{ fontSize: 12 }}
                                    >
                                        <CheckCircle size={14} style={{ marginRight: 6 }} />
                                        Mark as Resolved
                                    </button>
                                )}
                            </div>
                        </motion.div>
                    ))
                )}
            </div>
        </div>
    );
}
