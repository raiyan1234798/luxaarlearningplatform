"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { useAuth } from "@/lib/contexts/AuthContext";
import { useTheme } from "@/components/providers/ThemeProvider";
import { getInitials } from "@/lib/utils";
import type { Profile, Notification as NotificationType } from "@/types";
import { collection, getDocs, query, where, orderBy, doc, updateDoc, writeBatch } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import {
    BookOpen,
    LayoutDashboard,
    PlayCircle,
    Users,
    PlusCircle,
    BarChart3,
    LogOut,
    Menu,
    X,
    Sun,
    Moon,
    ChevronRight,
    Bell,
    GraduationCap,
    ClipboardList,
    CheckCircle,
    Sparkles,
    MessageSquare,
} from "lucide-react";

interface AppShellProps {
    children: React.ReactNode;
    profile: Profile;
}

const studentNav = [
    { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { href: "/dashboard/courses", icon: BookOpen, label: "All Courses" },
    { href: "/dashboard/my-courses", icon: PlayCircle, label: "My Learning" },
];

const adminNav = [
    { href: "/dashboard", icon: LayoutDashboard, label: "Overview" },
    { href: "/dashboard/admin/courses", icon: BookOpen, label: "Manage Courses" },
    { href: "/dashboard/admin/courses/new", icon: PlusCircle, label: "New Course" },
    { href: "/dashboard/admin/users", icon: Users, label: "Users" },
    { href: "/dashboard/admin/enrollments", icon: ClipboardList, label: "Access Requests" },
    { href: "/dashboard/admin/analytics", icon: BarChart3, label: "Analytics" },
    { href: "/dashboard/admin/support", icon: MessageSquare, label: "Support Messages" },
];

export default function AppShell({ children, profile }: AppShellProps) {
    const pathname = usePathname();
    const router = useRouter();
    const { signOut, user } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [desktopSidebarOpen, setDesktopSidebarOpen] = useState(true);
    const [notifications, setNotifications] = useState<NotificationType[]>([]);
    const [showNotifications, setShowNotifications] = useState(false);
    const notifRef = useRef<HTMLDivElement>(null);

    const navItems = profile.role === "admin" ? adminNav : studentNav;
    const unreadCount = notifications.filter((n) => !n.is_read).length;

    // Fetch notifications
    useEffect(() => {
        async function fetchNotifications() {
            if (!user) return;
            try {
                const notifRef = collection(db, "notifications");
                const q = query(
                    notifRef,
                    where("user_id", "==", user.uid),
                    orderBy("created_at", "desc")
                );
                const snap = await getDocs(q);
                const notifs: NotificationType[] = [];
                snap.forEach((doc) => {
                    notifs.push({ id: doc.id, ...doc.data() } as NotificationType);
                });
                setNotifications(notifs);
            } catch (e) {
                // Collection may not exist yet
            }
        }

        fetchNotifications();
        // Poll every 30 seconds
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, [user]);

    // Close notification dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
                setShowNotifications(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    async function markAsRead(notifId: string) {
        try {
            await updateDoc(doc(db, "notifications", notifId), { is_read: true });
            setNotifications((prev) =>
                prev.map((n) => (n.id === notifId ? { ...n, is_read: true } : n))
            );
        } catch (e) {
            console.error("Error marking notification as read:", e);
        }
    }

    async function markAllAsRead() {
        try {
            const batch = writeBatch(db);
            notifications.filter((n) => !n.is_read).forEach((n) => {
                batch.update(doc(db, "notifications", n.id), { is_read: true });
            });
            await batch.commit();
            setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
            toast.success("All notifications marked as read");
        } catch (e) {
            console.error("Error marking all as read:", e);
        }
    }

    async function handleSignOut() {
        await signOut();
        // toast.success("Signed out"); // Handled in AuthContext
        // router.push("/login"); // Handled in AuthContext
    }

    const SidebarContent = ({ onClose }: { onClose?: () => void }) => (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                height: "100%",
                padding: "0 0 24px",
                minWidth: 240,
            }}
        >
            {/* Logo */}
            <div
                style={{
                    padding: "24px 20px 20px",
                    borderBottom: "1px solid rgba(255,255,255,0.06)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                }}
            >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div
                        style={{
                            width: 36,
                            height: 36,
                            borderRadius: 10,
                            background: "linear-gradient(135deg, #c9a84c, #a07830)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                        }}
                    >
                        <BookOpen size={18} color="#0a0a0a" />
                    </div>
                    <div>
                        <div
                            style={{
                                fontFamily: "Poppins, sans-serif",
                                fontWeight: 700,
                                fontSize: 18,
                                color: "#fff",
                                letterSpacing: "-0.01em",
                            }}
                        >
                            Luxaar
                        </div>
                        <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", lineHeight: 1 }}>
                            {profile.role === "admin" ? "Admin Panel" : "Learning Platform"}
                        </div>
                    </div>
                </div>

                {onClose && (
                    <button
                        onClick={onClose}
                        title="Close Sidebar"
                        style={{
                            background: "rgba(255,255,255,0.1)",
                            border: "1px solid rgba(255,255,255,0.1)",
                            borderRadius: 8,
                            color: "rgba(255,255,255,0.8)",
                            cursor: "pointer",
                            width: 32,
                            height: 32,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            transition: "all 0.2s",
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = "rgba(255,255,255,0.2)";
                            e.currentTarget.style.color = "#fff";
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = "rgba(255,255,255,0.1)";
                            e.currentTarget.style.color = "rgba(255,255,255,0.8)";
                        }}
                    >
                        <X size={18} />
                    </button>
                )}
            </div>

            {/* Role badge */}
            {profile.role === "admin" && (
                <div style={{ padding: "12px 20px" }}>
                    <div
                        style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 5,
                            padding: "4px 10px",
                            borderRadius: 999,
                            background: "rgba(201,168,76,0.15)",
                            border: "1px solid rgba(201,168,76,0.25)",
                        }}
                    >
                        <GraduationCap size={11} color="#c9a84c" />
                        <span style={{ fontSize: 11, color: "#c9a84c", fontWeight: 600 }}>
                            Administrator
                        </span>
                    </div>
                </div>
            )}

            {/* Nav */}
            <nav style={{ flex: 1, padding: "8px 12px", overflowY: "auto", overflowX: "hidden" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    {navItems.map((item) => {
                        const active =
                            item.href === "/dashboard"
                                ? pathname === "/dashboard"
                                : pathname.startsWith(item.href);
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => setSidebarOpen(false)}
                                style={{ textDecoration: "none" }}
                            >
                                <div
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 10,
                                        padding: "10px 12px",
                                        borderRadius: 10,
                                        background: active
                                            ? "rgba(201,168,76,0.12)"
                                            : "transparent",
                                        transition: "all 0.2s",
                                        cursor: "pointer",
                                        position: "relative",
                                        whiteSpace: "nowrap",
                                    }}
                                    onMouseEnter={(e) => {
                                        if (!active)
                                            e.currentTarget.style.background = "rgba(255,255,255,0.05)";
                                    }}
                                    onMouseLeave={(e) => {
                                        if (!active) e.currentTarget.style.background = "transparent";
                                    }}
                                >
                                    {active && (
                                        <div
                                            style={{
                                                position: "absolute",
                                                left: 0,
                                                top: "50%",
                                                transform: "translateY(-50%)",
                                                width: 3,
                                                height: 18,
                                                borderRadius: "0 3px 3px 0",
                                                background: "#c9a84c",
                                            }}
                                        />
                                    )}
                                    <item.icon
                                        size={17}
                                        color={active ? "#c9a84c" : "rgba(255,255,255,0.5)"}
                                    />
                                    <span
                                        style={{
                                            fontSize: 14,
                                            fontWeight: active ? 600 : 400,
                                            color: active ? "#fff" : "rgba(255,255,255,0.55)",
                                        }}
                                    >
                                        {item.label}
                                    </span>
                                    {active && (
                                        <ChevronRight
                                            size={14}
                                            color="#c9a84c"
                                            style={{ marginLeft: "auto", opacity: 0.6 }}
                                        />
                                    )}
                                </div>
                            </Link>
                        );
                    })}
                </div>
            </nav>

            {/* Bottom actions */}
            <div
                style={{
                    padding: "12px",
                    borderTop: "1px solid rgba(255,255,255,0.06)",
                    display: "flex",
                    flexDirection: "column",
                    gap: 4,
                }}
            >
                <button
                    onClick={toggleTheme}
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        padding: "10px 12px",
                        borderRadius: 10,
                        background: "transparent",
                        border: "none",
                        cursor: "pointer",
                        width: "100%",
                        color: "rgba(255,255,255,0.5)",
                        fontSize: 14,
                        transition: "all 0.2s",
                        whiteSpace: "nowrap",
                    }}
                    onMouseEnter={(e) =>
                        (e.currentTarget.style.background = "rgba(255,255,255,0.05)")
                    }
                    onMouseLeave={(e) =>
                        (e.currentTarget.style.background = "transparent")
                    }
                >
                    {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
                    <span>{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>
                </button>

                <button
                    onClick={handleSignOut}
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        padding: "10px 12px",
                        borderRadius: 10,
                        background: "transparent",
                        border: "none",
                        cursor: "pointer",
                        width: "100%",
                        color: "rgba(248,113,113,0.7)",
                        fontSize: 14,
                        transition: "all 0.2s",
                        whiteSpace: "nowrap",
                    }}
                    onMouseEnter={(e) =>
                        (e.currentTarget.style.background = "rgba(248,113,113,0.08)")
                    }
                    onMouseLeave={(e) =>
                        (e.currentTarget.style.background = "transparent")
                    }
                >
                    <LogOut size={17} />
                    <span>Sign Out</span>
                </button>
            </div>

            {/* Profile */}
            <div
                style={{
                    margin: "8px 12px 0",
                    padding: "12px",
                    borderRadius: 12,
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.06)",
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
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
                        fontSize: 13,
                        fontWeight: 700,
                        color: "#0a0a0a",
                        flexShrink: 0,
                    }}
                >
                    {getInitials(profile.full_name)}
                </div>
                <div style={{ overflow: "hidden", flex: 1, whiteSpace: "nowrap" }}>
                    <div
                        style={{
                            fontSize: 13,
                            fontWeight: 600,
                            color: "#fff",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                        }}
                    >
                        {profile.full_name || "User"}
                    </div>
                    <div
                        style={{
                            fontSize: 11,
                            color: "rgba(255,255,255,0.35)",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                        }}
                    >
                        {profile.email}
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg-primary)" }}>
            {/* Desktop sidebar */}
            <div
                className="sidebar"
                style={{
                    width: desktopSidebarOpen ? 240 : 0,
                    background: "#0f0f0f",
                    display: "none", // Overridden by CSS media query
                    borderRight: desktopSidebarOpen ? "1px solid rgba(255,255,255,0.06)" : "none",
                    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                    overflow: "hidden",
                }}
                id="desktop-sidebar"
            >
                <SidebarContent onClose={() => setDesktopSidebarOpen(false)} />
            </div>

            {/* Mobile sidebar overlay */}
            <AnimatePresence>
                {sidebarOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSidebarOpen(false)}
                            style={{
                                position: "fixed",
                                inset: 0,
                                background: "rgba(0,0,0,0.7)",
                                zIndex: 48,
                            }}
                        />
                        <motion.div
                            initial={{ x: -240 }}
                            animate={{ x: 0 }}
                            exit={{ x: -240 }}
                            transition={{ type: "spring", damping: 30, stiffness: 300 }}
                            className="sidebar"
                            style={{
                                width: 240,
                                background: "#0f0f0f",
                                zIndex: 49,
                                borderRight: "1px solid rgba(255,255,255,0.06)",
                            }}
                        >
                            <SidebarContent onClose={() => setSidebarOpen(false)} />
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Main content */}
            <div id="main-content" style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, transition: "margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)" }}>
                {/* Top bar */}
                <header
                    className="glass"
                    style={{
                        padding: "14px 20px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        borderBottom: "1px solid var(--border)",
                        position: "sticky",
                        top: 0,
                        zIndex: 40,
                    }}
                >
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <button
                            title="Toggle menu"
                            onClick={() => {
                                if (window.innerWidth < 768) {
                                    setSidebarOpen(true);
                                } else {
                                    setDesktopSidebarOpen(!desktopSidebarOpen);
                                }
                            }}
                            style={{
                                background: "var(--bg-secondary)",
                                border: "1px solid var(--border)",
                                borderRadius: 8,
                                padding: "7px",
                                cursor: "pointer",
                                color: "var(--text-secondary)",
                                display: "flex",
                            }}
                        >
                            <Menu size={17} />
                        </button>
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 8,
                            }}
                        >
                            <div
                                style={{
                                    width: 28,
                                    height: 28,
                                    borderRadius: 8,
                                    background: "linear-gradient(135deg, #c9a84c, #a07830)",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                }}
                            >
                                <BookOpen size={14} color="#0a0a0a" />
                            </div>
                            <span
                                style={{
                                    fontFamily: "Poppins",
                                    fontWeight: 700,
                                    fontSize: 16,
                                    color: "var(--text-primary)",
                                }}
                            >
                                Luxaar
                            </span>
                        </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <button
                            onClick={toggleTheme}
                            style={{
                                background: "var(--bg-secondary)",
                                border: "1px solid var(--border)",
                                borderRadius: 8,
                                padding: "7px",
                                cursor: "pointer",
                                color: "var(--text-secondary)",
                                display: "flex",
                            }}
                        >
                            {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
                        </button>
                        <div ref={notifRef} style={{ position: "relative" }}>
                            <button
                                onClick={() => setShowNotifications(!showNotifications)}
                                style={{
                                    background: showNotifications ? "rgba(201,168,76,0.1)" : "var(--bg-secondary)",
                                    border: `1px solid ${showNotifications ? "rgba(201,168,76,0.3)" : "var(--border)"}`,
                                    borderRadius: 8,
                                    padding: "7px",
                                    cursor: "pointer",
                                    color: showNotifications ? "#c9a84c" : "var(--text-secondary)",
                                    display: "flex",
                                    position: "relative",
                                }}
                            >
                                <Bell size={16} />
                                {unreadCount > 0 && (
                                    <span
                                        style={{
                                            position: "absolute",
                                            top: -4,
                                            right: -4,
                                            width: 18,
                                            height: 18,
                                            borderRadius: "50%",
                                            background: "#ef4444",
                                            color: "#fff",
                                            fontSize: 10,
                                            fontWeight: 700,
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            animation: "pulse-gold 2s infinite",
                                        }}
                                    >
                                        {unreadCount > 9 ? "9+" : unreadCount}
                                    </span>
                                )}
                            </button>

                            {/* Notification dropdown */}
                            <AnimatePresence>
                                {showNotifications && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 8, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 8, scale: 0.95 }}
                                        transition={{ duration: 0.2 }}
                                        style={{
                                            position: "absolute",
                                            top: "calc(100% + 8px)",
                                            right: 0,
                                            width: 360,
                                            maxHeight: 440,
                                            background: "var(--bg-card)",
                                            border: "1px solid var(--border)",
                                            borderRadius: 14,
                                            boxShadow: "0 12px 40px rgba(0,0,0,0.15)",
                                            overflow: "hidden",
                                            zIndex: 1000,
                                        }}
                                    >
                                        {/* Header */}
                                        <div
                                            style={{
                                                padding: "14px 16px",
                                                borderBottom: "1px solid var(--border)",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "space-between",
                                            }}
                                        >
                                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                                <Sparkles size={14} color="#c9a84c" />
                                                <span style={{ fontWeight: 600, fontSize: 14, color: "var(--text-primary)" }}>
                                                    Notifications
                                                </span>
                                                {unreadCount > 0 && (
                                                    <span
                                                        style={{
                                                            background: "rgba(239,68,68,0.1)",
                                                            color: "#ef4444",
                                                            fontSize: 11,
                                                            fontWeight: 600,
                                                            padding: "1px 8px",
                                                            borderRadius: 999,
                                                        }}
                                                    >
                                                        {unreadCount} new
                                                    </span>
                                                )}
                                            </div>
                                            {unreadCount > 0 && (
                                                <button
                                                    onClick={markAllAsRead}
                                                    style={{
                                                        background: "none",
                                                        border: "none",
                                                        color: "#c9a84c",
                                                        fontSize: 12,
                                                        fontWeight: 500,
                                                        cursor: "pointer",
                                                    }}
                                                >
                                                    Mark all read
                                                </button>
                                            )}
                                        </div>

                                        {/* Notification list */}
                                        <div style={{ maxHeight: 380, overflowY: "auto" }}>
                                            {notifications.length === 0 ? (
                                                <div
                                                    style={{
                                                        padding: 40,
                                                        textAlign: "center",
                                                        color: "var(--text-muted)",
                                                    }}
                                                >
                                                    <Bell size={28} style={{ marginBottom: 8, opacity: 0.4 }} />
                                                    <p style={{ fontSize: 13 }}>No notifications yet</p>
                                                </div>
                                            ) : (
                                                notifications.slice(0, 20).map((notif) => (
                                                    <div
                                                        key={notif.id}
                                                        onClick={() => {
                                                            if (!notif.is_read) markAsRead(notif.id);
                                                            if (notif.course_id) {
                                                                router.push(`/dashboard/courses/learn?id=${notif.course_id}`);
                                                                setShowNotifications(false);
                                                            }
                                                        }}
                                                        style={{
                                                            padding: "12px 16px",
                                                            borderBottom: "1px solid var(--border)",
                                                            cursor: notif.course_id ? "pointer" : "default",
                                                            background: notif.is_read
                                                                ? "transparent"
                                                                : "rgba(201,168,76,0.04)",
                                                            transition: "background 0.2s ease",
                                                        }}
                                                        className="interactive-row"
                                                    >
                                                        <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                                                            <div
                                                                style={{
                                                                    width: 32,
                                                                    height: 32,
                                                                    borderRadius: 8,
                                                                    background: notif.is_read
                                                                        ? "var(--bg-secondary)"
                                                                        : "rgba(201,168,76,0.12)",
                                                                    display: "flex",
                                                                    alignItems: "center",
                                                                    justifyContent: "center",
                                                                    flexShrink: 0,
                                                                    marginTop: 2,
                                                                }}
                                                            >
                                                                {notif.type === "enrollment_approved" ? (
                                                                    <CheckCircle size={14} color={notif.is_read ? "var(--text-muted)" : "#4ade80"} />
                                                                ) : notif.type === "new_lesson" ? (
                                                                    <PlayCircle size={14} color={notif.is_read ? "var(--text-muted)" : "#c9a84c"} />
                                                                ) : (
                                                                    <Sparkles size={14} color={notif.is_read ? "var(--text-muted)" : "#c9a84c"} />
                                                                )}
                                                            </div>
                                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                                <div
                                                                    style={{
                                                                        fontSize: 13,
                                                                        fontWeight: notif.is_read ? 400 : 600,
                                                                        color: "var(--text-primary)",
                                                                        marginBottom: 2,
                                                                    }}
                                                                >
                                                                    {notif.title}
                                                                </div>
                                                                <div
                                                                    style={{
                                                                        fontSize: 12,
                                                                        color: "var(--text-muted)",
                                                                        lineHeight: 1.4,
                                                                    }}
                                                                >
                                                                    {notif.message}
                                                                </div>
                                                                <div
                                                                    style={{
                                                                        fontSize: 11,
                                                                        color: "var(--text-muted)",
                                                                        marginTop: 4,
                                                                    }}
                                                                >
                                                                    {new Date(notif.created_at).toLocaleDateString("en-US", {
                                                                        month: "short",
                                                                        day: "numeric",
                                                                        hour: "2-digit",
                                                                        minute: "2-digit",
                                                                    })}
                                                                </div>
                                                            </div>
                                                            {!notif.is_read && (
                                                                <div
                                                                    style={{
                                                                        width: 8,
                                                                        height: 8,
                                                                        borderRadius: "50%",
                                                                        background: "#c9a84c",
                                                                        flexShrink: 0,
                                                                        marginTop: 6,
                                                                    }}
                                                                />
                                                            )}
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                        <div
                            style={{
                                width: 32,
                                height: 32,
                                borderRadius: 999,
                                background: "linear-gradient(135deg, #c9a84c, #a07830)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: 12,
                                fontWeight: 700,
                                color: "#0a0a0a",
                            }}
                        >
                            {getInitials(profile.full_name)}
                        </div>
                    </div>
                </header>

                {/* Page content */}
                <main style={{ flex: 1, overflow: "auto", padding: "28px 20px" }}>
                    <div style={{ maxWidth: 1200, margin: "0 auto", width: "100%" }}>
                        {children}
                    </div>
                </main>
            </div>

            {/* Show desktop sidebar via CSS */}
            <style>{`
        @media (min-width: 768px) {
          #desktop-sidebar {
            display: flex !important;
          }
          #main-content {
            margin-left: ${desktopSidebarOpen ? 240 : 0}px;
          }
        }
      `}</style>
        </div>
    );
}
