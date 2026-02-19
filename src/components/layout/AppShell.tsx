"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { useAuth } from "@/lib/contexts/AuthContext";
import { useTheme } from "@/components/providers/ThemeProvider";
import { getInitials } from "@/lib/utils";
import type { Profile } from "@/types";
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
    { href: "/dashboard/admin/analytics", icon: BarChart3, label: "Analytics" },
];

export default function AppShell({ children, profile }: AppShellProps) {
    const pathname = usePathname();
    const router = useRouter();
    const { signOut } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [desktopSidebarOpen, setDesktopSidebarOpen] = useState(true);

    const navItems = profile.role === "admin" ? adminNav : studentNav;

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
                        <button
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
                            <Bell size={16} />
                        </button>
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
