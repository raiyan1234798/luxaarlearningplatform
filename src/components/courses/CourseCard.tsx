"use client";

import Link from "next/link";
import type { Course } from "@/types";
import { getDifficultyColor, truncate } from "@/lib/utils";
import { BookOpen, Users, Play } from "lucide-react";

interface CourseCardProps {
    course: Course;
    progress?: number;
    isEnrolled?: boolean;
}

export function CourseCard({ course, progress, isEnrolled }: CourseCardProps) {
    const diffColor = getDifficultyColor(course.difficulty);

    return (
        <Link
            href={
                isEnrolled
                    ? `/dashboard/courses/${course.id}/learn`
                    : `/dashboard/courses/${course.id}`
            }
            style={{ textDecoration: "none" }}
        >
            <div
                className="card"
                style={{
                    overflow: "hidden",
                    cursor: "pointer",
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                }}
            >
                {/* Thumbnail */}
                <div
                    style={{
                        height: 140,
                        background: "linear-gradient(135deg, rgba(201,168,76,0.15) 0%, rgba(124,58,237,0.1) 100%)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        position: "relative",
                        flexShrink: 0,
                    }}
                >
                    {course.thumbnail_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                            src={course.thumbnail_url}
                            alt={course.title}
                            className="course-thumbnail"
                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        />
                    ) : (
                        <BookOpen size={40} color="rgba(201,168,76,0.5)" />
                    )}

                    {/* Overlay play button */}
                    <div
                        style={{
                            position: "absolute",
                            inset: 0,
                            background: "rgba(0,0,0,0.3)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            opacity: 0,
                            transition: "opacity 0.2s",
                        }}
                        className="play-overlay"
                    >
                        <div
                            style={{
                                width: 44,
                                height: 44,
                                borderRadius: "50%",
                                background: "rgba(201,168,76,0.9)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                            }}
                        >
                            <Play size={18} color="#0a0a0a" />
                        </div>
                    </div>

                    {/* Featured badge */}
                    {course.is_featured && (
                        <div
                            style={{
                                position: "absolute",
                                top: 10,
                                left: 10,
                                padding: "3px 9px",
                                borderRadius: 999,
                                background: "rgba(201,168,76,0.9)",
                                fontSize: 11,
                                fontWeight: 600,
                                color: "#0a0a0a",
                            }}
                        >
                            Featured
                        </div>
                    )}
                </div>

                {/* Content */}
                <div style={{ padding: "16px", flex: 1, display: "flex", flexDirection: "column" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                        <span
                            className={`badge ${diffColor}`}
                            style={{ fontSize: 11 }}
                        >
                            {course.difficulty}
                        </span>
                        {course.tags?.slice(0, 1).map((tag) => (
                            <span
                                key={tag}
                                style={{
                                    fontSize: 11,
                                    padding: "2px 8px",
                                    borderRadius: 999,
                                    background: "var(--bg-secondary)",
                                    color: "var(--text-muted)",
                                }}
                            >
                                {tag}
                            </span>
                        ))}
                    </div>

                    <h3
                        style={{
                            fontSize: 15,
                            fontWeight: 600,
                            color: "var(--text-primary)",
                            marginBottom: 6,
                            lineHeight: 1.4,
                        }}
                    >
                        {truncate(course.title, 50)}
                    </h3>

                    <p
                        style={{
                            fontSize: 13,
                            color: "var(--text-secondary)",
                            lineHeight: 1.5,
                            marginBottom: 12,
                            flex: 1,
                        }}
                    >
                        {truncate(course.description, 80)}
                    </p>

                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            fontSize: 12,
                            color: "var(--text-muted)",
                            marginBottom: progress !== undefined ? 10 : 0,
                        }}
                    >
                        <div
                            style={{
                                width: 22,
                                height: 22,
                                borderRadius: "50%",
                                background: "rgba(201,168,76,0.15)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                            }}
                        >
                            <Users size={11} color="#c9a84c" />
                        </div>
                        <span>{course.instructor_name}</span>
                    </div>

                    {/* Progress bar */}
                    {progress !== undefined && (
                        <div>
                            <div
                                style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    fontSize: 11,
                                    color: "var(--text-muted)",
                                    marginBottom: 5,
                                }}
                            >
                                <span>Progress</span>
                                <span style={{ color: "#c9a84c", fontWeight: 600 }}>{progress}%</span>
                            </div>
                            <div className="progress-bar">
                                <div className="progress-fill" style={{ width: `${progress}%` }} />
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <style>{`
        .card:hover .play-overlay {
          opacity: 1 !important;
        }
        .card:hover .course-thumbnail {
          transform: scale(1.05);
        }
        .course-thumbnail {
          transition: transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .play-overlay > div {
          transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
          transform: scale(0.8);
        }
        .card:hover .play-overlay > div {
          transform: scale(1);
        }
      `}</style>
        </Link>
    );
}
