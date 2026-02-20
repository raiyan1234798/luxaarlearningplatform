"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { doc, updateDoc, addDoc, collection } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import type { CourseAccessRequest, AccessRequestStatus } from "@/types";
import { getInitials, formatDate } from "@/lib/utils";
import {
    CheckCircle,
    XCircle,
    Search,
    Users,
    Clock,
    Filter,
    BookOpen,
    Inbox,
    ArrowRight,
    Eye,
    X,
    Calendar,
    Mail,
    User,
    MessageSquare,
} from "lucide-react";

interface CourseAccessRequestsClientProps {
    requests: CourseAccessRequest[];
    enrollments?: any[];
}

type FilterType = "all" | "pending" | "approved" | "rejected";
type ViewType = "requests" | "enrollments";

export default function CourseAccessRequestsClient({
    requests: initialRequests,
    enrollments = [],
}: CourseAccessRequestsClientProps) {
    const [requests, setRequests] = useState<CourseAccessRequest[]>(initialRequests);
    const [view, setView] = useState<ViewType>("requests");
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState<FilterType>("all");
    const [updating, setUpdating] = useState<string | null>(null);
    const [selectedRequest, setSelectedRequest] = useState<CourseAccessRequest | null>(null);

    const filteredRequests = requests.filter((r) => {
        const matchSearch =
            r.user_email.toLowerCase().includes(search.toLowerCase()) ||
            r.user_name.toLowerCase().includes(search.toLowerCase()) ||
            r.course_title.toLowerCase().includes(search.toLowerCase());
        const matchFilter = filter === "all" || r.status === filter;
        return matchSearch && matchFilter;
    });

    const filteredEnrollments = enrollments.filter((e) => {
        return (
            e.user_email?.toLowerCase().includes(search.toLowerCase()) ||
            e.user_name?.toLowerCase().includes(search.toLowerCase()) ||
            e.course_title?.toLowerCase().includes(search.toLowerCase())
        );
    });

    const pending = requests.filter((r) => r.status === "pending").length;
    const approved = requests.filter((r) => r.status === "approved").length;
    const rejected = requests.filter((r) => r.status === "rejected").length;

    // Group requests by course
    const courseGroups = filteredRequests.reduce<Record<string, CourseAccessRequest[]>>((acc, r) => {
        if (!acc[r.course_title]) acc[r.course_title] = [];
        acc[r.course_title].push(r);
        return acc;
    }, {});

    // Group enrollments by course
    const enrollmentGroups = filteredEnrollments.reduce<Record<string, any[]>>((acc, e) => {
        const title = e.course_title || "Unknown Course";
        if (!acc[title]) acc[title] = [];
        acc[title].push(e);
        return acc;
    }, {});

    async function updateRequestStatus(
        requestId: string,
        status: "approved" | "rejected"
    ) {
        setUpdating(requestId);
        try {
            const request = requests.find(r => r.id === requestId);
            const requestRef = doc(db, "course_access_requests", requestId);
            await updateDoc(requestRef, {
                status,
                updated_at: new Date().toISOString(),
            });

            // If approving, create an enrollment so the student can access the course
            if (status === "approved" && request) {
                // Check if already enrolled to avoid duplicates?
                // For now, simpler to just add. Firestore "addDoc" creates new ID.
                // Ideally we should check but avoiding extra complexity for now.

                await addDoc(collection(db, "enrollments"), {
                    user_id: request.user_id,
                    user_email: request.user_email,
                    user_name: request.user_name,
                    course_id: request.course_id,
                    course_title: request.course_title,
                    enrolled_at: new Date().toISOString(),
                    completed_at: null,
                    progress_percentage: 0,
                    certificate_issued: false,
                });

                // Create notification for the student
                await addDoc(collection(db, "notifications"), {
                    user_id: request.user_id,
                    type: "enrollment_approved",
                    title: "Course Access Approved! 🎉",
                    message: `Your access to "${request.course_title}" has been approved. Start learning now!`,
                    course_id: request.course_id,
                    course_title: request.course_title,
                    is_read: false,
                    created_at: new Date().toISOString(),
                });
            }

            toast.success(`Request ${status}`);
            setRequests((prev) =>
                prev.map((r) => (r.id === requestId ? { ...r, status } : r))
            );
            if (selectedRequest?.id === requestId) {
                setSelectedRequest((prev) => prev ? { ...prev, status } : null);
            }
        } catch (error) {
            console.error("Error updating request:", error);
            toast.error("Failed to update request");
        }
        setUpdating(null);
    }

    return (
        <div style={{ maxWidth: 1100 }}>
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ marginBottom: 28 }}
            >
                <h1
                    style={{
                        fontFamily: "Poppins, sans-serif",
                        fontSize: "clamp(1.5rem, 3vw, 2rem)",
                        fontWeight: 700,
                        color: "var(--text-primary)",
                        letterSpacing: "-0.02em",
                        marginBottom: 4,
                    }}
                >
                    Enrollments & Requests
                </h1>
                <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>
                    Manage student access requests and view all active enrollments.
                </p>
            </motion.div>

            {/* View Switcher */}
            <div style={{ display: "flex", gap: 20, marginBottom: 24, borderBottom: "1px solid var(--border)" }}>
                <button
                    onClick={() => setView("requests")}
                    style={{
                        background: "none",
                        border: "none",
                        padding: "0 0 12px 0",
                        fontSize: 14,
                        fontWeight: 600,
                        color: view === "requests" ? "#c9a84c" : "var(--text-muted)",
                        borderBottom: view === "requests" ? "2px solid #c9a84c" : "2px solid transparent",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: 8
                    }}
                >
                    Access Requests
                    {pending > 0 && (
                        <span style={{ background: "#f59e0b", color: "#000", fontSize: 10, fontWeight: 700, padding: "2px 6px", borderRadius: 999 }}>
                            {pending}
                        </span>
                    )}
                </button>
                <button
                    onClick={() => setView("enrollments")}
                    style={{
                        background: "none",
                        border: "none",
                        padding: "0 0 12px 0",
                        fontSize: 14,
                        fontWeight: 600,
                        color: view === "enrollments" ? "#c9a84c" : "var(--text-muted)",
                        borderBottom: view === "enrollments" ? "2px solid #c9a84c" : "2px solid transparent",
                        cursor: "pointer"
                    }}
                >
                    All Enrollments
                    <span style={{ marginLeft: 8, opacity: 0.6 }}>{enrollments.length}</span>
                </button>
            </div>

            {view === "requests" && (
                <>
                    {/* Stats */}
                    <div style={{ display: "flex", gap: 14, marginBottom: 24, flexWrap: "wrap" }}>
                        {[
                            { label: "Total Requests", value: requests.length, icon: Inbox, color: "#c9a84c" },
                            { label: "Pending", value: pending, icon: Clock, color: "#f59e0b" },
                            { label: "Approved", value: approved, icon: CheckCircle, color: "#4ade80" },
                            { label: "Rejected", value: rejected, icon: XCircle, color: "#f87171" },
                        ].map((s, i) => (
                            <motion.div
                                key={s.label}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.07 }}
                                className="card"
                                style={{ padding: "14px 18px", display: "flex", alignItems: "center", gap: 12, flex: "1 1 180px" }}
                            >
                                <div
                                    style={{
                                        width: 38,
                                        height: 38,
                                        borderRadius: 10,
                                        background: `${s.color}14`,
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                    }}
                                >
                                    <s.icon size={18} color={s.color} />
                                </div>
                                <div>
                                    <div
                                        style={{
                                            fontSize: 22,
                                            fontWeight: 800,
                                            fontFamily: "Poppins",
                                            color: "var(--text-primary)",
                                            lineHeight: 1,
                                        }}
                                    >
                                        {s.value}
                                    </div>
                                    <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
                                        {s.label}
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* Search + Filters */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap", alignItems: "center" }}
                    >
                        <div style={{ position: "relative", flex: "1 1 240px", maxWidth: 360 }}>
                            <Search
                                size={15}
                                style={{
                                    position: "absolute",
                                    left: 12,
                                    top: "50%",
                                    transform: "translateY(-50%)",
                                    color: "var(--text-muted)",
                                }}
                            />
                            <input
                                className="input"
                                type="text"
                                placeholder="Search by name, email, or course..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                style={{ paddingLeft: 36 }}
                            />
                        </div>
                        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                            <Filter size={13} color="var(--text-muted)" />
                            {(["all", "pending", "approved", "rejected"] as FilterType[]).map(
                                (f) => (
                                    <button
                                        key={f}
                                        onClick={() => setFilter(f)}
                                        style={{
                                            padding: "6px 12px",
                                            borderRadius: 7,
                                            border: "1px solid",
                                            borderColor:
                                                filter === f
                                                    ? "rgba(201,168,76,0.5)"
                                                    : "var(--border)",
                                            background:
                                                filter === f
                                                    ? "rgba(201,168,76,0.1)"
                                                    : "transparent",
                                            color:
                                                filter === f
                                                    ? "#c9a84c"
                                                    : "var(--text-secondary)",
                                            fontSize: 12,
                                            fontWeight: filter === f ? 600 : 400,
                                            cursor: "pointer",
                                            textTransform: "capitalize",
                                        }}
                                    >
                                        {f}
                                        {f === "pending" && pending > 0 && (
                                            <span
                                                style={{
                                                    marginLeft: 5,
                                                    background: "#f59e0b",
                                                    color: "#000",
                                                    borderRadius: 999,
                                                    padding: "1px 6px",
                                                    fontSize: 10,
                                                    fontWeight: 700,
                                                }}
                                            >
                                                {pending}
                                            </span>
                                        )}
                                    </button>
                                )
                            )}
                        </div>
                    </motion.div>

                    {/* Requests */}
                    {filteredRequests.length === 0 ? (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.25 }}
                            className="card"
                            style={{ padding: 60, textAlign: "center" }}
                        >
                            <Inbox
                                size={48}
                                color="var(--text-muted)"
                                style={{ marginBottom: 16, opacity: 0.3 }}
                            />
                            <p style={{ color: "var(--text-muted)", fontSize: 15, fontWeight: 500 }}>
                                No access requests found
                            </p>
                            <p style={{ color: "var(--text-muted)", fontSize: 13, marginTop: 4, opacity: 0.7 }}>
                                {filter !== "all"
                                    ? `No ${filter} requests. Try a different filter.`
                                    : "When students request access to your courses, they will appear here."}
                            </p>
                        </motion.div>
                    ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                            {Object.entries(courseGroups).map(
                                ([courseTitle, courseRequests], gi) => (
                                    <motion.div
                                        key={courseTitle}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.25 + gi * 0.08 }}
                                    >
                                        {/* ... rest of request table for course ... */}
                                        <div
                                            style={{
                                                display: "flex",
                                                alignItems: "center",
                                                gap: 10,
                                                marginBottom: 10,
                                            }}
                                        >
                                            <div
                                                style={{
                                                    width: 32,
                                                    height: 32,
                                                    borderRadius: 8,
                                                    background: "rgba(201,168,76,0.1)",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                    flexShrink: 0,
                                                }}
                                            >
                                                <BookOpen size={15} color="#c9a84c" />
                                            </div>
                                            <div>
                                                <div
                                                    style={{
                                                        fontSize: 15,
                                                        fontWeight: 600,
                                                        color: "var(--text-primary)",
                                                    }}
                                                >
                                                    {courseTitle}
                                                </div>
                                                <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                                                    {courseRequests.length} request{courseRequests.length !== 1 ? "s" : ""}
                                                    {" · "}
                                                    {courseRequests.filter((r) => r.status === "pending").length} pending
                                                </div>
                                            </div>
                                        </div>

                                        {/* Requests table */}
                                        <div className="card" style={{ overflow: "hidden" }}>
                                            <div style={{ overflowX: "auto" }}>
                                                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                                                    <thead>
                                                        <tr style={{ borderBottom: "1px solid var(--border)" }}>
                                                            {["Student", "Status", "Requested On", "Actions"].map(
                                                                (h) => (
                                                                    <th
                                                                        key={h}
                                                                        style={{
                                                                            padding: "12px 16px",
                                                                            textAlign: "left",
                                                                            fontSize: 12,
                                                                            fontWeight: 600,
                                                                            color: "var(--text-muted)",
                                                                            textTransform: "uppercase",
                                                                            letterSpacing: "0.05em",
                                                                        }}
                                                                    >
                                                                        {h}
                                                                    </th>
                                                                )
                                                            )}
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {courseRequests.map((r, i) => (
                                                            <motion.tr
                                                                key={r.id}
                                                                initial={{ opacity: 0 }}
                                                                animate={{ opacity: 1 }}
                                                                transition={{ delay: i * 0.03 }}
                                                                style={{
                                                                    borderBottom: "1px solid var(--border)",
                                                                    transition: "background 0.15s",
                                                                }}
                                                                onMouseEnter={(e) =>
                                                                (e.currentTarget.style.background =
                                                                    "var(--bg-secondary)")
                                                                }
                                                                onMouseLeave={(e) =>
                                                                (e.currentTarget.style.background =
                                                                    "transparent")
                                                                }
                                                            >
                                                                <td style={{ padding: "12px 16px" }}>
                                                                    <div
                                                                        style={{
                                                                            display: "flex",
                                                                            alignItems: "center",
                                                                            gap: 10,
                                                                        }}
                                                                    >
                                                                        <div
                                                                            style={{
                                                                                width: 36,
                                                                                height: 36,
                                                                                borderRadius: "50%",
                                                                                background:
                                                                                    "linear-gradient(135deg, #c9a84c, #a07830)",
                                                                                display: "flex",
                                                                                alignItems: "center",
                                                                                justifyContent: "center",
                                                                                fontSize: 12,
                                                                                fontWeight: 700,
                                                                                color: "#0a0a0a",
                                                                                flexShrink: 0,
                                                                            }}
                                                                        >
                                                                            {getInitials(r.user_name)}
                                                                        </div>
                                                                        <div>
                                                                            <div
                                                                                style={{
                                                                                    fontSize: 14,
                                                                                    fontWeight: 500,
                                                                                    color: "var(--text-primary)",
                                                                                }}
                                                                            >
                                                                                {r.user_name || "—"}
                                                                            </div>
                                                                            <div
                                                                                style={{
                                                                                    fontSize: 12,
                                                                                    color: "var(--text-muted)",
                                                                                }}
                                                                            >
                                                                                {r.user_email}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </td>
                                                                <td style={{ padding: "12px 16px" }}>
                                                                    <span
                                                                        style={{
                                                                            fontSize: 12,
                                                                            padding: "3px 10px",
                                                                            borderRadius: 999,
                                                                            fontWeight: 500,
                                                                            background:
                                                                                r.status === "approved"
                                                                                    ? "rgba(74,222,128,0.1)"
                                                                                    : r.status === "pending"
                                                                                        ? "rgba(201,168,76,0.1)"
                                                                                        : "rgba(248,113,113,0.1)",
                                                                            color:
                                                                                r.status === "approved"
                                                                                    ? "#4ade80"
                                                                                    : r.status === "pending"
                                                                                        ? "#c9a84c"
                                                                                        : "#f87171",
                                                                            display: "flex",
                                                                            alignItems: "center",
                                                                            gap: 4,
                                                                            width: "fit-content",
                                                                            textTransform: "capitalize",
                                                                        }}
                                                                    >
                                                                        <span
                                                                            style={{
                                                                                width: 6,
                                                                                height: 6,
                                                                                background: "currentColor",
                                                                                borderRadius: "50%",
                                                                                display: "inline-block",
                                                                            }}
                                                                        />
                                                                        {r.status}
                                                                    </span>
                                                                </td>
                                                                <td
                                                                    style={{
                                                                        padding: "12px 16px",
                                                                        fontSize: 13,
                                                                        color: "var(--text-muted)",
                                                                    }}
                                                                >
                                                                    {formatDate(r.created_at)}
                                                                </td>
                                                                <td style={{ padding: "12px 16px" }}>
                                                                    <div style={{ display: "flex", gap: 6 }}>
                                                                        <button
                                                                            onClick={() => setSelectedRequest(r)}
                                                                            style={{
                                                                                display: "flex",
                                                                                alignItems: "center",
                                                                                gap: 5,
                                                                                padding: "6px 10px",
                                                                                borderRadius: 7,
                                                                                border: "1px solid var(--border)",
                                                                                background: "transparent",
                                                                                color: "var(--text-secondary)",
                                                                                fontSize: 12,
                                                                                fontWeight: 500,
                                                                                cursor: "pointer",
                                                                            }}
                                                                        >
                                                                            <Eye size={13} />
                                                                            View
                                                                        </button>
                                                                        {r.status !== "approved" && (
                                                                            <button
                                                                                onClick={() =>
                                                                                    updateRequestStatus(
                                                                                        r.id,
                                                                                        "approved"
                                                                                    )
                                                                                }
                                                                                disabled={updating === r.id}
                                                                                style={{
                                                                                    display: "flex",
                                                                                    alignItems: "center",
                                                                                    gap: 5,
                                                                                    padding: "6px 12px",
                                                                                    borderRadius: 7,
                                                                                    border: "1px solid rgba(74,222,128,0.3)",
                                                                                    background:
                                                                                        "rgba(74,222,128,0.08)",
                                                                                    color: "#4ade80",
                                                                                    fontSize: 12,
                                                                                    fontWeight: 500,
                                                                                    cursor: "pointer",
                                                                                }}
                                                                            >
                                                                                <CheckCircle size={13} />
                                                                                Approve
                                                                            </button>
                                                                        )}
                                                                        {r.status !== "rejected" && (
                                                                            <button
                                                                                onClick={() =>
                                                                                    updateRequestStatus(
                                                                                        r.id,
                                                                                        "rejected"
                                                                                    )
                                                                                }
                                                                                disabled={updating === r.id}
                                                                                style={{
                                                                                    display: "flex",
                                                                                    alignItems: "center",
                                                                                    gap: 5,
                                                                                    padding: "6px 12px",
                                                                                    borderRadius: 7,
                                                                                    border: "1px solid rgba(248,113,113,0.3)",
                                                                                    background:
                                                                                        "rgba(248,113,113,0.08)",
                                                                                    color: "#f87171",
                                                                                    fontSize: 12,
                                                                                    fontWeight: 500,
                                                                                    cursor: "pointer",
                                                                                }}
                                                                            >
                                                                                <XCircle size={13} />
                                                                                Reject
                                                                            </button>
                                                                        )}
                                                                    </div>
                                                                </td>
                                                            </motion.tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    </motion.div>
                                )
                            )}
                        </div>
                    )}
                </>
            )}

            {view === "enrollments" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                    <div style={{ position: "relative", maxWidth: 360, marginBottom: 10 }}>
                        <Search
                            size={15}
                            style={{
                                position: "absolute",
                                left: 12,
                                top: "50%",
                                transform: "translateY(-50%)",
                                color: "var(--text-muted)",
                            }}
                        />
                        <input
                            className="input"
                            type="text"
                            placeholder="Search enrollments..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            style={{ paddingLeft: 36 }}
                        />
                    </div>

                    {filteredEnrollments.length === 0 ? (
                        <div className="card" style={{ padding: 60, textAlign: "center" }}>
                            <BookOpen size={48} color="var(--text-muted)" style={{ marginBottom: 16, opacity: 0.3 }} />
                            <p style={{ color: "var(--text-muted)" }}>No enrollments found.</p>
                        </div>
                    ) : (
                        Object.entries(enrollmentGroups).map(([courseTitle, enr], gi) => (
                            <motion.div
                                key={courseTitle}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: gi * 0.05 }}
                            >
                                <div style={{ fontWeight: 600, color: "var(--text-primary)", marginBottom: 10 }}>
                                    {courseTitle} <span style={{ color: "var(--text-muted)", fontSize: 13, fontWeight: 400 }}>({enr.length})</span>
                                </div>
                                <div className="card" style={{ overflow: "hidden" }}>
                                    <div style={{ overflowX: "auto" }}>
                                        <table style={{ width: "100%", borderCollapse: "collapse" }}>
                                            <thead>
                                                <tr style={{ borderBottom: "1px solid var(--border)" }}>
                                                    <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 12, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase" }}>Student</th>
                                                    <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 12, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase" }}>Enrolled On</th>
                                                    <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 12, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase" }}>Progress</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {enr.map((student, i) => (
                                                    <tr key={student.id + i} style={{ borderBottom: "1px solid var(--border)" }}>
                                                        <td style={{ padding: "12px 16px" }}>
                                                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                                                <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#3b82f6", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700 }}>
                                                                    {getInitials(student.user_name)}
                                                                </div>
                                                                <div>
                                                                    <div style={{ fontSize: 14, fontWeight: 500, color: "var(--text-primary)" }}>{student.user_name}</div>
                                                                    <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{student.user_email}</div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td style={{ padding: "12px 16px", color: "var(--text-muted)", fontSize: 13 }}>
                                                            {formatDate(student.enrolled_at)}
                                                        </td>
                                                        <td style={{ padding: "12px 16px" }}>
                                                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                                                <div style={{ flex: 1, height: 6, background: "var(--bg-secondary)", borderRadius: 999, width: 100 }}>
                                                                    <div style={{ height: "100%", width: `${student.progress_percentage || 0}%`, background: "#4ade80", borderRadius: 999 }} />
                                                                </div>
                                                                <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{student.progress_percentage || 0}%</div>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </motion.div>
                        ))
                    )}
                </div>
            )}

            {/* Detail Modal */}
            <AnimatePresence>
                {selectedRequest && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedRequest(null)}
                            style={{
                                position: "fixed",
                                inset: 0,
                                background: "rgba(0,0,0,0.7)",
                                zIndex: 100,
                                backdropFilter: "blur(4px)",
                            }}
                        />
                        <div
                            style={{
                                position: "fixed",
                                inset: 0,
                                zIndex: 101,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                pointerEvents: "none",
                                padding: 20,
                            }}
                        >
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                                style={{
                                    width: "min(480px, 100%)",
                                    maxHeight: "80vh",
                                    overflowY: "auto",
                                    borderRadius: 16,
                                    background: "var(--bg-primary)",
                                    border: "1px solid var(--border)",
                                    boxShadow: "0 25px 50px rgba(0,0,0,0.4)",
                                    pointerEvents: "auto",
                                }}
                            >
                                {/* Modal header */}
                                <div
                                    style={{
                                        padding: "20px 24px 16px",
                                        borderBottom: "1px solid var(--border)",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "space-between",
                                    }}
                                >
                                    <h3
                                        style={{
                                            fontSize: 17,
                                            fontWeight: 600,
                                            color: "var(--text-primary)",
                                        }}
                                    >
                                        Request Details
                                    </h3>
                                    <button
                                        onClick={() => setSelectedRequest(null)}
                                        style={{
                                            background: "var(--bg-secondary)",
                                            border: "1px solid var(--border)",
                                            borderRadius: 8,
                                            width: 32,
                                            height: 32,
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            cursor: "pointer",
                                            color: "var(--text-secondary)",
                                        }}
                                    >
                                        <X size={16} />
                                    </button>
                                </div>

                                {/* Modal body */}
                                <div style={{ padding: "20px 24px" }}>
                                    {/* Student */}
                                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
                                        <div
                                            style={{
                                                width: 48,
                                                height: 48,
                                                borderRadius: "50%",
                                                background: "linear-gradient(135deg, #c9a84c, #a07830)",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                fontSize: 16,
                                                fontWeight: 700,
                                                color: "#0a0a0a",
                                                flexShrink: 0,
                                            }}
                                        >
                                            {getInitials(selectedRequest.user_name)}
                                        </div>
                                        <div>
                                            <div style={{ fontSize: 16, fontWeight: 600, color: "var(--text-primary)" }}>
                                                {selectedRequest.user_name}
                                            </div>
                                            <div style={{ fontSize: 13, color: "var(--text-muted)" }}>
                                                {selectedRequest.user_email}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Details */}
                                    <div
                                        style={{
                                            display: "flex",
                                            flexDirection: "column",
                                            gap: 14,
                                            padding: "16px",
                                            borderRadius: 12,
                                            background: "var(--bg-secondary)",
                                            marginBottom: 20,
                                        }}
                                    >
                                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                            <BookOpen size={15} color="#c9a84c" />
                                            <div>
                                                <div style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                                                    Course
                                                </div>
                                                <div style={{ fontSize: 14, fontWeight: 500, color: "var(--text-primary)" }}>
                                                    {selectedRequest.course_title}
                                                </div>
                                            </div>
                                        </div>
                                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                            <Calendar size={15} color="#a78bfa" />
                                            <div>
                                                <div style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                                                    Requested On
                                                </div>
                                                <div style={{ fontSize: 14, fontWeight: 500, color: "var(--text-primary)" }}>
                                                    {formatDate(selectedRequest.created_at)}
                                                </div>
                                            </div>
                                        </div>
                                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                            <Clock size={15} color="#f59e0b" />
                                            <div>
                                                <div style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                                                    Status
                                                </div>
                                                <span
                                                    style={{
                                                        fontSize: 12,
                                                        padding: "3px 10px",
                                                        borderRadius: 999,
                                                        fontWeight: 500,
                                                        background:
                                                            selectedRequest.status === "approved"
                                                                ? "rgba(74,222,128,0.1)"
                                                                : selectedRequest.status === "pending"
                                                                    ? "rgba(201,168,76,0.1)"
                                                                    : "rgba(248,113,113,0.1)",
                                                        color:
                                                            selectedRequest.status === "approved"
                                                                ? "#4ade80"
                                                                : selectedRequest.status === "pending"
                                                                    ? "#c9a84c"
                                                                    : "#f87171",
                                                        textTransform: "capitalize",
                                                    }}
                                                >
                                                    {selectedRequest.status}
                                                </span>
                                            </div>
                                        </div>
                                        {selectedRequest.message && (
                                            <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                                                <MessageSquare size={15} color="#38bdf8" style={{ marginTop: 2 }} />
                                                <div>
                                                    <div style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>
                                                        Message from Student
                                                    </div>
                                                    <div
                                                        style={{
                                                            fontSize: 13,
                                                            color: "var(--text-secondary)",
                                                            lineHeight: 1.6,
                                                            padding: "10px 12px",
                                                            borderRadius: 8,
                                                            background: "var(--bg-primary)",
                                                            border: "1px solid var(--border)",
                                                        }}
                                                    >
                                                        {selectedRequest.message}
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Actions */}
                                    <div style={{ display: "flex", gap: 8 }}>
                                        {selectedRequest.status !== "approved" && (
                                            <button
                                                onClick={() =>
                                                    updateRequestStatus(selectedRequest.id, "approved")
                                                }
                                                disabled={updating === selectedRequest.id}
                                                style={{
                                                    flex: 1,
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                    gap: 6,
                                                    padding: "10px 16px",
                                                    borderRadius: 10,
                                                    border: "none",
                                                    background: "linear-gradient(135deg, #4ade80, #22c55e)",
                                                    color: "#0a0a0a",
                                                    fontSize: 13,
                                                    fontWeight: 600,
                                                    cursor: "pointer",
                                                    transition: "all 0.2s",
                                                }}
                                            >
                                                <CheckCircle size={15} />
                                                Approve Access
                                            </button>
                                        )}
                                        {selectedRequest.status !== "rejected" && (
                                            <button
                                                onClick={() =>
                                                    updateRequestStatus(selectedRequest.id, "rejected")
                                                }
                                                disabled={updating === selectedRequest.id}
                                                style={{
                                                    flex: 1,
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                    gap: 6,
                                                    padding: "10px 16px",
                                                    borderRadius: 10,
                                                    border: "1px solid rgba(248,113,113,0.3)",
                                                    background: "rgba(248,113,113,0.08)",
                                                    color: "#f87171",
                                                    fontSize: 13,
                                                    fontWeight: 600,
                                                    cursor: "pointer",
                                                    transition: "all 0.2s",
                                                }}
                                            >
                                                <XCircle size={15} />
                                                Reject
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    </>
                )}
            </AnimatePresence>
        </div >
    );
}
