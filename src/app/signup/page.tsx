"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import toast from "react-hot-toast";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase/client";
import {
    BookOpen,
    Mail,
    Lock,
    User,
    Eye,
    EyeOff,
    CheckCircle,
    Clock,
} from "lucide-react";

export default function SignupPage() {
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPass, setShowPass] = useState(false);
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    async function handleSignup(e: React.FormEvent) {
        e.preventDefault();
        if (password.length < 8) {
            toast.error("Password must be at least 8 characters");
            return;
        }
        setLoading(true);

        try {
            const { user } = await createUserWithEmailAndPassword(auth, email, password);
            await updateProfile(user, { displayName: fullName });

            const ADMIN_EMAILS = ["abubackerraiyan@gmail.com", "dhl.abu@gmail.com"];
            const isAdmin = ADMIN_EMAILS.includes(email);

            await setDoc(doc(db, "users", user.uid), {
                id: user.uid,
                email,
                full_name: fullName,
                role: isAdmin ? "admin" : "student",
                status: isAdmin ? "approved" : "pending",
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            });

            setSubmitted(true);
        } catch (error: any) {
            console.error(error);
            toast.error(error.message || "Failed to sign up");
        } finally {
            setLoading(false);
        }
    }

    if (submitted) {
        // If admin, show approved message
        const ADMIN_EMAILS = ["abubackerraiyan@gmail.com", "dhl.abu@gmail.com"];
        const isAdmin = ADMIN_EMAILS.includes(email);

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
                    className="card"
                    style={{ maxWidth: 440, width: "100%", padding: "48px 36px", textAlign: "center" }}
                >
                    <div
                        style={{
                            width: 64,
                            height: 64,
                            borderRadius: "50%",
                            background: "rgba(201,168,76,0.1)",
                            border: "1px solid rgba(201,168,76,0.3)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            margin: "0 auto 24px",
                        }}
                    >
                        {isAdmin ? <CheckCircle size={28} color="#c9a84c" /> : <Clock size={28} color="#c9a84c" />}
                    </div>
                    <h2
                        style={{
                            fontFamily: "Poppins, sans-serif",
                            fontWeight: 700,
                            fontSize: 22,
                            marginBottom: 12,
                            color: "var(--text-primary)",
                        }}
                    >
                        {isAdmin ? "Account Approved!" : "Request Submitted!"}
                    </h2>
                    <p style={{ color: "var(--text-secondary)", lineHeight: 1.7, marginBottom: 24 }}>
                        {isAdmin ? (
                            <>
                                Your admin account has been created and <strong style={{ color: "var(--gold)" }}>approved</strong>.
                                You can now access the admin dashboard.
                            </>
                        ) : (
                            <>
                                Your account has been created and your access request is{" "}
                                <strong style={{ color: "var(--gold)" }}>pending admin approval</strong>. You&apos;ll
                                receive an email once your account is approved.
                            </>
                        )}
                    </p>
                    <div
                        style={{
                            padding: "16px",
                            borderRadius: 10,
                            background: "rgba(201,168,76,0.05)",
                            border: "1px solid rgba(201,168,76,0.15)",
                            marginBottom: 24,
                        }}
                    >
                        {[
                            "Check your email for a confirmation link",
                            "Wait for admin approval (usually within 24h)",
                            "Log in once approved to access your courses",
                        ].map((step, i) => (
                            <div
                                key={step}
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 10,
                                    padding: "8px 0",
                                    borderBottom: i < 2 ? "1px solid var(--border)" : "none",
                                }}
                            >
                                <CheckCircle size={14} color="#c9a84c" />
                                <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>{step}</span>
                            </div>
                        ))}
                    </div>
                    <Link href="/login">
                        <button className="btn-secondary" style={{ width: "100%", justifyContent: "center" }}>
                            Go to Sign In
                        </button>
                    </Link>
                </motion.div>
            </div>
        );
    }

    return (
        <div
            style={{
                minHeight: "100vh",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "24px",
                background: "var(--bg-primary)",
                position: "relative",
                overflow: "hidden",
            }}
        >
            <div
                style={{
                    position: "absolute",
                    top: "-20%",
                    right: "-10%",
                    width: 600,
                    height: 600,
                    borderRadius: "50%",
                    background: "radial-gradient(circle, rgba(201,168,76,0.05) 0%, transparent 70%)",
                    pointerEvents: "none",
                }}
            />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ width: "100%", maxWidth: 420 }}
            >
                <div style={{ textAlign: "center", marginBottom: 40 }}>
                    <Link href="/" style={{ textDecoration: "none" }}>
                        <div
                            style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 10,
                                marginBottom: 8,
                            }}
                        >
                            <div
                                style={{
                                    width: 44,
                                    height: 44,
                                    borderRadius: 12,
                                    background: "linear-gradient(135deg, #c9a84c, #a07830)",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                }}
                            >
                                <BookOpen size={22} color="#0a0a0a" />
                            </div>
                            <span
                                style={{
                                    fontFamily: "Poppins, sans-serif",
                                    fontWeight: 800,
                                    fontSize: 24,
                                    letterSpacing: "-0.02em",
                                    color: "var(--text-primary)",
                                }}
                            >
                                Luxaar
                            </span>
                        </div>
                    </Link>
                    <p style={{ color: "var(--text-muted)", fontSize: 14 }}>
                        Request access to the platform
                    </p>
                </div>

                <div className="card" style={{ padding: "36px 32px" }}>
                    <div
                        style={{
                            padding: "12px 14px",
                            borderRadius: 10,
                            background: "rgba(201,168,76,0.06)",
                            border: "1px solid rgba(201,168,76,0.2)",
                            marginBottom: 20,
                            display: "flex",
                            gap: 10,
                            alignItems: "flex-start",
                        }}
                    >
                        <Clock size={15} color="#c9a84c" style={{ marginTop: 2 }} />
                        <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6 }}>
                            Luxaar is invite-only. After registration, an admin will review
                            and approve your account before you can access content.
                        </p>
                    </div>

                    <form onSubmit={handleSignup} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                        <div>
                            <label className="label">Full Name</label>
                            <div style={{ position: "relative" }}>
                                <User size={15} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                                <input
                                    className="input"
                                    type="text"
                                    placeholder="Your full name"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    style={{ paddingLeft: 36 }}
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="label">Email address</label>
                            <div style={{ position: "relative" }}>
                                <Mail size={15} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                                <input
                                    className="input"
                                    type="email"
                                    placeholder="you@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    style={{ paddingLeft: 36 }}
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="label">Password</label>
                            <div style={{ position: "relative" }}>
                                <Lock size={15} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                                <input
                                    className="input"
                                    type={showPass ? "text" : "password"}
                                    placeholder="At least 8 characters"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    style={{ paddingLeft: 36, paddingRight: 40 }}
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPass(!showPass)}
                                    style={{
                                        position: "absolute",
                                        right: 12,
                                        top: "50%",
                                        transform: "translateY(-50%)",
                                        background: "none",
                                        border: "none",
                                        cursor: "pointer",
                                        color: "var(--text-muted)",
                                        display: "flex",
                                    }}
                                >
                                    {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="btn-primary"
                            disabled={loading}
                            style={{ justifyContent: "center", width: "100%", padding: "13px" }}
                        >
                            {loading ? "Submitting request..." : "Request Access"}
                        </button>
                    </form>

                    <p style={{ textAlign: "center", marginTop: 20, fontSize: 13, color: "var(--text-muted)" }}>
                        Already have an account?{" "}
                        <Link href="/login" style={{ color: "var(--gold)", textDecoration: "none", fontWeight: 500 }}>
                            Sign in
                        </Link>
                    </p>
                </div>
            </motion.div>
        </div>
    );
}
