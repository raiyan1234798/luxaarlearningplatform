"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { XCircle, BookOpen, LogOut } from "lucide-react";
import { useAuth } from "@/lib/contexts/AuthContext";
import { useRouter } from "next/navigation";

export default function RejectedPage() {
    const router = useRouter();
    const { signOut } = useAuth();

    async function handleSignOut() {
        await signOut();
        router.push("/login"); // or relying on context
    }

    return (
        <div
            style={{
                minHeight: "100vh",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: 24,
                background: "var(--bg-primary)",
            }}
        >
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                style={{ maxWidth: 480, width: "100%", textAlign: "center" }}
            >
                <Link href="/" style={{ textDecoration: "none" }}>
                    <div style={{ display: "inline-flex", alignItems: "center", gap: 10, marginBottom: 40 }}>
                        <div style={{ width: 40, height: 40, borderRadius: 11, background: "linear-gradient(135deg, #c9a84c, #a07830)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <BookOpen size={20} color="#0a0a0a" />
                        </div>
                        <span style={{ fontFamily: "Poppins, sans-serif", fontWeight: 800, fontSize: 22, color: "var(--text-primary)" }}>
                            Luxaar
                        </span>
                    </div>
                </Link>

                <div className="card" style={{ padding: "48px 36px" }}>
                    <div
                        style={{
                            width: 72,
                            height: 72,
                            borderRadius: "50%",
                            background: "rgba(248,113,113,0.1)",
                            border: "2px solid rgba(248,113,113,0.3)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            margin: "0 auto 24px",
                        }}
                    >
                        <XCircle size={32} color="#f87171" />
                    </div>

                    <h2 style={{ fontFamily: "Poppins, sans-serif", fontWeight: 700, fontSize: 22, color: "var(--text-primary)", marginBottom: 12 }}>
                        Access Denied
                    </h2>

                    <p style={{ color: "var(--text-secondary)", lineHeight: 1.7, marginBottom: 28 }}>
                        Your access request has been declined. Please contact us if you
                        believe this is an error.
                    </p>

                    <button
                        onClick={handleSignOut}
                        className="btn-secondary"
                        style={{ width: "100%", justifyContent: "center" }}
                    >
                        <LogOut size={15} />
                        Sign Out
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
