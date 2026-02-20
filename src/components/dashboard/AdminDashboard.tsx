"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import toast from "react-hot-toast";
import { doc, updateDoc, addDoc, collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { formatDate, getInitials } from "@/lib/utils";
import type { Profile, DashboardStats, Course, CourseAccessRequest } from "@/types";
import {
    Users,
    BookOpen,
    TrendingUp,
    Clock,
    CheckCircle,
    ChevronRight,
    PlusCircle,
    BarChart3,
    ClipboardList,
    XCircle,
    Inbox,
    Download,
} from "lucide-react";

interface AdminDashboardProps {
    stats: DashboardStats;
    recentUsers: Profile[];
    recentCourses: Course[];
    accessRequests: CourseAccessRequest[];
    profile: Profile;
}

export default function AdminDashboard({
    stats,
    recentUsers,
    recentCourses,
    accessRequests: initialRequests,
    profile,
}: AdminDashboardProps) {
    const [accessRequests, setAccessRequests] = useState<CourseAccessRequest[]>(initialRequests);
    const [updating, setUpdating] = useState<string | null>(null);

    const pendingRequests = accessRequests.filter(r => r.status === "pending");

    async function handleApprove(request: CourseAccessRequest) {
        setUpdating(request.id);
        try {
            // 1. Update request status to approved
            const requestRef = doc(db, "course_access_requests", request.id);
            await updateDoc(requestRef, {
                status: "approved",
                updated_at: new Date().toISOString(),
            });

            // 2. Create an enrollment record so the student can access the course
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

            toast.success(`Approved access for ${request.user_name}`);
            setAccessRequests(prev =>
                prev.map(r => r.id === request.id ? { ...r, status: "approved" as const } : r)
            );
        } catch (error) {
            console.error("Error approving request:", error);
            toast.error("Failed to approve request");
        }
        setUpdating(null);
    }

    async function handleReject(request: CourseAccessRequest) {
        setUpdating(request.id);
        try {
            const requestRef = doc(db, "course_access_requests", request.id);
            await updateDoc(requestRef, {
                status: "rejected",
                updated_at: new Date().toISOString(),
            });

            toast.success(`Rejected request from ${request.user_name}`);
            setAccessRequests(prev =>
                prev.map(r => r.id === request.id ? { ...r, status: "rejected" as const } : r)
            );
        } catch (error) {
            console.error("Error rejecting request:", error);
            toast.error("Failed to reject request");
        }
        setUpdating(null);
    }

    async function handleExportCSV() {
        try {
            const usersRef = collection(db, "users");
            const snap = await getDocs(usersRef);
            const users = snap.docs.map(doc => doc.data());

            if (users.length === 0) {
                toast("No users to export", { icon: "ℹ️" });
                return;
            }

            const headers = ["ID", "Full Name", "Email", "Role", "Status", "Created At"];
            const csvRows = [headers.join(",")];

            for (const row of users as Profile[]) {
                const values = [
                    row.id,
                    `"${row.full_name || ""}"`,
                    row.email,
                    row.role,
                    row.status,
                    row.created_at
                ];
                csvRows.push(values.join(","));
            }

            const csvData = csvRows.join("\n");
            const blob = new Blob([csvData], { type: "text/csv" });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.setAttribute("hidden", "");
            a.setAttribute("href", url);
            a.setAttribute("download", `luxaar_users_${new Date().toISOString().split("T")[0]}.csv`);
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            toast.success("Exported users to CSV");
        } catch (error) {
            console.error("Export error:", error);
            toast.error("Failed to export data");
        }
    }

    const cards = [
        {
            label: "Total Users",
            value: stats.totalUsers,
            icon: Users,
            sub: `${stats.approvedUsers} approved`,
            color: "#c9a84c",
        },
        {
            label: "Pending Approvals",
            value: pendingRequests.length,
            icon: Clock,
            sub: "Course access requests",
            color: "#f59e0b",
        },
        {
            label: "Total Courses",
            value: stats.totalCourses,
            icon: BookOpen,
            sub: `${stats.publishedCourses} published`,
            color: "#a78bfa",
        },
        {
            label: "Total Enrollments",
            value: stats.totalEnrollments,
            icon: TrendingUp,
            sub: "All time",
            color: "#34d399",
        },
    ];

    return (
        <div style={{ maxWidth: 1200 }}>
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
                    }}
                >
                    Good morning, {profile.full_name?.split(" ")[0] ?? "Admin"} 👋
                </h1>
                <p style={{ color: "var(--text-secondary)", fontSize: 14, marginTop: 4 }}>
                    Here&apos;s what&apos;s happening on your platform today.
                </p>
            </motion.div>

            {/* Stats grid */}
            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                    gap: 16,
                    marginBottom: 28,
                }}
            >
                {cards.map((card, i) => (
                    <motion.div
                        key={card.label}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.08 }}
                        className="card"
                        style={{ padding: "20px 20px" }}
                    >
                        <div
                            style={{
                                display: "flex",
                                alignItems: "flex-start",
                                justifyContent: "space-between",
                                marginBottom: 12,
                            }}
                        >
                            <div
                                style={{
                                    width: 38,
                                    height: 38,
                                    borderRadius: 10,
                                    background: `${card.color}14`,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                }}
                            >
                                <card.icon size={18} color={card.color} />
                            </div>
                        </div>
                        <div
                            style={{
                                fontSize: 28,
                                fontWeight: 800,
                                fontFamily: "Poppins",
                                color: "var(--text-primary)",
                                lineHeight: 1,
                                marginBottom: 4,
                            }}
                        >
                            {card.value}
                        </div>
                        <div style={{ fontSize: 13, color: "var(--text-secondary)", fontWeight: 500 }}>
                            {card.label}
                        </div>
                        <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
                            {card.sub}
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Quick actions */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                style={{ marginBottom: 28 }}
            >
                <h2
                    style={{
                        fontSize: 16,
                        fontWeight: 600,
                        color: "var(--text-primary)",
                        marginBottom: 14,
                    }}
                >
                    Quick Actions
                </h2>
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                    <Link href="/dashboard/admin/users">
                        <button className="btn-secondary" style={{ fontSize: 13 }}>
                            <Users size={15} />
                            Manage Users
                        </button>
                    </Link>
                    <Link href="/dashboard/admin/courses/new">
                        <button className="btn-primary" style={{ fontSize: 13 }}>
                            <PlusCircle size={15} />
                            New Course
                        </button>
                    </Link>
                    <Link href="/dashboard/admin/enrollments">
                        <button className="btn-secondary" style={{ fontSize: 13 }}>
                            <ClipboardList size={15} />
                            Access Requests
                        </button>
                    </Link>
                    <Link href="/dashboard/admin/analytics">
                        <button className="btn-secondary" style={{ fontSize: 13 }}>
                            <BarChart3 size={15} />
                            Analytics
                        </button>
                    </Link>
                    <button onClick={handleExportCSV} className="btn-secondary" style={{ fontSize: 13 }}>
                        <Download size={15} />
                        Export Data
                    </button>
                </div>
            </motion.div>

            {/* Pending Access Requests Section */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
                style={{ marginBottom: 28 }}
            >
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginBottom: 14,
                    }}
                >
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <h2
                            style={{
                                fontSize: 16,
                                fontWeight: 600,
                                color: "var(--text-primary)",
                            }}
                        >
                            Course Access Requests
                        </h2>
                        {pendingRequests.length > 0 && (
                            <span
                                style={{
                                    background: "#f59e0b",
                                    color: "#000",
                                    borderRadius: 999,
                                    padding: "2px 8px",
                                    fontSize: 11,
                                    fontWeight: 700,
                                }}
                            >
                                {pendingRequests.length} pending
                            </span>
                        )}
                    </div>
                    <Link href="/dashboard/admin/enrollments" style={{ textDecoration: "none" }}>
                        <span style={{ fontSize: 12, color: "#c9a84c", fontWeight: 500 }}>
                            View all
                        </span>
                    </Link>
                </div>

                <div className="card" style={{ overflow: "hidden" }}>
                    {pendingRequests.length === 0 ? (
                        <div style={{ padding: 40, textAlign: "center" }}>
                            <Inbox size={36} color="var(--text-muted)" style={{ marginBottom: 10, opacity: 0.3 }} />
                            <p style={{ color: "var(--text-muted)", fontSize: 14 }}>
                                No pending access requests
                            </p>
                            <p style={{ color: "var(--text-muted)", fontSize: 12, marginTop: 4, opacity: 0.7 }}>
                                When students request access to your courses, they&apos;ll appear here.
                            </p>
                        </div>
                    ) : (
                        <div style={{ overflowX: "auto" }}>
                            <table style={{ width: "100%", borderCollapse: "collapse" }}>
                                <thead>
                                    <tr style={{ borderBottom: "1px solid var(--border)" }}>
                                        {["Student", "Course", "Requested", "Actions"].map((h) => (
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
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {pendingRequests.slice(0, 10).map((r, i) => (
                                        <motion.tr
                                            key={r.id}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ delay: i * 0.04 }}
                                            style={{
                                                borderBottom: "1px solid var(--border)",
                                                transition: "background 0.15s",
                                            }}
                                            onMouseEnter={(e) =>
                                                (e.currentTarget.style.background = "var(--bg-secondary)")
                                            }
                                            onMouseLeave={(e) =>
                                                (e.currentTarget.style.background = "transparent")
                                            }
                                        >
                                            {/* Student */}
                                            <td style={{ padding: "12px 16px" }}>
                                                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                                    <div
                                                        style={{
                                                            width: 36,
                                                            height: 36,
                                                            borderRadius: "50%",
                                                            background: "linear-gradient(135deg, #c9a84c, #a07830)",
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
                                                        <div style={{ fontSize: 14, fontWeight: 500, color: "var(--text-primary)" }}>
                                                            {r.user_name || "—"}
                                                        </div>
                                                        <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                                                            {r.user_email}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            {/* Course */}
                                            <td style={{ padding: "12px 16px" }}>
                                                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                                    <div
                                                        style={{
                                                            width: 28,
                                                            height: 28,
                                                            borderRadius: 6,
                                                            background: "rgba(201,168,76,0.1)",
                                                            display: "flex",
                                                            alignItems: "center",
                                                            justifyContent: "center",
                                                            flexShrink: 0,
                                                        }}
                                                    >
                                                        <BookOpen size={13} color="#c9a84c" />
                                                    </div>
                                                    <span style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)" }}>
                                                        {r.course_title}
                                                    </span>
                                                </div>
                                            </td>
                                            {/* Date */}
                                            <td style={{ padding: "12px 16px", fontSize: 13, color: "var(--text-muted)" }}>
                                                {formatDate(r.created_at)}
                                            </td>
                                            {/* Actions */}
                                            <td style={{ padding: "12px 16px" }}>
                                                <div style={{ display: "flex", gap: 6 }}>
                                                    <button
                                                        onClick={() => handleApprove(r)}
                                                        disabled={updating === r.id}
                                                        style={{
                                                            display: "flex",
                                                            alignItems: "center",
                                                            gap: 5,
                                                            padding: "6px 12px",
                                                            borderRadius: 7,
                                                            border: "1px solid rgba(74,222,128,0.3)",
                                                            background: "rgba(74,222,128,0.08)",
                                                            color: "#4ade80",
                                                            fontSize: 12,
                                                            fontWeight: 500,
                                                            cursor: "pointer",
                                                        }}
                                                    >
                                                        <CheckCircle size={13} />
                                                        Approve
                                                    </button>
                                                    <button
                                                        onClick={() => handleReject(r)}
                                                        disabled={updating === r.id}
                                                        style={{
                                                            display: "flex",
                                                            alignItems: "center",
                                                            gap: 5,
                                                            padding: "6px 12px",
                                                            borderRadius: 7,
                                                            border: "1px solid rgba(248,113,113,0.3)",
                                                            background: "rgba(248,113,113,0.08)",
                                                            color: "#f87171",
                                                            fontSize: 12,
                                                            fontWeight: 500,
                                                            cursor: "pointer",
                                                        }}
                                                    >
                                                        <XCircle size={13} />
                                                        Reject
                                                    </button>
                                                </div>
                                            </td>
                                        </motion.tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </motion.div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 20 }}>
                {/* Recent Users */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="card"
                    style={{ padding: "20px" }}
                >
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            marginBottom: 16,
                        }}
                    >
                        <h3 style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)" }}>
                            Recent Users
                        </h3>
                        <Link href="/dashboard/admin/users" style={{ textDecoration: "none" }}>
                            <span style={{ fontSize: 12, color: "#c9a84c", fontWeight: 500 }}>
                                View all
                            </span>
                        </Link>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        {recentUsers.map((u) => (
                            <div
                                key={u.id}
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 10,
                                    padding: "10px",
                                    borderRadius: 10,
                                    background: "var(--bg-secondary)",
                                }}
                            >
                                <div
                                    style={{
                                        width: 34,
                                        height: 34,
                                        borderRadius: 999,
                                        background: "linear-gradient(135deg, #c9a84c, #a07830)",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        fontSize: 12,
                                        fontWeight: 700,
                                        color: "#0a0a0a",
                                        flexShrink: 0,
                                    }}
                                >
                                    {getInitials(u.full_name)}
                                </div>
                                <div style={{ flex: 1, overflow: "hidden" }}>
                                    <div
                                        style={{
                                            fontSize: 13,
                                            fontWeight: 500,
                                            color: "var(--text-primary)",
                                            overflow: "hidden",
                                            textOverflow: "ellipsis",
                                            whiteSpace: "nowrap",
                                        }}
                                    >
                                        {u.full_name || "Unknown"}
                                    </div>
                                    <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                                        {u.email}
                                    </div>
                                </div>
                                <span
                                    className="badge"
                                    style={{
                                        fontSize: 11,
                                        padding: "3px 8px",
                                        flexShrink: 0,
                                        background:
                                            u.status === "approved"
                                                ? "rgba(74,222,128,0.1)"
                                                : u.status === "pending"
                                                    ? "rgba(201,168,76,0.1)"
                                                    : "rgba(248,113,113,0.1)",
                                        color:
                                            u.status === "approved"
                                                ? "#4ade80"
                                                : u.status === "pending"
                                                    ? "#c9a84c"
                                                    : "#f87171",
                                    }}
                                >
                                    {u.status}
                                </span>
                            </div>
                        ))}
                        {recentUsers.length === 0 && (
                            <p style={{ fontSize: 13, color: "var(--text-muted)", textAlign: "center", padding: "20px 0" }}>
                                No users yet
                            </p>
                        )}
                    </div>
                </motion.div>

                {/* Recent Courses */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.45 }}
                    className="card"
                    style={{ padding: "20px" }}
                >
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            marginBottom: 16,
                        }}
                    >
                        <h3 style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)" }}>
                            Recent Courses
                        </h3>
                        <Link href="/dashboard/courses" style={{ textDecoration: "none" }}>
                            <span style={{ fontSize: 12, color: "#c9a84c", fontWeight: 500 }}>
                                View all
                            </span>
                        </Link>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        {recentCourses.map((c) => (
                            <Link
                                key={c.id}
                                href={`/dashboard/courses/view?id=${c.id}`}
                                style={{ textDecoration: "none" }}
                            >
                                <div
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 12,
                                        padding: 10,
                                        borderRadius: 10,
                                        background: "var(--bg-secondary)",
                                        cursor: "pointer",
                                        transition: "all 0.2s",
                                    }}
                                    onMouseEnter={(e) =>
                                        (e.currentTarget.style.background = "rgba(201,168,76,0.05)")
                                    }
                                    onMouseLeave={(e) =>
                                        (e.currentTarget.style.background = "var(--bg-secondary)")
                                    }
                                >
                                    <div
                                        style={{
                                            width: 38,
                                            height: 38,
                                            borderRadius: 8,
                                            background: "rgba(201,168,76,0.1)",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            flexShrink: 0,
                                        }}
                                    >
                                        <BookOpen size={16} color="#c9a84c" />
                                    </div>
                                    <div style={{ flex: 1, overflow: "hidden" }}>
                                        <div
                                            style={{
                                                fontSize: 13,
                                                fontWeight: 500,
                                                color: "var(--text-primary)",
                                                overflow: "hidden",
                                                textOverflow: "ellipsis",
                                                whiteSpace: "nowrap",
                                            }}
                                        >
                                            {c.title}
                                        </div>
                                        <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                                            {c.instructor_name} · {formatDate(c.created_at)}
                                        </div>
                                    </div>
                                    <span
                                        style={{
                                            fontSize: 11,
                                            padding: "2px 8px",
                                            borderRadius: 999,
                                            flexShrink: 0,
                                            background: c.is_published
                                                ? "rgba(74,222,128,0.1)"
                                                : "rgba(201,168,76,0.1)",
                                            color: c.is_published ? "#4ade80" : "#c9a84c",
                                        }}
                                    >
                                        {c.is_published ? "Live" : "Draft"}
                                    </span>
                                </div>
                            </Link>
                        ))}
                        {recentCourses.length === 0 && (
                            <div style={{ textAlign: "center", padding: "24px 0" }}>
                                <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 12 }}>
                                    No courses yet
                                </p>
                                <Link href="/dashboard/admin/courses/new">
                                    <button className="btn-primary" style={{ fontSize: 13 }}>
                                        <PlusCircle size={15} />
                                        Create Course
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
