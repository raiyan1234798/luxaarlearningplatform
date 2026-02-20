"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import type { Profile } from "@/types";
import { getInitials, formatDate } from "@/lib/utils";
import {
    CheckCircle,
    XCircle,
    Search,
    Users,
    Clock,
    Filter,
} from "lucide-react";

interface AdminUsersClientProps {
    users: Profile[];
}

type FilterType = "all" | "pending" | "approved" | "rejected";

export default function AdminUsersClient({ users: initialUsers }: AdminUsersClientProps) {
    const [users, setUsers] = useState<Profile[]>(initialUsers);
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState<FilterType>("all");
    const [updating, setUpdating] = useState<string | null>(null);

    const filtered = users.filter((u) => {
        const matchSearch =
            (u.email || "").toLowerCase().includes(search.toLowerCase()) ||
            (u.full_name || "").toLowerCase().includes(search.toLowerCase());
        const matchFilter = filter === "all" || u.status === filter;
        return matchSearch && matchFilter;
    });

    const pending = users.filter((u) => u.status === "pending").length;
    const approved = users.filter((u) => u.status === "approved").length;

    async function updateStatus(
        userId: string,
        status: "approved" | "rejected"
    ) {
        setUpdating(userId);
        try {
            const userRef = doc(db, "users", userId);
            await updateDoc(userRef, {
                status,
                updated_at: new Date().toISOString()
            });
            toast.success(`User ${status}`);
            setUsers((prev) =>
                prev.map((u) => (u.id === userId ? { ...u, status } : u))
            );
        } catch (error) {
            console.error("Error updating user status:", error);
            toast.error("Failed to update user");
        }
        setUpdating(null);
    }

    async function updateRole(userId: string, role: "admin" | "student") {
        setUpdating(userId);
        try {
            const userRef = doc(db, "users", userId);
            await updateDoc(userRef, {
                role,
                updated_at: new Date().toISOString()
            });
            toast.success(`Role updated to ${role}`);
            setUsers((prev) =>
                prev.map((u) => (u.id === userId ? { ...u, role } : u))
            );
        } catch (error) {
            console.error("Error updating user role:", error);
            toast.error("Failed to update role");
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
                    Manage Users
                </h1>
                <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>
                    Approve or reject access requests and manage user roles.
                </p>
            </motion.div>

            {/* Stats */}
            <div style={{ display: "flex", gap: 14, marginBottom: 24, flexWrap: "wrap" }}>
                {[
                    { label: "Total", value: users.length, icon: Users, color: "#c9a84c" },
                    { label: "Pending", value: pending, icon: Clock, color: "#f59e0b" },
                    { label: "Approved", value: approved, icon: CheckCircle, color: "#4ade80" },
                ].map((s, i) => (
                    <motion.div
                        key={s.label}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.07 }}
                        className="card"
                        style={{ padding: "14px 18px", display: "flex", alignItems: "center", gap: 12, flex: "1 1 calc(33% - 14px)", minWidth: 140 }}
                    >
                        <div
                            style={{
                                width: 34,
                                height: 34,
                                borderRadius: 9,
                                background: `${s.color}14`,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                            }}
                        >
                            <s.icon size={16} color={s.color} />
                        </div>
                        <div>
                            <div style={{ fontSize: 20, fontWeight: 800, fontFamily: "Poppins", color: "var(--text-primary)" }}>
                                {s.value}
                            </div>
                            <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{s.label}</div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Filters */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap", alignItems: "center" }}
            >
                <div style={{ position: "relative", flex: "1 1 240px", maxWidth: 360 }}>
                    <Search size={15} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                    <input
                        className="input"
                        type="text"
                        placeholder="Search users..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        style={{ paddingLeft: 36 }}
                    />
                </div>
                <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
                    <Filter size={13} color="var(--text-muted)" />
                    {(["all", "pending", "approved", "rejected"] as FilterType[]).map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            style={{
                                padding: "6px 12px",
                                borderRadius: 7,
                                border: "1px solid",
                                borderColor: filter === f ? "rgba(201,168,76,0.5)" : "var(--border)",
                                background: filter === f ? "rgba(201,168,76,0.1)" : "transparent",
                                color: filter === f ? "#c9a84c" : "var(--text-secondary)",
                                fontSize: 12,
                                fontWeight: filter === f ? 600 : 400,
                                cursor: "pointer",
                                textTransform: "capitalize",
                            }}
                        >
                            {f}
                        </button>
                    ))}
                </div>
            </motion.div>

            {/* Users table */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="card"
                style={{ overflow: "hidden" }}
            >
                {filtered.length === 0 ? (
                    <div style={{ padding: 40, textAlign: "center" }}>
                        <Users size={40} color="var(--text-muted)" style={{ marginBottom: 12, opacity: 0.4 }} />
                        <p style={{ color: "var(--text-muted)", fontSize: 14 }}>No users found</p>
                    </div>
                ) : (
                    <div style={{ overflowX: "auto" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse" }}>
                            <thead>
                                <tr style={{ borderBottom: "1px solid var(--border)" }}>
                                    {["User", "Status", "Role", "Joined", "Actions"].map((h) => (
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
                                {filtered.map((u, i) => (
                                    <motion.tr
                                        key={u.id}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: i * 0.03 }}
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
                                        <td style={{ padding: "12px 16px" }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                                <div
                                                    style={{
                                                        width: 34,
                                                        height: 34,
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
                                                    {getInitials(u.full_name)}
                                                </div>
                                                <div>
                                                    <div style={{ fontSize: 14, fontWeight: 500, color: "var(--text-primary)" }}>
                                                        {u.full_name || "—"}
                                                    </div>
                                                    <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{u.email}</div>
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
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: 4,
                                                    width: "fit-content",
                                                }}
                                            >
                                                <span className="status-dot" style={{ width: 6, height: 6, background: "currentColor", borderRadius: "50%", display: "inline-block" }} />
                                                {u.status}
                                            </span>
                                        </td>
                                        <td style={{ padding: "12px 16px" }}>
                                            <select
                                                value={u.role}
                                                onChange={(e) =>
                                                    updateRole(u.id, e.target.value as "admin" | "student")
                                                }
                                                disabled={updating === u.id}
                                                className="input"
                                                style={{
                                                    width: "auto",
                                                    padding: "5px 10px",
                                                    fontSize: 12,
                                                }}
                                            >
                                                <option value="student">Student</option>
                                                <option value="admin">Admin</option>
                                            </select>
                                        </td>
                                        <td style={{ padding: "12px 16px", fontSize: 13, color: "var(--text-muted)" }}>
                                            {formatDate(u.created_at)}
                                        </td>
                                        <td style={{ padding: "12px 16px" }}>
                                            <div style={{ display: "flex", gap: 6 }}>
                                                {u.status !== "approved" && (
                                                    <button
                                                        onClick={() => updateStatus(u.id, "approved")}
                                                        disabled={updating === u.id}
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
                                                )}
                                                {u.status !== "rejected" && (
                                                    <button
                                                        onClick={() => updateStatus(u.id, "rejected")}
                                                        disabled={updating === u.id}
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
                                                )}
                                            </div>
                                        </td>
                                    </motion.tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </motion.div>
        </div>
    );
}
