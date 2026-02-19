"use client";

import { motion } from "framer-motion";
import type { Course } from "@/types";
import { CourseCard } from "@/components/courses/CourseCard";
import Link from "next/link";
import { BookOpen, ArrowRight } from "lucide-react";

interface MyCourseClientProps {
    enrollments: Array<{
        id: string;
        enrolled_at: string;
        completed_at: string | null;
        progress_percentage: number;
        course: Course;
    }>;
}

export default function MyCourseClient({ enrollments }: MyCourseClientProps) {
    const completed = enrollments.filter((e) => e.completed_at);
    const inProgress = enrollments.filter((e) => !e.completed_at && e.progress_percentage > 0);
    const notStarted = enrollments.filter((e) => e.progress_percentage === 0);

    return (
        <div style={{ maxWidth: 1100 }}>
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
                    My Learning
                </h1>
                <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>
                    {enrollments.length} enrolled course{enrollments.length !== 1 ? "s" : ""}
                </p>
            </motion.div>

            {enrollments.length === 0 ? (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="card"
                    style={{ padding: "60px 40px", textAlign: "center" }}
                >
                    <BookOpen size={48} color="var(--text-muted)" style={{ marginBottom: 16 }} />
                    <h3 style={{ fontSize: 18, fontWeight: 600, color: "var(--text-primary)", marginBottom: 8 }}>
                        No courses yet
                    </h3>
                    <p style={{ color: "var(--text-muted)", fontSize: 14, marginBottom: 24 }}>
                        Enroll in a course to start learning.
                    </p>
                    <Link href="/dashboard/courses">
                        <button className="btn-primary">
                            Browse Courses <ArrowRight size={15} />
                        </button>
                    </Link>
                </motion.div>
            ) : (
                <>
                    {inProgress.length > 0 && (
                        <section style={{ marginBottom: 36 }}>
                            <h2 style={{ fontSize: 16, fontWeight: 600, color: "var(--text-primary)", marginBottom: 16 }}>
                                In Progress
                            </h2>
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
                                {inProgress.map((e, i) => (
                                    <motion.div
                                        key={e.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.06 }}
                                    >
                                        <CourseCard
                                            course={e.course}
                                            progress={e.progress_percentage}
                                            isEnrolled
                                        />
                                    </motion.div>
                                ))}
                            </div>
                        </section>
                    )}

                    {notStarted.length > 0 && (
                        <section style={{ marginBottom: 36 }}>
                            <h2 style={{ fontSize: 16, fontWeight: 600, color: "var(--text-primary)", marginBottom: 16 }}>
                                Not Started
                            </h2>
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
                                {notStarted.map((e, i) => (
                                    <motion.div
                                        key={e.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.06 }}
                                    >
                                        <CourseCard
                                            course={e.course}
                                            progress={0}
                                            isEnrolled
                                        />
                                    </motion.div>
                                ))}
                            </div>
                        </section>
                    )}

                    {completed.length > 0 && (
                        <section>
                            <h2 style={{ fontSize: 16, fontWeight: 600, color: "var(--text-primary)", marginBottom: 16 }}>
                                Completed ✅
                            </h2>
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
                                {completed.map((e, i) => (
                                    <motion.div
                                        key={e.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.06 }}
                                    >
                                        <CourseCard
                                            course={e.course}
                                            progress={100}
                                            isEnrolled
                                        />
                                    </motion.div>
                                ))}
                            </div>
                        </section>
                    )}
                </>
            )}
        </div>
    );
}
