"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import type { Course } from "@/types";
import { CourseCard } from "@/components/courses/CourseCard";
import { Search, Filter } from "lucide-react";

interface CoursesPageClientProps {
    courses: Course[];
    enrolledIds: string[];
}

const DIFFICULTIES = ["all", "beginner", "intermediate", "advanced"];

export default function CoursesPageClient({
    courses,
    enrolledIds,
}: CoursesPageClientProps) {
    const [search, setSearch] = useState("");
    const [difficulty, setDifficulty] = useState("all");

    const filtered = useMemo(() => {
        return courses.filter((c) => {
            const matchSearch =
                c.title.toLowerCase().includes(search.toLowerCase()) ||
                c.description.toLowerCase().includes(search.toLowerCase()) ||
                c.instructor_name.toLowerCase().includes(search.toLowerCase()) ||
                c.tags?.some((t) => t.toLowerCase().includes(search.toLowerCase()));
            const matchDiff =
                difficulty === "all" || c.difficulty === difficulty;
            return matchSearch && matchDiff;
        });
    }, [courses, search, difficulty]);

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
                        marginBottom: 4,
                    }}
                >
                    All Courses
                </h1>
                <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>
                    {courses.length} course{courses.length !== 1 ? "s" : ""} available
                </p>
            </motion.div>

            {/* Filters */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                style={{
                    display: "flex",
                    gap: 12,
                    marginBottom: 24,
                    flexWrap: "wrap",
                    alignItems: "center",
                }}
            >
                {/* Search */}
                <div style={{ position: "relative", flex: "1 1 260px", maxWidth: 400 }}>
                    <Search
                        size={15}
                        style={{
                            position: "absolute",
                            left: 12,
                            top: "50%",
                            transform: "translateY(-50%)",
                            color: "var(--text-muted)",
                        }}
                    />
                    <input
                        className="input"
                        type="text"
                        placeholder="Search courses..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        style={{ paddingLeft: 36 }}
                    />
                </div>

                {/* Difficulty filter */}
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <Filter size={14} color="var(--text-muted)" />
                    {DIFFICULTIES.map((d) => (
                        <button
                            key={d}
                            onClick={() => setDifficulty(d)}
                            style={{
                                padding: "7px 14px",
                                borderRadius: 8,
                                border: "1px solid",
                                borderColor:
                                    difficulty === d
                                        ? "rgba(201,168,76,0.5)"
                                        : "var(--border)",
                                background:
                                    difficulty === d
                                        ? "rgba(201,168,76,0.1)"
                                        : "transparent",
                                color:
                                    difficulty === d ? "#c9a84c" : "var(--text-secondary)",
                                fontSize: 13,
                                fontWeight: difficulty === d ? 600 : 400,
                                cursor: "pointer",
                                transition: "all 0.2s",
                                textTransform: "capitalize",
                            }}
                        >
                            {d}
                        </button>
                    ))}
                </div>
            </motion.div>

            {/* Grid */}
            {filtered.length > 0 ? (
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                        gap: 16,
                    }}
                >
                    {filtered.map((course, i) => (
                        <motion.div
                            key={course.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.04 }}
                        >
                            <CourseCard
                                course={course}
                                isEnrolled={enrolledIds.includes(course.id)}
                            />
                        </motion.div>
                    ))}
                </div>
            ) : (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    style={{ textAlign: "center", padding: "60px 0" }}
                >
                    <p style={{ color: "var(--text-muted)", fontSize: 15 }}>
                        No courses found matching your search.
                    </p>
                    <button
                        className="btn-secondary"
                        onClick={() => { setSearch(""); setDifficulty("all"); }}
                        style={{ marginTop: 16 }}
                    >
                        Clear filters
                    </button>
                </motion.div>
            )}
        </div>
    );
}
