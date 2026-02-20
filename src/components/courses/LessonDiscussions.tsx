"use client";

import { useState, useEffect } from "react";
import { collection, query, where, orderBy, getDocs, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { useAuth } from "@/lib/contexts/AuthContext";
import { MessageSquare, Send, User } from "lucide-react";
import { getInitials } from "@/lib/utils";
import toast from "react-hot-toast";

interface DiscussionMessage {
    id: string;
    text: string;
    user_id: string;
    user_name: string;
    created_at: any;
}

export default function LessonDiscussions({ lessonId, courseId }: { lessonId: string, courseId: string }) {
    const { user, profile } = useAuth();
    const [messages, setMessages] = useState<DiscussionMessage[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        async function fetchDiscussions() {
            setLoading(true);
            try {
                const q = query(
                    collection(db, "lesson_discussions"),
                    where("lesson_id", "==", lessonId),
                    orderBy("created_at", "asc")
                );
                const snap = await getDocs(q);
                const msgs: DiscussionMessage[] = [];
                snap.forEach(doc => {
                    msgs.push({ id: doc.id, ...doc.data() } as DiscussionMessage);
                });
                setMessages(msgs);
            } catch (error) {
                console.error("Error fetching discussions:", error);
            } finally {
                setLoading(false);
            }
        }
        if (lessonId) fetchDiscussions();
    }, [lessonId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !user || !profile) return;

        setSubmitting(true);
        try {
            const newDoc = {
                lesson_id: lessonId,
                course_id: courseId,
                user_id: user.uid,
                user_name: profile.full_name || "Anonymous",
                text: newMessage.trim(),
                created_at: new Date().toISOString()
            };

            const docRef = await addDoc(collection(db, "lesson_discussions"), newDoc);
            setMessages([...messages, { id: docRef.id, ...newDoc }]);
            setNewMessage("");
            toast.success("Message posted");
        } catch (error) {
            console.error("Error posting message:", error);
            toast.error("Failed to post message");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div style={{ padding: "0 4px" }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: "var(--text-primary)", marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
                <MessageSquare size={18} color="#c9a84c" />
                Lesson Discussion
            </h3>

            {loading ? (
                <div style={{ color: "var(--text-muted)", fontSize: 14 }}>Loading discussions...</div>
            ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 24 }}>
                    {messages.length === 0 ? (
                        <div style={{ padding: 24, textAlign: "center", background: "var(--bg-secondary)", borderRadius: 12 }}>
                            <MessageSquare size={24} color="var(--text-muted)" style={{ marginBottom: 8, opacity: 0.5 }} />
                            <p style={{ color: "var(--text-muted)", fontSize: 13 }}>No discussions yet. Be the first to start the conversation!</p>
                        </div>
                    ) : (
                        messages.map(msg => (
                            <div key={msg.id} style={{ display: "flex", gap: 12 }}>
                                <div style={{
                                    width: 32, height: 32, borderRadius: "50%", background: "rgba(201,168,76,0.2)",
                                    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                                    color: "#c9a84c", fontSize: 12, fontWeight: 600
                                }}>
                                    {getInitials(msg.user_name)}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 4 }}>
                                        <span style={{ fontWeight: 600, fontSize: 13, color: "var(--text-primary)" }}>{msg.user_name}</span>
                                        <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
                                            {typeof msg.created_at === "string" ? new Date(msg.created_at).toLocaleDateString() : ""}
                                        </span>
                                    </div>
                                    <div style={{
                                        background: "var(--bg-secondary)",
                                        padding: "10px 14px",
                                        borderRadius: "0 12px 12px 12px",
                                        fontSize: 14,
                                        color: "var(--text-secondary)",
                                        lineHeight: 1.5
                                    }}>
                                        {msg.text}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            <form onSubmit={handleSubmit} style={{ position: "relative" }}>
                <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Ask a question or share your thoughts..."
                    style={{
                        width: "100%",
                        background: "var(--bg-primary)",
                        border: "1px solid var(--border)",
                        padding: "12px 16px",
                        paddingRight: 48,
                        borderRadius: 24,
                        fontSize: 14,
                        color: "var(--text-primary)",
                        outline: "none"
                    }}
                    onFocus={(e) => e.target.style.borderColor = "#c9a84c"}
                    onBlur={(e) => e.target.style.borderColor = "var(--border)"}
                />
                <button
                    type="submit"
                    disabled={submitting || !newMessage.trim()}
                    style={{
                        position: "absolute",
                        right: 6,
                        top: 6,
                        width: 32,
                        height: 32,
                        background: newMessage.trim() ? "linear-gradient(135deg, #c9a84c, #a07830)" : "var(--bg-secondary)",
                        border: "none",
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: newMessage.trim() ? "pointer" : "not-allowed",
                        color: newMessage.trim() ? "#000" : "var(--text-muted)",
                        transition: "all 0.2s"
                    }}
                >
                    <Send size={14} />
                </button>
            </form>
        </div>
    );
}
