"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { formatDate, getDifficultyColor, getInitials } from "@/lib/utils";
import type { Profile, DashboardStats, Course } from "@/types";
import {
    Users,
    BookOpen,
    TrendingUp,
    Clock,
    CheckCircle,
    ChevronRight,
    PlusCircle,
    BarChart3,
} from "lucide-react";

interface AdminDashboardProps {
    stats: DashboardStats;
    recentUsers: Profile[];
    recentCourses: Course[];
    profile: Profile;
}

export default function AdminDashboard({
    stats,
    recentUsers,
    recentCourses,
    profile,
}: AdminDashboardProps) {
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
            value: stats.pendingUsers,
            icon: Clock,
            sub: "Awaiting review",
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
                    <Link href="/dashboard/admin/analytics">
                        <button className="btn-secondary" style={{ fontSize: 13 }}>
                            <BarChart3 size={15} />
                            Analytics
                        </button>
                    </Link>
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
                                href={`/dashboard/courses/${c.id}`}
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
