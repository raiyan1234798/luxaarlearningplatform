"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import toast from "react-hot-toast";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import type { Course } from "@/types";
import {
    Search,
    Plus,
    Edit,
    Trash2,
    Eye,
    EyeOff,
    MoreVertical,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

interface AdminCoursesClientProps {
    courses: Course[];
}

export default function AdminCoursesClient({ courses: initialCourses }: AdminCoursesClientProps) {
    const [courses, setCourses] = useState<Course[]>(initialCourses);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState<string | null>(null);

    const filtered = courses.filter((c) =>
        c.title.toLowerCase().includes(search.toLowerCase())
    );

    async function togglePublish(courseId: string, currentStatus: boolean) {
        setLoading(courseId);
        try {
            await updateDoc(doc(db, "courses", courseId), {
                is_published: !currentStatus,
                updated_at: new Date().toISOString(),
            });
            toast.success(currentStatus ? "Course unpublished" : "Course published");
            setCourses((prev) =>
                prev.map((c) =>
                    c.id === courseId ? { ...c, is_published: !currentStatus } : c
                )
            );
        } catch (error) {
            console.error("Error toggling publish:", error);
            toast.error("Failed to update status");
        }
        setLoading(null);
    }

    return (
        <div style={{ maxWidth: 1100 }}>
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 28,
                    flexWrap: "wrap",
                    gap: 16,
                }}
            >
                <div>
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
                        Manage Courses
                    </h1>
                    <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>
                        Create and manage your educational content.
                    </p>
                </div>
                <Link href="/dashboard/admin/courses/new">
                    <button className="btn-primary">
                        <Plus size={16} />
                        Create Course
                    </button>
                </Link>
            </motion.div>

            {/* Search */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                style={{ marginBottom: 24, maxWidth: 400 }}
            >
                <div style={{ position: "relative" }}>
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
            </motion.div>

            {/* List */}
            <div style={{ display: "grid", gap: 16 }}>
                {filtered.length === 0 ? (
                    <div className="card" style={{ padding: 40, textAlign: "center" }}>
                        <p style={{ color: "var(--text-muted)" }}>No courses found.</p>
                    </div>
                ) : (
                    filtered.map((course, i) => (
                        <motion.div
                            key={course.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className="card"
                            style={{
                                padding: "16px 20px",
                                display: "flex",
                                alignItems: "center",
                                gap: 16,
                                flexWrap: "wrap",
                            }}
                        >
                            <div
                                style={{
                                    width: 80,
                                    height: 50,
                                    borderRadius: 6,
                                    background: "var(--bg-secondary)",
                                    overflow: "hidden",
                                    flexShrink: 0,
                                }}
                            >
                                {course.thumbnail_url ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                        src={course.thumbnail_url}
                                        alt=""
                                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                    />
                                ) : (
                                    <div
                                        style={{
                                            width: "100%",
                                            height: "100%",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            color: "var(--text-muted)",
                                            fontSize: 10,
                                        }}
                                    >
                                        No Image
                                    </div>
                                )}
                            </div>

                            <div style={{ flex: 1, minWidth: 200 }}>
                                <h3
                                    style={{
                                        fontSize: 15,
                                        fontWeight: 600,
                                        color: "var(--text-primary)",
                                        marginBottom: 4,
                                    }}
                                >
                                    {course.title}
                                </h3>
                                <div style={{ display: "flex", gap: 12, fontSize: 12, color: "var(--text-muted)" }}>
                                    <span>{formatDate(course.created_at)}</span>
                                    <span>•</span>
                                    <span>{course.difficulty}</span>
                                </div>
                            </div>

                            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                <span
                                    style={{
                                        fontSize: 12,
                                        padding: "3px 10px",
                                        borderRadius: 999,
                                        fontWeight: 500,
                                        background: course.is_published
                                            ? "rgba(74,222,128,0.1)"
                                            : "rgba(250,204,21,0.1)",
                                        color: course.is_published ? "#4ade80" : "#facc15",
                                    }}
                                >
                                    {course.is_published ? "Published" : "Draft"}
                                </span>

                                <div style={{ width: 1, height: 24, background: "var(--border)" }} />

                                <button
                                    onClick={() => togglePublish(course.id, course.is_published)}
                                    disabled={loading === course.id}
                                    title={course.is_published ? "Unpublish" : "Publish"}
                                    style={{
                                        background: "none",
                                        border: "none",
                                        cursor: "pointer",
                                        padding: 8,
                                        borderRadius: 8,
                                        color: "var(--text-secondary)",
                                        display: "flex",
                                    }}
                                    className="hover:bg-zinc-100 dark:hover:bg-zinc-800"
                                >
                                    {course.is_published ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>

                                <Link href={`/dashboard/admin/courses/edit?id=${course.id}`}>
                                    <button
                                        title="Edit"
                                        style={{
                                            background: "none",
                                            border: "none",
                                            cursor: "pointer",
                                            padding: 8,
                                            borderRadius: 8,
                                            color: "var(--text-secondary)",
                                            display: "flex",
                                        }}
                                        className="hover:bg-zinc-100 dark:hover:bg-zinc-800"
                                    >
                                        <Edit size={16} />
                                    </button>
                                </Link>
                            </div>
                        </motion.div>
                    ))
                )}
            </div>
        </div>
    );
}
