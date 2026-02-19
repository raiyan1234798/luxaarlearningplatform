"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { createClient } from "@/lib/supabase/client";
import {
    Plus,
    Trash2,
    ChevronDown,
    ChevronUp,
    Save,
    ArrowLeft,
    GripVertical,
    Video,
    FileText,
    Link as LinkIcon,
} from "lucide-react";
import Link from "next/link";

interface Resource {
    name: string;
    url: string;
    type: string;
}

interface LessonForm {
    id?: string;
    title: string;
    description: string;
    video_url: string;
    video_type: "google_drive" | "github" | "youtube" | "direct";
    notes: string;
    resources: Resource[];
    duration_seconds: string;
    order_index: number;
}

interface ModuleForm {
    id?: string;
    title: string;
    description: string;
    order_index: number;
    lessons: LessonForm[];
}

interface CourseFormClientProps {
    mode: "create" | "edit";
    userId: string;
    initialCourse?: {
        id: string;
        title: string;
        description: string;
        thumbnail_url: string | null;
        instructor_name: string;
        tags: string[];
        difficulty: string;
        is_published: boolean;
        is_featured: boolean;
        modules: Array<{
            id: string;
            title: string;
            description: string | null;
            order_index: number;
            lessons: Array<{
                id: string;
                title: string;
                description: string | null;
                video_url: string;
                video_type: string;
                notes: string | null;
                resources: Resource[];
                duration_seconds: number | null;
                order_index: number;
            }>;
        }>;
    };
}

function emptyLesson(idx: number): LessonForm {
    return {
        title: "",
        description: "",
        video_url: "",
        video_type: "google_drive",
        notes: "",
        resources: [],
        duration_seconds: "",
        order_index: idx,
    };
}

function emptyModule(idx: number): ModuleForm {
    return {
        title: "",
        description: "",
        order_index: idx,
        lessons: [emptyLesson(0)],
    };
}

