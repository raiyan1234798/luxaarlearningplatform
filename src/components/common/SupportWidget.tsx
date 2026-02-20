"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, X, Send } from "lucide-react";
import { useAuth } from "@/lib/contexts/AuthContext";
import { addDoc, collection } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import toast from "react-hot-toast";

export default function SupportWidget() {
    const { user, profile } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [message, setMessage] = useState("");
    const [sending, setSending] = useState(false);

    if (!user) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!message.trim()) return;

        setSending(true);
        try {
            await addDoc(collection(db, "support_messages"), {
                user_id: user.uid,
                user_email: profile?.email || user.email,
                user_name: profile?.full_name || "Unknown",
                message: message,
                status: "new",
                created_at: new Date().toISOString(),
            });

            toast.success("Message sent! We'll get back to you soon.");
            setMessage("");
            setIsOpen(false);
        } catch (error) {
            console.error("Error sending support message:", error);
            toast.error("Failed to send message");
        } finally {
            setSending(false);
        }
    };

    return (
        <>
            {/* Trigger Button */}
            <motion.button
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsOpen(true)}
                style={{
                    position: "fixed",
                    bottom: 24,
                    right: 24,
                    width: 56,
                    height: 56,
                    borderRadius: "50%",
                    background: "linear-gradient(135deg, #c9a84c, #a07830)",
                    border: "none",
                    boxShadow: "0 4px 14px rgba(201, 168, 76, 0.4)",
                    color: "white",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    zIndex: 50,
                }}
            >
                <MessageSquare size={24} fill="currentColor" />
            </motion.button>

            {/* Chat Window */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        style={{
                            position: "fixed",
                            bottom: 96,
                            right: 24,
                            width: 350,
                            maxWidth: "calc(100vw - 48px)",
                            background: "var(--bg-primary)",
                            border: "1px solid var(--border)",
                            borderRadius: 16,
                            boxShadow: "0 10px 40px rgba(0,0,0,0.2)",
                            overflow: "hidden",
                            zIndex: 50,
                            display: "flex",
                            flexDirection: "column",
                        }}
                    >
                        {/* Header */}
                        <div
                            style={{
                                padding: "16px 20px",
                                background: "var(--bg-secondary)",
                                borderBottom: "1px solid var(--border)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                            }}
                        >
                            <h3 style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)" }}>Support & Help</h3>
                            <button
                                onClick={() => setIsOpen(false)}
                                style={{
                                    background: "none",
                                    border: "none",
                                    color: "var(--text-muted)",
                                    cursor: "pointer",
                                    padding: 4,
                                }}
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Body */}
                        <div style={{ padding: 20 }}>
                            <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 16, lineHeight: 1.5 }}>
                                Have a question or facing an issue? Send us a message and we'll reply to your email directly.
                            </p>

                            <form onSubmit={handleSubmit}>
                                <textarea
                                    className="input"
                                    placeholder="Type your message here..."
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    style={{
                                        width: "100%",
                                        minHeight: 120,
                                        resize: "vertical",
                                        marginBottom: 16,
                                        fontSize: 14,
                                    }}
                                    autoFocus
                                />

                                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                                    <button
                                        type="submit"
                                        className="btn-primary"
                                        disabled={sending || !message.trim()}
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 8,
                                            opacity: sending || !message.trim() ? 0.7 : 1,
                                        }}
                                    >
                                        {sending ? (
                                            "Sending..."
                                        ) : (
                                            <>
                                                Send Message
                                                <Send size={14} />
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
