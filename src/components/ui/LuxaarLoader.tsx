"use client";

import { motion } from "framer-motion";

interface LuxaarLoaderProps {
    text?: string;
    fullScreen?: boolean;
    size?: "sm" | "md" | "lg";
}

export default function LuxaarLoader({
    text = "Loading...",
    fullScreen = false,
    size = "md",
}: LuxaarLoaderProps) {
    const dim = size === "sm" ? 32 : size === "md" ? 48 : 64;
    const orbDim = size === "sm" ? 6 : size === "md" ? 8 : 10;

    const container = fullScreen
        ? {
            position: "fixed" as const,
            inset: 0,
            zIndex: 9999,
            background: "var(--bg-primary)",
        }
        : {
            minHeight: 400,
        };

    return (
        <div
            className="luxaar-loader-wrap"
            style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 24,
                ...container,
            }}
        >
            {/* Animated rings */}
            <div style={{ position: "relative", width: dim * 2, height: dim * 2 }}>
                {/* Outer ring */}
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                    style={{
                        position: "absolute",
                        inset: 0,
                        borderRadius: "50%",
                        border: `2px solid transparent`,
                        borderTopColor: "#c9a84c",
                        borderRightColor: "rgba(201,168,76,0.3)",
                    }}
                />
                {/* Middle ring */}
                <motion.div
                    animate={{ rotate: -360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    style={{
                        position: "absolute",
                        inset: dim * 0.2,
                        borderRadius: "50%",
                        border: `2px solid transparent`,
                        borderTopColor: "#e8c56a",
                        borderLeftColor: "rgba(232,197,106,0.3)",
                    }}
                />
                {/* Inner ring */}
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                    style={{
                        position: "absolute",
                        inset: dim * 0.4,
                        borderRadius: "50%",
                        border: `2px solid transparent`,
                        borderBottomColor: "#a07830",
                        borderRightColor: "rgba(160,120,48,0.3)",
                    }}
                />
                {/* Center dot */}
                <motion.div
                    animate={{
                        scale: [1, 1.4, 1],
                        opacity: [0.6, 1, 0.6],
                    }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                    style={{
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        transform: "translate(-50%, -50%)",
                        width: orbDim * 2,
                        height: orbDim * 2,
                        borderRadius: "50%",
                        background: "linear-gradient(135deg, #c9a84c, #e8c56a)",
                        boxShadow: "0 0 20px rgba(201,168,76,0.4)",
                    }}
                />
                {/* Orbiting particles */}
                {[0, 1, 2].map((i) => (
                    <motion.div
                        key={i}
                        animate={{ rotate: 360 }}
                        transition={{
                            duration: 2 + i * 0.5,
                            repeat: Infinity,
                            ease: "linear",
                            delay: i * 0.3,
                        }}
                        style={{
                            position: "absolute",
                            inset: 0,
                        }}
                    >
                        <motion.div
                            animate={{
                                opacity: [0.3, 1, 0.3],
                            }}
                            transition={{
                                duration: 1,
                                repeat: Infinity,
                                ease: "easeInOut",
                                delay: i * 0.2,
                            }}
                            style={{
                                position: "absolute",
                                top: 0,
                                left: "50%",
                                transform: "translateX(-50%)",
                                width: orbDim,
                                height: orbDim,
                                borderRadius: "50%",
                                background: "#c9a84c",
                                boxShadow: "0 0 8px rgba(201,168,76,0.6)",
                            }}
                        />
                    </motion.div>
                ))}
            </div>

            {/* Animated text */}
            <div style={{ textAlign: "center" }}>
                <motion.p
                    animate={{
                        opacity: [0.4, 1, 0.4],
                    }}
                    transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut",
                    }}
                    style={{
                        color: "var(--text-muted)",
                        fontSize: size === "sm" ? 12 : 14,
                        fontWeight: 500,
                        letterSpacing: "0.05em",
                    }}
                >
                    {text}
                </motion.p>
            </div>
        </div>
    );
}
