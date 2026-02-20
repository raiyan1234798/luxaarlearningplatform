"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { collection, addDoc, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { useAuth } from "@/lib/contexts/AuthContext";
import type { Course, Enrollment } from "@/types";
import { getDifficultyColor, formatDate } from "@/lib/utils";
import {
    BookOpen,
    Play,
    Clock,
    Users,
    CheckCircle,
    ChevronDown,
    ChevronUp,
    Lock,
    Edit,
    ArrowRight,
    Send,
    Loader2,
} from "lucide-react";
import Link from "next/link";

interface CourseDetailClientProps {
    course: Course & { modules: Array<{ id: string; title: string; description: string | null; order_index: number; lessons: Array<{ id: string; title: string; duration_seconds: number | null }> }> };
    enrollment: Enrollment | null;
    userId: string;
    isAdmin: boolean;
}

export default function CourseDetailClient({
    course,
    enrollment,
    userId,
    isAdmin,
}: CourseDetailClientProps) {
    const router = useRouter();
    const { profile } = useAuth();
    const [enrolling, setEnrolling] = useState(false);
    const [requestMessage, setRequestMessage] = useState("");
    const [existingRequestStatus, setExistingRequestStatus] = useState<string | null>(null);
    const [checkingRequest, setCheckingRequest] = useState(true);
    const [expandedModules, setExpandedModules] = useState<Set<string>>(
        new Set([course.modules?.[0]?.id])
    );

    const totalLessons = course.modules?.reduce(
        (sum, m) => sum + (m.lessons?.length ?? 0),
        0
    ) ?? 0;

    const diffStyle = getDifficultyColor(course.difficulty);

    // Check if a request already exists
    useEffect(() => {
        async function checkExistingRequest() {
            if (isAdmin || enrollment) {
                setCheckingRequest(false);
                return;
            }
            try {
                const q = query(
                    collection(db, "course_access_requests"),
                    where("user_id", "==", userId),
                    where("course_id", "==", course.id)
                );
                const snap = await getDocs(q);
                if (!snap.empty) {
                    const requestData = snap.docs[0].data();
                    setExistingRequestStatus(requestData.status);
                }
            } catch (e) {
                // Ignore – collection might not exist yet
            } finally {
                setCheckingRequest(false);
            }
        }
        checkExistingRequest();
    }, [userId, course.id, isAdmin, enrollment]);

    async function handleRequestAccess() {
        setEnrolling(true);
        try {
            await addDoc(collection(db, "course_access_requests"), {
                user_id: userId,
                user_name: profile?.full_name || "Unknown",
                user_email: profile?.email || "",
                course_id: course.id,
                course_title: course.title,
                status: "pending",
                message: requestMessage.trim() || null,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            });
            toast.success("Access request submitted! The admin will review it.");
            setExistingRequestStatus("pending");
        } catch (error) {
            console.error("Error submitting request:", error);
            toast.error("Failed to submit request");
        }
        setEnrolling(false);
    }

    function toggleModule(moduleId: string) {
        setExpandedModules((prev) => {
            const next = new Set(prev);
            if (next.has(moduleId)) next.delete(moduleId);
            else next.add(moduleId);
            return next;
        });
    }

    return (
        <div style={{ maxWidth: 1100 }}>
            {/* Hero */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ marginBottom: 32 }}
            >
                <div
                    style={{
                        display: "flex",
                        gap: 10,
                        alignItems: "center",
                        marginBottom: 12,
                        flexWrap: "wrap",
                    }}
                >
                    <span className={`badge ${diffStyle}`} style={{ fontSize: 12 }}>
                        {course.difficulty}
                    </span>
                    {course.tags?.map((tag) => (
                        <span
                            key={tag}
                            style={{
                                fontSize: 12,
                                padding: "3px 10px",
                                borderRadius: 999,
                                background: "var(--bg-secondary)",
                                color: "var(--text-muted)",
                            }}
                        >
                            {tag}
                        </span>
                    ))}
                    {!course.is_published && (
                        <span
                            style={{
                                fontSize: 12,
                                padding: "3px 10px",
                                borderRadius: 999,
                                background: "rgba(248,113,113,0.1)",
                                color: "#f87171",
                            }}
                        >
                            Draft
                        </span>
                    )}
                </div>

                <h1
                    style={{
                        fontFamily: "Poppins, sans-serif",
                        fontSize: "clamp(1.5rem, 3vw, 2.25rem)",
                        fontWeight: 700,
                        color: "var(--text-primary)",
                        letterSpacing: "-0.02em",
                        marginBottom: 12,
                        lineHeight: 1.2,
                    }}
                >
                    {course.title}
                </h1>

                <p
                    style={{
                        color: "var(--text-secondary)",
                        fontSize: 15,
                        lineHeight: 1.7,
                        marginBottom: 16,
                        maxWidth: 700,
                    }}
                >
                    {course.description}
                </p>

                <div
                    style={{
                        display: "flex",
                        gap: 20,
                        flexWrap: "wrap",
                        alignItems: "center",
                        fontSize: 14,
                        color: "var(--text-muted)",
                    }}
                >
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <Users size={14} color="#c9a84c" />
                        <span style={{ color: "var(--text-secondary)" }}>
                            {course.instructor_name}
                        </span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <BookOpen size={14} />
                        <span>{totalLessons} lessons</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <Clock size={14} />
                        <span>Updated {formatDate(course.updated_at)}</span>
                    </div>
                </div>
            </motion.div>

            <div className="course-detail-grid">
                {/* Modules */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                >
                    <h2
                        style={{
                            fontSize: 17,
                            fontWeight: 600,
                            color: "var(--text-primary)",
                            marginBottom: 14,
                        }}
                    >
                        Course Content
                    </h2>
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        {course.modules
                            ?.sort((a, b) => a.order_index - b.order_index)
                            .map((mod, mi) => (
                                <div key={mod.id} className="card" style={{ overflow: "hidden" }}>
                                    <button
                                        onClick={() => toggleModule(mod.id)}
                                        style={{
                                            width: "100%",
                                            padding: "16px 18px",
                                            background: "none",
                                            border: "none",
                                            cursor: "pointer",
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 12,
                                            textAlign: "left",
                                        }}
                                    >
                                        <div
                                            style={{
                                                width: 30,
                                                height: 30,
                                                borderRadius: 8,
                                                background: "rgba(201,168,76,0.1)",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                flexShrink: 0,
                                                fontSize: 13,
                                                fontWeight: 700,
                                                color: "#c9a84c",
                                            }}
                                        >
                                            {mi + 1}
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontWeight: 600, fontSize: 14, color: "var(--text-primary)" }}>
                                                {mod.title}
                                            </div>
                                            <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                                                {mod.lessons?.length ?? 0} lessons
                                            </div>
                                        </div>
                                        {expandedModules.has(mod.id) ? (
                                            <ChevronUp size={16} color="var(--text-muted)" />
                                        ) : (
                                            <ChevronDown size={16} color="var(--text-muted)" />
                                        )}
                                    </button>

                                    {expandedModules.has(mod.id) && mod.lessons && (
                                        <div
                                            style={{
                                                borderTop: "1px solid var(--border)",
                                                padding: "8px",
                                            }}
                                        >
                                            {mod.lessons
                                                .sort((a, b) => {
                                                    const aIdx = (a as { order_index?: number }).order_index ?? 0;
                                                    const bIdx = (b as { order_index?: number }).order_index ?? 0;
                                                    return aIdx - bIdx;
                                                })
                                                .map((lesson, li) => (
                                                    <div
                                                        key={lesson.id}
                                                        style={{
                                                            display: "flex",
                                                            alignItems: "center",
                                                            gap: 10,
                                                            padding: "10px 10px",
                                                            borderRadius: 8,
                                                        }}
                                                    >
                                                        {enrollment || isAdmin ? (
                                                            <Play size={14} color="#c9a84c" />
                                                        ) : (
                                                            <Lock size={14} color="var(--text-muted)" />
                                                        )}
                                                        <span
                                                            style={{
                                                                fontSize: 13,
                                                                color: enrollment || isAdmin
                                                                    ? "var(--text-primary)"
                                                                    : "var(--text-muted)",
                                                                flex: 1,
                                                            }}
                                                        >
                                                            {li + 1}. {lesson.title}
                                                        </span>
                                                    </div>
                                                ))}
                                        </div>
                                    )}
                                </div>
                            ))}

                        {(!course.modules || course.modules.length === 0) && (
                            <div
                                className="card"
                                style={{ padding: 32, textAlign: "center" }}
                            >
                                <BookOpen size={32} color="var(--text-muted)" style={{ marginBottom: 12 }} />
                                <p style={{ color: "var(--text-muted)", fontSize: 14 }}>
                                    No content added yet.
                                </p>
                            </div>
                        )}
                    </div>
                </motion.div>

                {/* Sidebar CTA */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="course-detail-sidebar"
                >
                    <div
                        className="card"
                        style={{
                            padding: "24px",
                        }}
                    >
                        {enrollment ? (
                            <div style={{ textAlign: "center" }}>
                                <div
                                    style={{
                                        width: 48,
                                        height: 48,
                                        borderRadius: "50%",
                                        background: "rgba(74,222,128,0.1)",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        margin: "0 auto 12px",
                                    }}
                                >
                                    <CheckCircle size={24} color="#4ade80" />
                                </div>
                                <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 6, color: "var(--text-primary)" }}>
                                    You&apos;re enrolled
                                </p>
                                <div className="progress-bar" style={{ marginBottom: 8 }}>
                                    <div
                                        className="progress-fill"
                                        style={{ width: `${enrollment.progress_percentage}%` }}
                                    />
                                </div>
                                <p style={{ fontSize: 12, color: "#c9a84c", marginBottom: 16 }}>
                                    {enrollment.progress_percentage}% complete
                                </p>
                                <Link href={`/dashboard/courses/learn?id=${course.id}`}>
                                    <button
                                        className="btn-primary"
                                        style={{ width: "100%", justifyContent: "center" }}
                                    >
                                        <Play size={16} />
                                        {enrollment.progress_percentage > 0 ? "Continue" : "Start Learning"}
                                    </button>
                                </Link>
                            </div>
                        ) : (
                            <>
                                <div style={{ marginBottom: 16 }}>
                                    <p style={{ fontSize: 22, fontWeight: 800, color: "var(--text-primary)", marginBottom: 4 }}>
                                        Free
                                    </p>
                                    <p style={{ fontSize: 13, color: "var(--text-muted)" }}>
                                        Full course access
                                    </p>
                                </div>
                                <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
                                    {[
                                        `${totalLessons} lessons`,
                                        `${course.modules?.length ?? 0} modules`,
                                        "Lifetime access",
                                        "Completion certificate",
                                    ].map((feature) => (
                                        <div
                                            key={feature}
                                            style={{ display: "flex", alignItems: "center", gap: 8 }}
                                        >
                                            <CheckCircle size={14} color="#4ade80" />
                                            <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>
                                                {feature}
                                            </span>
                                        </div>
                                    ))}
                                </div>

                                {checkingRequest ? (
                                    <div style={{ textAlign: "center", padding: "12px 0" }}>
                                        <Loader2 size={20} color="#c9a84c" style={{ animation: "spin 1s linear infinite" }} />
                                    </div>
                                ) : existingRequestStatus === "pending" ? (
                                    <div style={{ textAlign: "center" }}>
                                        <div
                                            style={{
                                                padding: "12px 16px",
                                                borderRadius: 10,
                                                background: "rgba(201,168,76,0.08)",
                                                border: "1px solid rgba(201,168,76,0.2)",
                                                marginBottom: 8,
                                            }}
                                        >
                                            <Clock size={18} color="#c9a84c" style={{ marginBottom: 6 }} />
                                            <p style={{ fontSize: 13, fontWeight: 600, color: "#c9a84c", marginBottom: 2 }}>
                                                Request Pending
                                            </p>
                                            <p style={{ fontSize: 11, color: "var(--text-muted)" }}>
                                                Your access request is being reviewed by the admin.
                                            </p>
                                        </div>
                                    </div>
                                ) : existingRequestStatus === "approved" ? (
                                    <div style={{ textAlign: "center" }}>
                                        <div
                                            style={{
                                                padding: "12px 16px",
                                                borderRadius: 10,
                                                background: "rgba(74,222,128,0.08)",
                                                border: "1px solid rgba(74,222,128,0.2)",
                                                marginBottom: 8,
                                            }}
                                        >
                                            <CheckCircle size={18} color="#4ade80" style={{ marginBottom: 6 }} />
                                            <p style={{ fontSize: 13, fontWeight: 600, color: "#4ade80", marginBottom: 2 }}>
                                                Access Approved!
                                            </p>
                                            <p style={{ fontSize: 11, color: "var(--text-muted)" }}>
                                                You now have access to this course.
                                            </p>
                                        </div>
                                        <Link href={`/dashboard/courses/learn?id=${course.id}`}>
                                            <button
                                                className="btn-primary"
                                                style={{ width: "100%", justifyContent: "center", marginTop: 8 }}
                                            >
                                                <Play size={16} />
                                                Start Learning
                                            </button>
                                        </Link>
                                    </div>
                                ) : existingRequestStatus === "rejected" ? (
                                    <div style={{ textAlign: "center" }}>
                                        <div
                                            style={{
                                                padding: "12px 16px",
                                                borderRadius: 10,
                                                background: "rgba(248,113,113,0.08)",
                                                border: "1px solid rgba(248,113,113,0.2)",
                                            }}
                                        >
                                            <p style={{ fontSize: 13, fontWeight: 600, color: "#f87171", marginBottom: 2 }}>
                                                Request Rejected
                                            </p>
                                            <p style={{ fontSize: 11, color: "var(--text-muted)" }}>
                                                Your access request was not approved. Contact the admin for more details.
                                            </p>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <textarea
                                            className="input"
                                            placeholder="Add a message (optional)..."
                                            value={requestMessage}
                                            onChange={(e) => setRequestMessage(e.target.value)}
                                            rows={3}
                                            style={{
                                                resize: "vertical",
                                                marginBottom: 10,
                                                fontSize: 13,
                                                minHeight: 60,
                                            }}
                                        />
                                        <button
                                            className="btn-primary"
                                            onClick={handleRequestAccess}
                                            disabled={enrolling}
                                            style={{ width: "100%", justifyContent: "center" }}
                                        >
                                            {enrolling ? (
                                                <>
                                                    <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />
                                                    Submitting...
                                                </>
                                            ) : (
                                                <>
                                                    <Send size={16} />
                                                    Request Access
                                                </>
                                            )}
                                        </button>
                                    </>
                                )}
                            </>
                        )}

                        {isAdmin && (
                            <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid var(--border)" }}>
                                <Link href={`/dashboard/admin/courses/edit?id=${course.id}`}>
                                    <button
                                        className="btn-secondary"
                                        style={{ width: "100%", justifyContent: "center", fontSize: 13 }}
                                    >
                                        <Edit size={14} />
                                        Edit Course
                                    </button>
                                </Link>
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
