"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { collection, query, orderBy, getDocs, doc, updateDoc, deleteDoc, addDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { useAuth } from "@/lib/contexts/AuthContext";
import { CheckCircle, Clock, Mail, MessageSquare, Trash2, User, Send, Reply, ChevronDown, ChevronUp } from "lucide-react";
import toast from "react-hot-toast";

interface SupportReply {
    id?: string;
    sender: "admin" | "user";
    sender_name: string;
    sender_email: string;
    message: string;
    created_at: string;
}

interface SupportMessage {
    id: string;
    user_id: string;
    user_email: string;
    user_name: string;
    message: string;
    status: "new" | "resolved";
    created_at: string;
    replies?: SupportReply[];
}

export default function SupportMessagesClient() {
    const { profile } = useAuth();
    const [messages, setMessages] = useState<SupportMessage[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<"all" | "new" | "resolved">("all");
    const [replyingTo, setReplyingTo] = useState<string | null>(null);
    const [replyText, setReplyText] = useState("");
    const [sendingReply, setSendingReply] = useState(false);
    const [expandedMessages, setExpandedMessages] = useState<Set<string>>(new Set());

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
                const data = doc.data();
                msgs.push({
                    id: doc.id,
                    ...data,
                    replies: data.replies || [],
                } as SupportMessage);
            });
            setMessages(msgs);
        } catch (error) {
            console.error("Error fetching messages:", error);
            toast.error("Failed to load messages");
        } finally {
            setLoading(false);
        }
    }

    async function sendReply(msgId: string) {
        if (!replyText.trim()) return;

        const msg = messages.find(m => m.id === msgId);
        if (!msg) return;

        setSendingReply(true);
        try {
            const newReply: SupportReply = {
                sender: "admin",
                sender_name: profile?.full_name || "Admin",
                sender_email: profile?.email || "",
                message: replyText.trim(),
                created_at: new Date().toISOString(),
            };

            const existingReplies = msg.replies || [];
            const updatedReplies = [...existingReplies, newReply];

            // Update the support message with the new reply
            await updateDoc(doc(db, "support_messages", msgId), {
                replies: updatedReplies,
                status: "new", // Keep it active when admin replies
            });

            // Create a notification for the user so they see the reply
            await addDoc(collection(db, "notifications"), {
                user_id: msg.user_id,
                type: "support_reply",
                title: "Support Reply 💬",
                message: `Admin replied to your support message: "${replyText.trim().length > 80 ? replyText.trim().substring(0, 80) + "..." : replyText.trim()}"`,
                is_read: false,
                created_at: new Date().toISOString(),
            });

            // Update local state
            setMessages(prev => prev.map(m =>
                m.id === msgId ? { ...m, replies: updatedReplies, status: "new" as const } : m
            ));

            setReplyText("");
            setReplyingTo(null);
            setExpandedMessages(prev => new Set([...prev, msgId]));
            toast.success("Reply sent & notification created for the user!");
        } catch (error) {
            console.error("Error sending reply:", error);
            toast.error("Failed to send reply");
        } finally {
            setSendingReply(false);
        }
    }

    async function markResolved(id: string) {
        try {
            await updateDoc(doc(db, "support_messages", id), {
                status: "resolved"
            });

            const msg = messages.find(m => m.id === id);
            if (msg) {
                // Notify the user that their issue has been resolved
                await addDoc(collection(db, "notifications"), {
                    user_id: msg.user_id,
                    type: "support_reply",
                    title: "Issue Resolved ✅",
                    message: `Your support message has been marked as resolved. If you still need help, feel free to reach out again.`,
                    is_read: false,
                    created_at: new Date().toISOString(),
                });
            }

            setMessages(prev => prev.map(msg =>
                msg.id === id ? { ...msg, status: "resolved" } : msg
            ));
            toast.success("Marked as resolved & user notified");
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

    function toggleExpanded(msgId: string) {
        setExpandedMessages(prev => {
            const next = new Set(prev);
            if (next.has(msgId)) next.delete(msgId);
            else next.add(msgId);
            return next;
        });
    }

    const filteredMessages = messages.filter(msg => {
        if (filter === "all") return true;
        return msg.status === filter;
    });

    if (loading) {
        return (
            <div style={{ padding: 40, textAlign: "center", color: "var(--text-muted)" }}>
                <div style={{
                    width: 40, height: 40, borderRadius: "50%",
                    border: "3px solid var(--border)", borderTopColor: "#c9a84c",
                    animation: "spin 0.8s linear infinite",
                    margin: "0 auto 16px"
                }} />
                Loading messages...
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        );
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
                    View, reply, and manage inquiries from students.
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
                                padding: 0,
                                overflow: "hidden",
                                borderLeft: msg.status === "new" ? "4px solid #c9a84c" : msg.status === "resolved" ? "4px solid #4ade80" : "4px solid var(--border)",
                                opacity: msg.status === "resolved" ? 0.85 : 1
                            }}
                        >
                            {/* Header */}
                            <div style={{ padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                                <div style={{ display: "flex", gap: 12 }}>
                                    <div style={{
                                        width: 40, height: 40, borderRadius: "50%",
                                        background: "linear-gradient(135deg, #c9a84c, #a07830)",
                                        display: "flex", alignItems: "center", justifyContent: "center",
                                        color: "#0a0a0a", fontWeight: 700, fontSize: 14, flexShrink: 0
                                    }}>
                                        {msg.user_name?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) || "U"}
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
                                    <div style={{ display: "flex", gap: 6 }}>
                                        {msg.status === "new" && (
                                            <span style={{
                                                fontSize: 10, fontWeight: 600,
                                                background: "rgba(201,168,76,0.15)", color: "#c9a84c",
                                                padding: "2px 8px", borderRadius: 999
                                            }}>
                                                NEW
                                            </span>
                                        )}
                                        {msg.status === "resolved" && (
                                            <span style={{
                                                fontSize: 10, fontWeight: 600,
                                                background: "rgba(74,222,128,0.15)", color: "#4ade80",
                                                padding: "2px 8px", borderRadius: 999
                                            }}>
                                                RESOLVED
                                            </span>
                                        )}
                                        {msg.replies && msg.replies.length > 0 && (
                                            <span style={{
                                                fontSize: 10, fontWeight: 600,
                                                background: "rgba(59,130,246,0.15)", color: "#3b82f6",
                                                padding: "2px 8px", borderRadius: 999
                                            }}>
                                                {msg.replies.length} {msg.replies.length === 1 ? "reply" : "replies"}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Original Message */}
                            <div style={{
                                margin: "0 20px",
                                background: "var(--bg-secondary)",
                                padding: 16,
                                borderRadius: 8,
                                fontSize: 14,
                                lineHeight: 1.6,
                                color: "var(--text-primary)",
                                whiteSpace: "pre-wrap"
                            }}>
                                {msg.message}
                            </div>

                            {/* Replies Thread */}
                            {msg.replies && msg.replies.length > 0 && (
                                <div style={{ margin: "12px 20px 0" }}>
                                    <button
                                        onClick={() => toggleExpanded(msg.id)}
                                        style={{
                                            background: "none",
                                            border: "none",
                                            cursor: "pointer",
                                            color: "#c9a84c",
                                            fontSize: 12,
                                            fontWeight: 600,
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 6,
                                            padding: "4px 0",
                                            marginBottom: 4
                                        }}
                                    >
                                        {expandedMessages.has(msg.id) ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                        {expandedMessages.has(msg.id) ? "Hide" : "Show"} Replies ({msg.replies.length})
                                    </button>

                                    <AnimatePresence>
                                        {expandedMessages.has(msg.id) && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: "auto", opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                transition={{ duration: 0.2 }}
                                                style={{ overflow: "hidden" }}
                                            >
                                                <div style={{
                                                    borderLeft: "2px solid rgba(201,168,76,0.3)",
                                                    paddingLeft: 16,
                                                    display: "flex",
                                                    flexDirection: "column",
                                                    gap: 10,
                                                    marginBottom: 8
                                                }}>
                                                    {msg.replies.map((reply, ri) => (
                                                        <motion.div
                                                            key={ri}
                                                            initial={{ opacity: 0, x: -10 }}
                                                            animate={{ opacity: 1, x: 0 }}
                                                            transition={{ delay: ri * 0.05 }}
                                                            style={{
                                                                background: reply.sender === "admin"
                                                                    ? "rgba(201,168,76,0.06)"
                                                                    : "var(--bg-secondary)",
                                                                border: reply.sender === "admin"
                                                                    ? "1px solid rgba(201,168,76,0.15)"
                                                                    : "1px solid var(--border)",
                                                                borderRadius: 10,
                                                                padding: "12px 14px",
                                                            }}
                                                        >
                                                            <div style={{
                                                                display: "flex",
                                                                justifyContent: "space-between",
                                                                alignItems: "center",
                                                                marginBottom: 6
                                                            }}>
                                                                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                                                    <div style={{
                                                                        width: 24, height: 24, borderRadius: "50%",
                                                                        background: reply.sender === "admin"
                                                                            ? "linear-gradient(135deg, #c9a84c, #a07830)"
                                                                            : "var(--bg-secondary)",
                                                                        display: "flex", alignItems: "center", justifyContent: "center",
                                                                        fontSize: 10, fontWeight: 700,
                                                                        color: reply.sender === "admin" ? "#0a0a0a" : "var(--text-secondary)",
                                                                        border: reply.sender === "admin" ? "none" : "1px solid var(--border)"
                                                                    }}>
                                                                        {reply.sender === "admin" ? "A" : "U"}
                                                                    </div>
                                                                    <span style={{
                                                                        fontSize: 12,
                                                                        fontWeight: 600,
                                                                        color: reply.sender === "admin" ? "#c9a84c" : "var(--text-primary)"
                                                                    }}>
                                                                        {reply.sender_name}
                                                                        {reply.sender === "admin" && (
                                                                            <span style={{
                                                                                fontSize: 9,
                                                                                background: "rgba(201,168,76,0.2)",
                                                                                color: "#c9a84c",
                                                                                padding: "1px 6px",
                                                                                borderRadius: 999,
                                                                                marginLeft: 6,
                                                                                fontWeight: 700,
                                                                                textTransform: "uppercase",
                                                                                letterSpacing: "0.05em"
                                                                            }}>
                                                                                Admin
                                                                            </span>
                                                                        )}
                                                                    </span>
                                                                </div>
                                                                <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
                                                                    {new Date(reply.created_at).toLocaleString()}
                                                                </span>
                                                            </div>
                                                            <div style={{
                                                                fontSize: 13,
                                                                lineHeight: 1.5,
                                                                color: "var(--text-primary)",
                                                                whiteSpace: "pre-wrap"
                                                            }}>
                                                                {reply.message}
                                                            </div>
                                                        </motion.div>
                                                    ))}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            )}

                            {/* Reply Input */}
                            <AnimatePresence>
                                {replyingTo === msg.id && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.2 }}
                                        style={{ overflow: "hidden" }}
                                    >
                                        <div style={{
                                            margin: "12px 20px 0",
                                            padding: 14,
                                            background: "var(--bg-secondary)",
                                            borderRadius: 10,
                                            border: "1px solid rgba(201,168,76,0.2)",
                                        }}>
                                            <div style={{
                                                display: "flex",
                                                alignItems: "center",
                                                gap: 6,
                                                marginBottom: 10,
                                                fontSize: 12,
                                                fontWeight: 600,
                                                color: "#c9a84c"
                                            }}>
                                                <Reply size={14} />
                                                Replying to {msg.user_name}
                                            </div>
                                            <textarea
                                                className="input"
                                                placeholder="Type your reply..."
                                                value={replyText}
                                                onChange={(e) => setReplyText(e.target.value)}
                                                style={{
                                                    width: "100%",
                                                    minHeight: 80,
                                                    resize: "vertical",
                                                    marginBottom: 10,
                                                    fontSize: 13,
                                                }}
                                                autoFocus
                                            />
                                            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
                                                <button
                                                    className="btn-secondary"
                                                    onClick={() => {
                                                        setReplyingTo(null);
                                                        setReplyText("");
                                                    }}
                                                    style={{ fontSize: 12 }}
                                                >
                                                    Cancel
                                                </button>
                                                <button
                                                    className="btn-primary"
                                                    onClick={() => sendReply(msg.id)}
                                                    disabled={sendingReply || !replyText.trim()}
                                                    style={{
                                                        fontSize: 12,
                                                        display: "flex",
                                                        alignItems: "center",
                                                        gap: 6,
                                                        opacity: sendingReply || !replyText.trim() ? 0.6 : 1,
                                                    }}
                                                >
                                                    <Send size={13} />
                                                    {sendingReply ? "Sending..." : "Send Reply"}
                                                </button>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Action Buttons */}
                            <div style={{
                                display: "flex",
                                justifyContent: "flex-end",
                                gap: 10,
                                padding: "14px 20px",
                                borderTop: "1px solid var(--border)",
                                marginTop: 12,
                            }}>
                                <button
                                    onClick={() => {
                                        if (replyingTo === msg.id) {
                                            setReplyingTo(null);
                                            setReplyText("");
                                        } else {
                                            setReplyingTo(msg.id);
                                            setReplyText("");
                                        }
                                    }}
                                    className="btn-secondary"
                                    style={{
                                        fontSize: 12,
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 6,
                                        color: replyingTo === msg.id ? "#c9a84c" : undefined,
                                        borderColor: replyingTo === msg.id ? "rgba(201,168,76,0.3)" : undefined,
                                    }}
                                >
                                    <Reply size={14} />
                                    Reply
                                </button>
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
