"use client";

import { motion } from "framer-motion";
import type { DashboardStats } from "@/types";
import { formatDate } from "@/lib/utils";
import { Users, BookOpen, TrendingUp, Clock, Award, BarChart3 } from "lucide-react";

interface AnalyticsClientProps {
    stats: DashboardStats;
    recentEnrollments: Array<{
        id: string;
        enrolled_at: string;
        progress_percentage: number;
        course: { title: string } | null;
        user: { full_name: string | null; email: string } | null;
    }>;
}

export default function AnalyticsClient({ stats, recentEnrollments }: AnalyticsClientProps) {
    const approvalRate = stats.totalUsers > 0
        ? Math.round((stats.approvedUsers / stats.totalUsers) * 100)
        : 0;

    const cards = [
        { label: "Total Users", value: stats.totalUsers, icon: Users, color: "#c9a84c", sub: `${approvalRate}% approval rate` },
        { label: "Active Learners", value: stats.approvedUsers, icon: TrendingUp, color: "#34d399", sub: "Approved students" },
        { label: "Pending Review", value: stats.pendingUsers, icon: Clock, color: "#f59e0b", sub: "Awaiting approval" },
        { label: "Published Courses", value: stats.publishedCourses, icon: BookOpen, color: "#a78bfa", sub: `of ${stats.totalCourses} total` },
        { label: "Total Enrollments", value: stats.totalEnrollments, icon: Award, color: "#38bdf8", sub: "All time" },
    ];

    return (
        <div style={{ maxWidth: 1100 }}>
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ marginBottom: 28 }}
            >
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                    <BarChart3 size={22} color="#c9a84c" />
                    <h1
                        style={{
                            fontFamily: "Poppins, sans-serif",
                            fontSize: "clamp(1.5rem, 3vw, 2rem)",
                            fontWeight: 700,
                            color: "var(--text-primary)",
                            letterSpacing: "-0.02em",
                        }}
                    >
                        Analytics
                    </h1>
                </div>
                <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>
                    Platform-wide performance overview
                </p>
            </motion.div>

            {/* Stats */}
            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                    gap: 16,
                    marginBottom: 32,
                }}
            >
                {cards.map((card, i) => (
                    <motion.div
                        key={card.label}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.07 }}
                        className="card"
                        style={{ padding: "20px" }}
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
                                marginBottom: 12,
                            }}
                        >
                            <card.icon size={18} color={card.color} />
                        </div>
                        <div style={{ fontSize: 30, fontWeight: 800, fontFamily: "Poppins", color: "var(--text-primary)", lineHeight: 1 }}>
                            {card.value}
                        </div>
                        <div style={{ fontSize: 13, color: "var(--text-secondary)", fontWeight: 500, marginTop: 4 }}>
                            {card.label}
                        </div>
                        <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
                            {card.sub}
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* User ratio */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="card"
                style={{ padding: "24px", marginBottom: 20 }}
            >
                <h3 style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)", marginBottom: 16 }}>
                    User Status Distribution
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {[
                        { label: "Approved", count: stats.approvedUsers, color: "#4ade80" },
                        { label: "Pending", count: stats.pendingUsers, color: "#c9a84c" },
                        { label: "Rejected", count: stats.totalUsers - stats.approvedUsers - stats.pendingUsers, color: "#f87171" },
                    ].map((item) => (
                        <div key={item.label}>
                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 6 }}>
                                <span style={{ color: "var(--text-secondary)" }}>{item.label}</span>
                                <span style={{ color: item.color, fontWeight: 600 }}>{item.count}</span>
                            </div>
                            <div className="progress-bar">
                                <div
                                    style={{
                                        height: "100%",
                                        width: `${stats.totalUsers > 0 ? (item.count / stats.totalUsers) * 100 : 0}%`,
                                        background: item.color,
                                        borderRadius: 999,
                                        transition: "width 0.8s ease",
                                    }}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </motion.div>

            {/* Recent Enrollments */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="card"
                style={{ overflow: "hidden" }}
            >
                <div style={{ padding: "20px 20px 0" }}>
                    <h3 style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)", marginBottom: 16 }}>
                        Recent Enrollments
                    </h3>
                </div>
                {recentEnrollments.length === 0 ? (
                    <div style={{ padding: 32, textAlign: "center" }}>
                        <p style={{ color: "var(--text-muted)", fontSize: 14 }}>No enrollments yet</p>
                    </div>
                ) : (
                    <div style={{ overflowX: "auto" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse" }}>
                            <thead>
                                <tr style={{ borderBottom: "1px solid var(--border)" }}>
                                    {["Student", "Course", "Progress", "Joined"].map((h) => (
                                        <th
                                            key={h}
                                            style={{
                                                padding: "10px 16px",
                                                textAlign: "left",
                                                fontSize: 11,
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
                                {recentEnrollments.map((e) => (
                                    <tr
                                        key={e.id}
                                        style={{ borderBottom: "1px solid var(--border)" }}
                                        onMouseEnter={(el) => (el.currentTarget.style.background = "var(--bg-secondary)")}
                                        onMouseLeave={(el) => (el.currentTarget.style.background = "transparent")}
                                    >
                                        <td style={{ padding: "12px 16px" }}>
                                            <div style={{ fontSize: 14, fontWeight: 500, color: "var(--text-primary)" }}>
                                                {e.user?.full_name || "—"}
                                            </div>
                                            <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{e.user?.email}</div>
                                        </td>
                                        <td style={{ padding: "12px 16px", fontSize: 13, color: "var(--text-secondary)" }}>
                                            {e.course?.title || "—"}
                                        </td>
                                        <td style={{ padding: "12px 16px" }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                                <div className="progress-bar" style={{ width: 80 }}>
                                                    <div className="progress-fill" style={{ width: `${e.progress_percentage}%` }} />
                                                </div>
                                                <span style={{ fontSize: 12, color: "#c9a84c", fontWeight: 600 }}>
                                                    {e.progress_percentage}%
                                                </span>
                                            </div>
                                        </td>
                                        <td style={{ padding: "12px 16px", fontSize: 13, color: "var(--text-muted)" }}>
                                            {formatDate(e.enrolled_at)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </motion.div>
        </div>
    );
}