export default function CourseFormClient({
    mode,
    userId,
    initialCourse,
}: CourseFormClientProps) {
    const router = useRouter();
    const supabase = createClient();
    const [saving, setSaving] = useState(false);

    // Course fields
    const [title, setTitle] = useState(initialCourse?.title ?? "");
    const [description, setDescription] = useState(initialCourse?.description ?? "");
    const [thumbnailUrl, setThumbnailUrl] = useState(initialCourse?.thumbnail_url ?? "");
    const [instructorName, setInstructorName] = useState(initialCourse?.instructor_name ?? "");
    const [tagsStr, setTagsStr] = useState(initialCourse?.tags?.join(", ") ?? "");
    const [difficulty, setDifficulty] = useState(initialCourse?.difficulty ?? "beginner");
    const [isPublished, setIsPublished] = useState(initialCourse?.is_published ?? false);
    const [isFeatured, setIsFeatured] = useState(initialCourse?.is_featured ?? false);

    // Modules
    const [modules, setModules] = useState<ModuleForm[]>(
        initialCourse?.modules && initialCourse.modules.length > 0
            ? initialCourse.modules
                .sort((a, b) => a.order_index - b.order_index)
                .map((m) => ({
                    id: m.id,
                    title: m.title,
                    description: m.description ?? "",
                    order_index: m.order_index,
                    lessons: m.lessons
                        .sort((a, b) => a.order_index - b.order_index)
                        .map((l) => ({
                            id: l.id,
                            title: l.title,
                            description: l.description ?? "",
                            video_url: l.video_url,
                            video_type: l.video_type as LessonForm["video_type"],
                            notes: l.notes ?? "",
                            resources: l.resources ?? [],
                            duration_seconds: l.duration_seconds?.toString() ?? "",
                            order_index: l.order_index,
                        })),
                }))
            : [emptyModule(0)]
    );

    const [expandedModules, setExpandedModules] = useState<Set<number>>(
        new Set([0])
    );
    const [expandedLessons, setExpandedLessons] = useState<Set<string>>(
        new Set(["0-0"])
    );

    function toggleModule(idx: number) {
        setExpandedModules((prev) => {
            const next = new Set(prev);
            if (next.has(idx)) next.delete(idx);
            else next.add(idx);
            return next;
        });
    }

    function toggleLesson(key: string) {
        setExpandedLessons((prev) => {
            const next = new Set(prev);
            if (next.has(key)) next.delete(key);
            else next.add(key);
            return next;
        });
    }

    function addModule() {
        const next = [...modules, emptyModule(modules.length)];
        setModules(next);
        setExpandedModules((prev) => new Set([...prev, modules.length]));
    }

    function removeModule(idx: number) {
        setModules((prev) => prev.filter((_, i) => i !== idx));
    }

    function updateModule(idx: number, field: keyof ModuleForm, value: unknown) {
        setModules((prev) => {
            const next = [...prev];
            next[idx] = { ...next[idx], [field]: value };
            return next;
        });
    }

    function addLesson(modIdx: number) {
        setModules((prev) => {
            const next = [...prev];
            const mod = { ...next[modIdx] };
            const li = mod.lessons.length;
            mod.lessons = [...mod.lessons, emptyLesson(li)];
            next[modIdx] = mod;
            return next;
        });
        setExpandedLessons((prev) => new Set([...prev, `${modIdx}-${modules[modIdx].lessons.length}`]));
    }

    function removeLesson(modIdx: number, lesIdx: number) {
        setModules((prev) => {
            const next = [...prev];
            const mod = { ...next[modIdx] };
            mod.lessons = mod.lessons.filter((_, i) => i !== lesIdx);
            next[modIdx] = mod;
            return next;
        });
    }

    function updateLesson(modIdx: number, lesIdx: number, field: keyof LessonForm, value: unknown) {
        setModules((prev) => {
            const next = [...prev];
            const mod = { ...next[modIdx] };
            const lessons = [...mod.lessons];
            lessons[lesIdx] = { ...lessons[lesIdx], [field]: value };
            mod.lessons = lessons;
            next[modIdx] = mod;
            return next;
        });
    }

    function addResource(modIdx: number, lesIdx: number) {
        updateLesson(modIdx, lesIdx, "resources", [
            ...modules[modIdx].lessons[lesIdx].resources,
            { name: "", url: "", type: "PDF" },
        ]);
    }

    function removeResource(modIdx: number, lesIdx: number, rIdx: number) {
        updateLesson(
            modIdx,
            lesIdx,
            "resources",
            modules[modIdx].lessons[lesIdx].resources.filter((_, i) => i !== rIdx)
        );
    }

    function updateResource(modIdx: number, lesIdx: number, rIdx: number, field: keyof Resource, value: string) {
        const resources = [...modules[modIdx].lessons[lesIdx].resources];
        resources[rIdx] = { ...resources[rIdx], [field]: value };
        updateLesson(modIdx, lesIdx, "resources", resources);
    }

    async function handleSave() {
        if (!title.trim()) {
            toast.error("Course title is required");
            return;
        }
        setSaving(true);

        const tags = tagsStr
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean);

        let courseId = initialCourse?.id;

        if (mode === "create") {
            const { data, error } = await supabase
                .from("courses")
                .insert({
                    title,
                    description,
                    thumbnail_url: thumbnailUrl || null,
                    instructor_name: instructorName,
                    tags,
                    difficulty,
                    is_published: isPublished,
                    is_featured: isFeatured,
                    created_by: userId,
                })
                .select()
                .single();

            if (error) {
                toast.error("Failed to create course: " + error.message);
                setSaving(false);
                return;
            }
            courseId = data.id;
        } else {
            const { error } = await supabase
                .from("courses")
                .update({
                    title,
                    description,
                    thumbnail_url: thumbnailUrl || null,
                    instructor_name: instructorName,
                    tags,
                    difficulty,
                    is_published: isPublished,
                    is_featured: isFeatured,
                })
                .eq("id", courseId!);

            if (error) {
                toast.error("Failed to update course");
                setSaving(false);
                return;
            }
        }

        // Save modules and lessons
        for (const [mi, mod] of modules.entries()) {
            let moduleId = mod.id;

            if (moduleId) {
                await supabase
                    .from("modules")
                    .update({
                        title: mod.title,
                        description: mod.description || null,
                        order_index: mi,
                    })
                    .eq("id", moduleId);
            } else {
                const { data } = await supabase
                    .from("modules")
                    .insert({
                        course_id: courseId,
                        title: mod.title,
                        description: mod.description || null,
                        order_index: mi,
                    })
                    .select()
                    .single();
                moduleId = data?.id;
            }

            if (!moduleId) continue;

            for (const [li, lesson] of mod.lessons.entries()) {
                const lessonData = {
                    module_id: moduleId,
                    course_id: courseId,
                    title: lesson.title,
                    description: lesson.description || null,
                    video_url: lesson.video_url,
                    video_type: lesson.video_type,
                    notes: lesson.notes || null,
                    resources: lesson.resources,
                    duration_seconds: lesson.duration_seconds ? parseInt(lesson.duration_seconds) : null,
                    order_index: li,
                };

                if (lesson.id) {
                    await supabase.from("lessons").update(lessonData).eq("id", lesson.id);
                } else {
                    await supabase.from("lessons").insert(lessonData);
                }
            }
        }

        toast.success(mode === "create" ? "Course created!" : "Course updated!");
        router.push(`/dashboard/courses/${courseId}`);
        setSaving(false);
    }

    return (
        <div style={{ maxWidth: 900 }}>
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ marginBottom: 28 }}
            >
                <Link href="/dashboard/admin/courses" style={{ textDecoration: "none" }}>
                    <button className="btn-secondary" style={{ fontSize: 13, marginBottom: 16 }}>
                        <ArrowLeft size={14} />
                        Back to Courses
                    </button>
                </Link>
                <h1
                    style={{
                        fontFamily: "Poppins, sans-serif",
                        fontSize: "clamp(1.5rem, 3vw, 2rem)",
                        fontWeight: 700,
                        color: "var(--text-primary)",
                        letterSpacing: "-0.02em",
                    }}
                >
                    {mode === "create" ? "Create New Course" : "Edit Course"}
                </h1>
            </motion.div>

            {/* Course Info */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="card"
                style={{ padding: "24px", marginBottom: 20 }}
            >
                <h2 style={{ fontSize: 16, fontWeight: 600, color: "var(--text-primary)", marginBottom: 18 }}>
                    Course Information
                </h2>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                    <div style={{ gridColumn: "1 / -1" }}>
                        <label className="label">Course Title *</label>
                        <input
                            className="input"
                            type="text"
                            placeholder="e.g. Complete Web Development Bootcamp"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                        />
                    </div>
                    <div style={{ gridColumn: "1 / -1" }}>
                        <label className="label">Description</label>
                        <textarea
                            className="input"
                            placeholder="Describe what students will learn..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            style={{ minHeight: 90 }}
                        />
                    </div>
                    <div>
                        <label className="label">Instructor Name</label>
                        <input
                            className="input"
                            type="text"
                            placeholder="John Doe"
                            value={instructorName}
                            onChange={(e) => setInstructorName(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="label">Difficulty</label>
                        <select
                            className="input"
                            value={difficulty}
                            onChange={(e) => setDifficulty(e.target.value)}
                        >
                            <option value="beginner">Beginner</option>
                            <option value="intermediate">Intermediate</option>
                            <option value="advanced">Advanced</option>
                        </select>
                    </div>
                    <div style={{ gridColumn: "1 / -1" }}>
                        <label className="label">Tags (comma-separated)</label>
                        <input
                            className="input"
                            type="text"
                            placeholder="React, JavaScript, Web Development"
                            value={tagsStr}
                            onChange={(e) => setTagsStr(e.target.value)}
                        />
                    </div>
                    <div style={{ gridColumn: "1 / -1" }}>
                        <label className="label">Thumbnail URL (optional)</label>
                        <input
                            className="input"
                            type="url"
                            placeholder="https://..."
                            value={thumbnailUrl}
                            onChange={(e) => setThumbnailUrl(e.target.value)}
                        />
                    </div>
                    <div style={{ display: "flex", gap: 20, gridColumn: "1 / -1" }}>
                        <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 14, color: "var(--text-secondary)" }}>
                            <input
                                type="checkbox"
                                checked={isPublished}
                                onChange={(e) => setIsPublished(e.target.checked)}
                            />
                            Publish course (visible to students)
                        </label>
                        <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 14, color: "var(--text-secondary)" }}>
                            <input
                                type="checkbox"
                                checked={isFeatured}
                                onChange={(e) => setIsFeatured(e.target.checked)}
                            />
                            Featured course
                        </label>
                    </div>
                </div>
            </motion.div>

            {/* Modules */}
            <div style={{ marginBottom: 20 }}>
                <h2 style={{ fontSize: 16, fontWeight: 600, color: "var(--text-primary)", marginBottom: 14 }}>
                    Course Content
                </h2>

                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {modules.map((mod, mi) => (
                        <motion.div
                            key={mi}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: mi * 0.05 }}
                            className="card"
                            style={{ overflow: "hidden" }}
                        >
                            {/* Module header */}
                            <div
                                style={{
                                    padding: "16px 20px",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 12,
                                    cursor: "pointer",
                                    borderBottom: expandedModules.has(mi) ? "1px solid var(--border)" : "none",
                                }}
                                onClick={() => toggleModule(mi)}
                            >
                                <GripVertical size={16} color="var(--text-muted)" />
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 2 }}>
                                        Module {mi + 1}
                                    </div>
                                    <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>
                                        {mod.title || "Untitled Module"}
                                    </div>
                                </div>
                                <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                                    {mod.lessons.length} lesson{mod.lessons.length !== 1 ? "s" : ""}
                                </span>
                                <button
                                    onClick={(e) => { e.stopPropagation(); removeModule(mi); }}
                                    style={{ background: "none", border: "none", cursor: "pointer", color: "#f87171", padding: 4 }}
                                >
                                    <Trash2 size={14} />
                                </button>
                                {expandedModules.has(mi) ? (
                                    <ChevronUp size={16} color="var(--text-muted)" />
                                ) : (
                                    <ChevronDown size={16} color="var(--text-muted)" />
                                )}
                            </div>

                            {/* Module content */}
                            {expandedModules.has(mi) && (
                                <div style={{ padding: "20px" }}>
                                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 20 }}>
                                        <div style={{ gridColumn: "1 / -1" }}>
                                            <label className="label">Module Title *</label>
                                            <input
                                                className="input"
                                                type="text"
                                                placeholder="Module title"
                                                value={mod.title}
                                                onChange={(e) => updateModule(mi, "title", e.target.value)}
                                                onClick={(e) => e.stopPropagation()}
                                            />
                                        </div>
                                        <div style={{ gridColumn: "1 / -1" }}>
                                            <label className="label">Module Description</label>
                                            <textarea
                                                className="input"
                                                placeholder="Optional description"
                                                value={mod.description}
                                                onChange={(e) => updateModule(mi, "description", e.target.value)}
                                                style={{ minHeight: 60 }}
                                            />
                                        </div>
                                    </div>

                                    {/* Lessons */}
                                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                                        {mod.lessons.map((lesson, li) => {
                                            const key = `${mi}-${li}`;
                                            const isExpanded = expandedLessons.has(key);
                                            return (
                                                <div
                                                    key={li}
                                                    style={{
                                                        border: "1px solid var(--border)",
                                                        borderRadius: 10,
                                                        overflow: "hidden",
                                                        background: "var(--bg-secondary)",
                                                    }}
                                                >
                                                    <div
                                                        style={{
                                                            padding: "12px 14px",
                                                            display: "flex",
                                                            alignItems: "center",
                                                            gap: 10,
                                                            cursor: "pointer",
                                                        }}
                                                        onClick={() => toggleLesson(key)}
                                                    >
                                                        <Video size={14} color="#c9a84c" />
                                                        <span style={{ flex: 1, fontSize: 13, fontWeight: 500, color: "var(--text-primary)" }}>
                                                            {lesson.title || `Lesson ${li + 1}`}
                                                        </span>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); removeLesson(mi, li); }}
                                                            style={{ background: "none", border: "none", cursor: "pointer", color: "#f87171", padding: 4 }}
                                                        >
                                                            <Trash2 size={13} />
                                                        </button>
                                                        {isExpanded ? (
                                                            <ChevronUp size={14} color="var(--text-muted)" />
                                                        ) : (
                                                            <ChevronDown size={14} color="var(--text-muted)" />
                                                        )}
                                                    </div>

                                                    {isExpanded && (
                                                        <div style={{ padding: "14px", borderTop: "1px solid var(--border)" }}>
                                                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
                                                                <div style={{ gridColumn: "1 / -1" }}>
                                                                    <label className="label">Lesson Title *</label>
                                                                    <input
                                                                        className="input"
                                                                        type="text"
                                                                        placeholder="Lesson title"
                                                                        value={lesson.title}
                                                                        onChange={(e) => updateLesson(mi, li, "title", e.target.value)}
                                                                    />
                                                                </div>
                                                                <div>
                                                                    <label className="label">Video Type</label>
                                                                    <select
                                                                        className="input"
                                                                        value={lesson.video_type}
                                                                        onChange={(e) => updateLesson(mi, li, "video_type", e.target.value)}
                                                                    >
                                                                        <option value="google_drive">Google Drive</option>
                                                                        <option value="github">GitHub</option>
                                                                        <option value="youtube">YouTube</option>
                                                                        <option value="direct">Direct URL</option>
                                                                    </select>
                                                                </div>
                                                                <div>
                                                                    <label className="label">Duration (seconds)</label>
                                                                    <input
                                                                        className="input"
                                                                        type="number"
                                                                        placeholder="e.g. 600"
                                                                        value={lesson.duration_seconds}
                                                                        onChange={(e) => updateLesson(mi, li, "duration_seconds", e.target.value)}
                                                                    />
                                                                </div>
                                                                <div style={{ gridColumn: "1 / -1" }}>
                                                                    <label className="label">
                                                                        <LinkIcon size={12} style={{ display: "inline", marginRight: 4 }} />
                                                                        Video URL *
                                                                    </label>
                                                                    <input
                                                                        className="input"
                                                                        type="url"
                                                                        placeholder="https://drive.google.com/file/d/... or raw GitHub URL"
                                                                        value={lesson.video_url}
                                                                        onChange={(e) => updateLesson(mi, li, "video_url", e.target.value)}
                                                                    />
                                                                    <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>
                                                                        {lesson.video_type === "google_drive" && "Share → Copy link from Google Drive"}
                                                                        {lesson.video_type === "github" && "Use raw GitHub content URL ending in .mp4"}
                                                                        {lesson.video_type === "youtube" && "Standard YouTube watch URL"}
                                                                    </p>
                                                                </div>
                                                                <div style={{ gridColumn: "1 / -1" }}>
                                                                    <label className="label">
                                                                        <FileText size={12} style={{ display: "inline", marginRight: 4 }} />
                                                                        Notes (Markdown supported)
                                                                    </label>
                                                                    <textarea
                                                                        className="input"
                                                                        placeholder="# Lesson Notes&#10;&#10;Add markdown notes here..."
                                                                        value={lesson.notes}
                                                                        onChange={(e) => updateLesson(mi, li, "notes", e.target.value)}
                                                                        style={{ minHeight: 120, fontFamily: "monospace", fontSize: 13 }}
                                                                    />
                                                                </div>
                                                            </div>

                                                            {/* Resources */}
                                                            <div>
                                                                <label className="label">Resources</label>
                                                                {lesson.resources.map((r, ri) => (
                                                                    <div
                                                                        key={ri}
                                                                        style={{
                                                                            display: "grid",
                                                                            gridTemplateColumns: "1fr 2fr 80px auto",
                                                                            gap: 8,
                                                                            marginBottom: 8,
                                                                        }}
                                                                    >
                                                                        <input
                                                                            className="input"
                                                                            type="text"
                                                                            placeholder="Name"
                                                                            value={r.name}
                                                                            onChange={(e) => updateResource(mi, li, ri, "name", e.target.value)}
                                                                            style={{ fontSize: 12 }}
                                                                        />
                                                                        <input
                                                                            className="input"
                                                                            type="url"
                                                                            placeholder="URL"
                                                                            value={r.url}
                                                                            onChange={(e) => updateResource(mi, li, ri, "url", e.target.value)}
                                                                            style={{ fontSize: 12 }}
                                                                        />
                                                                        <input
                                                                            className="input"
                                                                            type="text"
                                                                            placeholder="Type"
                                                                            value={r.type}
                                                                            onChange={(e) => updateResource(mi, li, ri, "type", e.target.value)}
                                                                            style={{ fontSize: 12 }}
                                                                        />
                                                                        <button
                                                                            onClick={() => removeResource(mi, li, ri)}
                                                                            style={{ background: "none", border: "none", cursor: "pointer", color: "#f87171", display: "flex", alignItems: "center" }}
                                                                        >
                                                                            <Trash2 size={13} />
                                                                        </button>
                                                                    </div>
                                                                ))}
                                                                <button
                                                                    className="btn-secondary"
                                                                    onClick={() => addResource(mi, li)}
                                                                    style={{ fontSize: 12, marginTop: 4 }}
                                                                >
                                                                    <Plus size={13} />
                                                                    Add Resource
                                                                </button>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>

                                    <button
                                        className="btn-secondary"
                                        onClick={(e) => { e.stopPropagation(); addLesson(mi); }}
                                        style={{ fontSize: 13, marginTop: 12 }}
                                    >
                                        <Plus size={14} />
                                        Add Lesson
                                    </button>
                                </div>
                            )}
                        </motion.div>
                    ))}
                </div>

                <button
                    className="btn-secondary"
                    onClick={addModule}
                    style={{ marginTop: 12, fontSize: 14 }}
                >
                    <Plus size={15} />
                    Add Module
                </button>
            </div>

            {/* Save */}
            <div
                style={{
                    position: "sticky",
                    bottom: 0,
                    background: "var(--bg-primary)",
                    padding: "16px 0",
                    borderTop: "1px solid var(--border)",
                    display: "flex",
                    gap: 12,
                    justifyContent: "flex-end",
                }}
            >
                <Link href="/dashboard/admin/courses">
                    <button className="btn-secondary">Cancel</button>
                </Link>
                <button
                    className="btn-primary"
                    onClick={handleSave}
                    disabled={saving}
                >
                    <Save size={16} />
                    {saving ? "Saving..." : mode === "create" ? "Create Course" : "Save Changes"}
                </button>
            </div>
        </div>
    );
}
