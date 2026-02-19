"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import type { Profile, Course } from "@/types";
import { CourseCard } from "@/components/courses/CourseCard";
import { BookOpen, Play, Award, Clock, ArrowRight } from "lucide-react";

interface StudentDashboardProps {
    profile: Profile;
    enrollments: Array<{ course: Course; progress_percentage: number; enrolled_at: string; completed_at: string | null }>;
    featuredCourses: Course[];
}

export default function StudentDashboard({
    profile,
    enrollments,
    featuredCourses,
}: StudentDashboardProps) {
    const completedCount = enrollments.filter((e) => e.completed_at).length;
    const inProgressCount = enrollments.filter((e) => !e.completed_at && e.progress_percentage > 0).length;

    // Find "continue watching" course
    const continueWatching = enrollments
        .filter((e) => !e.completed_at && e.progress_percentage > 0)
        .sort((a, b) => new Date(b.enrolled_at).getTime() - new Date(a.enrolled_at).getTime())[0];

    return (
        <div style={{ maxWidth: 1200 }}>
            {/* Welcome */}
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
                    Welcome back, {profile.full_name?.split(" ")[0] ?? "Learner"} 👋
                </h1>
                <p style={{ color: "var(--text-secondary)", fontSize: 14, marginTop: 4 }}>
                    Continue your learning journey.
                </p>
            </motion.div>

            {/* Stats */}
            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
                    gap: 14,
                    marginBottom: 28,
                }}
            >
                {[
                    { label: "Enrolled", value: enrollments.length, icon: BookOpen, color: "#c9a84c" },
                    { label: "In Progress", value: inProgressCount, icon: Clock, color: "#a78bfa" },
                    { label: "Completed", value: completedCount, icon: Award, color: "#34d399" },
                ].map((s, i) => (
                    <motion.div
                        key={s.label}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.08 }}
                        className="card"
                        style={{ padding: "18px" }}
                    >
                        <div
                            style={{
                                width: 36,
                                height: 36,
                                borderRadius: 10,
                                background: `${s.color}14`,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                marginBottom: 12,
                            }}
                        >
                            <s.icon size={17} color={s.color} />
                        </div>
                        <div style={{ fontSize: 26, fontWeight: 800, fontFamily: "Poppins", color: "var(--text-primary)" }}>
                            {s.value}
                        </div>
                        <div style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 2 }}>
                            {s.label}
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Continue watching */}
            {continueWatching && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 }}
                    style={{ marginBottom: 28 }}
                >
                    <h2 style={{ fontSize: 16, fontWeight: 600, color: "var(--text-primary)", marginBottom: 14 }}>
                        Continue Watching
                    </h2>
                    <Link href={`/dashboard/courses/${continueWatching.course.id}/learn`} style={{ textDecoration: "none" }}>
                        <div
                            className="card"
                            style={{
                                padding: "20px",
                                display: "flex",
                                alignItems: "center",
                                gap: 16,
                                background: "linear-gradient(135deg, rgba(201,168,76,0.05) 0%, transparent 100%)",
                                border: "1px solid rgba(201,168,76,0.15)",
                                cursor: "pointer",
                            }}
                        >
                            <div
                                style={{
                                    width: 56,
                                    height: 56,
                                    borderRadius: 14,
                                    background: "rgba(201,168,76,0.15)",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    flexShrink: 0,
                                }}
                            >
                                <Play size={24} color="#c9a84c" />
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)", marginBottom: 4 }}>
                                    {continueWatching.course.title}
                                </div>
                                <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 10 }}>
                                    {continueWatching.course.instructor_name}
                                </div>
                                <div>
                                    <div
                                        style={{
                                            display: "flex",
                                            justifyContent: "space-between",
                                            fontSize: 12,
                                            color: "var(--text-muted)",
                                            marginBottom: 6,
                                        }}
                                    >
                                        <span>Progress</span>
                                        <span style={{ color: "#c9a84c", fontWeight: 600 }}>
                                            {continueWatching.progress_percentage}%
                                        </span>
                                    </div>
                                    <div className="progress-bar">
                                        <div
                                            className="progress-fill"
                                            style={{ width: `${continueWatching.progress_percentage}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                            <ArrowRight size={18} color="#c9a84c" />
                        </div>
                    </Link>
                </motion.div>
            )}

            {/* My courses */}
            {enrollments.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    style={{ marginBottom: 36 }}
                >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                        <h2 style={{ fontSize: 16, fontWeight: 600, color: "var(--text-primary)" }}>
                            My Courses
                        </h2>
                        <Link href="/dashboard/my-courses" style={{ textDecoration: "none" }}>
                            <span style={{ fontSize: 13, color: "#c9a84c", fontWeight: 500, display: "flex", alignItems: "center", gap: 4 }}>
                                View all <ArrowRight size={13} />
                            </span>
                        </Link>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
                        {enrollments.slice(0, 3).map((e, i) => (
                            <motion.div
                                key={e.course.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 + i * 0.08 }}
                            >
                                <CourseCard
                                    course={e.course}
                                    progress={e.progress_percentage}
                                    isEnrolled
                                />
                            </motion.div>
                        ))}
                    </div>
                </motion.div>
            )}

            {/* Explore courses */}
            {featuredCourses.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                        <h2 style={{ fontSize: 16, fontWeight: 600, color: "var(--text-primary)" }}>
                            {enrollments.length === 0 ? "Explore Courses" : "Discover More"}
                        </h2>
                        <Link href="/dashboard/courses" style={{ textDecoration: "none" }}>
                            <span style={{ fontSize: 13, color: "#c9a84c", fontWeight: 500, display: "flex", alignItems: "center", gap: 4 }}>
                                Browse all <ArrowRight size={13} />
                            </span>
                        </Link>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
                        {featuredCourses.slice(0, 6).map((course, i) => (
                            <motion.div
                                key={course.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4 + i * 0.06 }}
                            >
                                <CourseCard course={course} />
                            </motion.div>
                        ))}
                    </div>
                </motion.div>
            )}

            {enrollments.length === 0 && featuredCourses.length === 0 && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="card"
                    style={{ padding: 48, textAlign: "center" }}
                >
                    <BookOpen size={48} color="var(--text-muted)" style={{ marginBottom: 16 }} />
                    <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8, color: "var(--text-primary)" }}>
                        No courses available yet
                    </h3>
                    <p style={{ color: "var(--text-muted)", fontSize: 14 }}>
                        Check back soon — new content is being added regularly.
                    </p>
                </motion.div>
            )}
        </div>
    );
}
