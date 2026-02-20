import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { db } from "@/lib/firebase/client";
import { doc, setDoc, updateDoc, collection, query, where, getDocs, getDoc } from "firebase/firestore";
import { formatDuration, getVideoEmbedUrl, isEmbeddableVideo } from "@/lib/utils";
import type { Lesson, LessonProgress, Module } from "@/types";
import {
    ChevronDown,
    ChevronUp,
    CheckCircle,
    Circle,
    FileText,
    Download,
    BookOpen,
    ChevronLeft,
    ChevronRight,
    Menu,
    Play,
    Lock
} from "lucide-react";
import toast from "react-hot-toast";
import dynamic from 'next/dynamic';
import Confetti from 'react-confetti';
import { useWindowSize } from 'react-use';

// Load ReactPlayer dynamically to avoid SSR issues
const ReactPlayer = dynamic(() => import('react-player'), { ssr: false }) as any;

interface FullCourse {
    id: string;
    title: string;
    modules: Array<Module & { lessons: Lesson[] }>;
}

interface LearnPageClientProps {
    course: FullCourse;
    initialLessonId?: string;
    progress: LessonProgress[];
    userId: string;
    userEmail: string;
}

type Tab = "notes" | "resources";

export default function LearnPageClient({
    course,
    initialLessonId,
    progress,
    userId,
    userEmail,
}: LearnPageClientProps) {
    // Flatten all lessons
    const allLessons: Lesson[] = course.modules
        .sort((a, b) => a.order_index - b.order_index)
        .flatMap((m) => (m.lessons ?? []).sort((a, b) => a.order_index - b.order_index));

    const [currentLesson, setCurrentLesson] = useState<Lesson | null>(
        () =>
            allLessons.find((l) => l.id === initialLessonId) ??
            allLessons[0] ??
            null
    );
    const [activeTab, setActiveTab] = useState<Tab>("notes");
    const [expandedModules, setExpandedModules] = useState<Set<string>>(
        new Set(course.modules.map((m) => m.id))
    );
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [lessonProgress, setLessonProgress] = useState<Record<string, LessonProgress>>(() =>
        Object.fromEntries(progress.map((p) => [p.lesson_id, p]))
    );

    const [videoCompleted, setVideoCompleted] = useState(false);
    const [showConfetti, setShowConfetti] = useState(false);
    const [maxPlayed, setMaxPlayed] = useState(0);
    const playerRef = useRef<any>(null);
    const { width, height } = useWindowSize();

    const currentLessonIndex = allLessons.findIndex(
        (l) => l.id === currentLesson?.id
    );
    const prevLesson = currentLessonIndex > 0 ? allLessons[currentLessonIndex - 1] : null;
    const nextLesson =
        currentLessonIndex < allLessons.length - 1
            ? allLessons[currentLessonIndex + 1]
            : null;

    const completedCount = Object.values(lessonProgress).filter((p) => p.completed).length;
    const overallProgress = allLessons.length > 0
        ? Math.round((completedCount / allLessons.length) * 100)
        : 0;

    // Determine if we can track progress (Check URL pattern first, then fall back to type)
    const isYouTubeOrVimeo = currentLesson?.video_url ?
        (currentLesson.video_url.includes('youtube.com') ||
            currentLesson.video_url.includes('youtu.be') ||
            currentLesson.video_url.includes('vimeo.com')) : false;

    const isTrackable = currentLesson ?
        isYouTubeOrVimeo ||
        ["youtube", "vimeo", "video"].includes(currentLesson.video_type) ||
        !["google_drive", "loom"].includes(currentLesson.video_type)
        : false;

    // Helper to determine if we should use iframe fallback (Drive, Loom) - UNLESS it's actually YouTube/Vimeo
    const useIframeFallback = currentLesson ?
        !isYouTubeOrVimeo && ["google_drive", "loom"].includes(currentLesson.video_type)
        : false;

    // Reset video state when lesson changes
    useEffect(() => {
        if (currentLesson) {
            const isCompleted = lessonProgress[currentLesson.id]?.completed || false;
            setVideoCompleted(isCompleted);
            setMaxPlayed(0); // Reset max played for new lesson
        }
    }, [currentLesson, lessonProgress]);

    // Check for course completion animation
    useEffect(() => {
        if (overallProgress === 100 && !showConfetti) {
            setShowConfetti(true);
            const timer = setTimeout(() => setShowConfetti(false), 8000); // Stop after 8s
            return () => clearTimeout(timer);
        }
    }, [overallProgress]);


    const markComplete = useCallback(
        async (lessonId: string) => {
            const existing = lessonProgress[lessonId];
            if (existing?.completed) return;

            const lesson = allLessons.find((l) => l.id === lessonId);
            const duration = lesson?.duration_seconds || 0;

            try {
                const progressId = `${userId}_${lessonId}`;
                const progressData: LessonProgress = {
                    id: progressId,
                    user_id: userId,
                    lesson_id: lessonId,
                    course_id: course.id,
                    completed: true,
                    last_watched_at: new Date().toISOString(),
                    watched_seconds: duration,
                    total_seconds: duration
                };

                // Save progress to Firestore
                await setDoc(doc(db, "lesson_progress", progressId), progressData);

                setLessonProgress((prev) => ({
                    ...prev,
                    [lessonId]: progressData,
                }));

                // Calculate new progress percentage
                const newCompleted = Object.values({ ...lessonProgress, [lessonId]: { completed: true } }).filter(
                    (p) => (p as { completed: boolean }).completed
                ).length;
                const pct = Math.round((newCompleted / allLessons.length) * 100);

                // Update enrollment
                const enrollmentsRef = collection(db, "enrollments");
                const q = query(
                    enrollmentsRef,
                    where("user_id", "==", userId),
                    where("course_id", "==", course.id)
                );
                const querySnapshot = await getDocs(q);

                if (!querySnapshot.empty) {
                    const enrollmentDoc = querySnapshot.docs[0];
                    await updateDoc(doc(db, "enrollments", enrollmentDoc.id), {
                        progress_percentage: pct,
                        ...(pct === 100 ? { completed_at: new Date().toISOString() } : {}),
                    });
                }

                toast.success("Lesson completed!");
                setVideoCompleted(true);
            } catch (error) {
                console.error("Error marking lesson complete:", error);
                toast.error("Failed to update progress");
            }
        },
        [userId, course.id, lessonProgress, allLessons]
    );

    // Prevent skipping ahead
    const handleProgress = (state: { playedSeconds: number; played: number; loaded: number; loadedSeconds: number }) => {
        if (!currentLesson || !isTrackable) return;
        const isCompleted = lessonProgress[currentLesson.id]?.completed;

        // If already completed, allow free seeking
        if (isCompleted) return;

        // If trying to seek forward beyond significantly what was watched
        if (state.playedSeconds > maxPlayed + 2) { // Allow tiny buffering/jitter
            // Revert to maxPlayed
            if (playerRef.current) {
                playerRef.current.seekTo(maxPlayed, 'seconds');
                toast.error("Please watch the video without skipping to complete the lesson.", { id: "no-skip" });
            }
        } else {
            setMaxPlayed(Math.max(maxPlayed, state.playedSeconds));
        }
    };

    const handleVideoEnded = () => {
        if (currentLesson && !lessonProgress[currentLesson.id]?.completed) {
            markComplete(currentLesson.id);
        }
    };

    function toggleModule(moduleId: string) {
        setExpandedModules((prev) => {
            const next = new Set(prev);
            if (next.has(moduleId)) next.delete(moduleId);
            else next.add(moduleId);
            return next;
        });
    }

    function isLessonLocked(lessonId: string): boolean {
        const index = allLessons.findIndex((l) => l.id === lessonId);
        if (index <= 0) return false; // First lesson always unlocked
        const prevLessonId = allLessons[index - 1].id;
        return !lessonProgress[prevLessonId]?.completed;
    }

    function selectLesson(lesson: Lesson) {
        if (isLessonLocked(lesson.id)) {
            toast.error("Please complete the previous lesson first.", { id: "locked-lesson" });
            return;
        }
        setCurrentLesson(lesson);
        setSidebarOpen(false);
    }

    if (allLessons.length === 0) {
        return (
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    height: "60vh",
                    flexDirection: "column",
                    gap: 16,
                    textAlign: "center",
                }}
            >
                <BookOpen size={48} color="var(--text-muted)" />
                <h2 style={{ fontSize: 18, fontWeight: 600, color: "var(--text-primary)" }}>
                    No lessons yet
                </h2>
                <p style={{ color: "var(--text-muted)", fontSize: 14 }}>
                    Check back soon — content is being added.
                </p>
            </div>
        );
    }

    const SidebarContent = () => (
        <div style={{ height: "100%", overflowY: "auto", display: "flex", flexDirection: "column" }}>
            {/* Course header */}
            <div style={{ padding: "16px", borderBottom: "1px solid var(--border)" }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", marginBottom: 8, lineHeight: 1.3 }}>
                    {course.title}
                </h3>
                <div style={{ marginBottom: 6 }}>
                    <div className="progress-bar">
                        <div className="progress-fill" style={{ width: `${overallProgress}%` }} />
                    </div>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--text-muted)" }}>
                    <span>{completedCount}/{allLessons.length} lessons</span>
                    <span style={{ color: "#c9a84c", fontWeight: 600 }}>{overallProgress}%</span>
                </div>
            </div>

            {/* Modules */}
            <div style={{ flex: 1, padding: "8px" }}>
                {course.modules
                    .sort((a, b) => a.order_index - b.order_index)
                    .map((mod) => (
                        <div key={mod.id} style={{ marginBottom: 4 }}>
                            <button
                                onClick={() => toggleModule(mod.id)}
                                style={{
                                    width: "100%",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 8,
                                    padding: "10px 10px",
                                    borderRadius: 8,
                                    background: "none",
                                    border: "none",
                                    cursor: "pointer",
                                    textAlign: "left",
                                }}
                            >
                                <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", flex: 1 }}>
                                    {mod.title}
                                </span>
                                {expandedModules.has(mod.id) ? (
                                    <ChevronUp size={13} color="var(--text-muted)" />
                                ) : (
                                    <ChevronDown size={13} color="var(--text-muted)" />
                                )}
                            </button>

                            {expandedModules.has(mod.id) &&
                                mod.lessons
                                    ?.sort((a, b) => a.order_index - b.order_index)
                                    .map((lesson) => {
                                        const isActive = lesson.id === currentLesson?.id;
                                        const isDone = lessonProgress[lesson.id]?.completed;
                                        const isLocked = isLessonLocked(lesson.id);

                                        return (
                                            <button
                                                key={lesson.id}
                                                onClick={() => selectLesson(lesson)}
                                                disabled={isLocked}
                                                style={{
                                                    width: "100%",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: 8,
                                                    padding: "9px 10px 9px 20px",
                                                    borderRadius: 8,
                                                    background: isActive ? "rgba(201,168,76,0.1)" : "transparent",
                                                    border: "none",
                                                    cursor: isLocked ? "not-allowed" : "pointer",
                                                    textAlign: "left",
                                                    transition: "all 0.15s",
                                                    opacity: isLocked ? 0.6 : 1,
                                                }}
                                            >
                                                {isLocked ? (
                                                    <Lock size={14} color="var(--text-muted)" />
                                                ) : isDone ? (
                                                    <CheckCircle size={14} color="#4ade80" />
                                                ) : (
                                                    <Circle size={14} color={isActive ? "#c9a84c" : "var(--text-muted)"} />
                                                )}
                                                <span
                                                    style={{
                                                        fontSize: 13,
                                                        color: isActive ? "var(--text-primary)" : "var(--text-secondary)",
                                                        fontWeight: isActive ? 600 : 400,
                                                        flex: 1,
                                                        lineHeight: 1.4,
                                                    }}
                                                >
                                                    {lesson.title}
                                                </span>
                                                {lesson.duration_seconds && (
                                                    <span style={{ fontSize: 11, color: "var(--text-muted)", flexShrink: 0 }}>
                                                        {formatDuration(lesson.duration_seconds)}
                                                    </span>
                                                )}
                                            </button>
                                        );
                                    })}
                        </div>
                    ))}
            </div>
        </div>
    );

    return (
        <div
            style={{
                display: "flex",
                height: "calc(100vh - 60px)",
                margin: "-28px -20px",
                overflow: "hidden",
                position: "relative"
            }}
        >
            {showConfetti && <Confetti width={width} height={height} numberOfPieces={500} recycle={false} />}

            {/* Desktop sidebar */}
            <div
                style={{
                    width: 280,
                    borderRight: "1px solid var(--border)",
                    background: "var(--bg-primary)",
                    display: "none",
                    flexShrink: 0,
                }}
                id="learn-sidebar"
            >
                <SidebarContent />
            </div>

            {/* Mobile sidebar */}
            <AnimatePresence>
                {sidebarOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSidebarOpen(false)}
                            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 48 }}
                        />
                        <motion.div
                            initial={{ x: -280 }}
                            animate={{ x: 0 }}
                            exit={{ x: -280 }}
                            transition={{ type: "spring", damping: 30, stiffness: 300 }}
                            style={{
                                position: "fixed",
                                top: 0,
                                left: 0,
                                bottom: 0,
                                width: 280,
                                background: "var(--bg-primary)",
                                borderRight: "1px solid var(--border)",
                                zIndex: 49,
                            }}
                        >
                            <SidebarContent />
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Main area */}
            <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column" }}>
                {/* Top bar */}
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        padding: "12px 20px",
                        borderBottom: "1px solid var(--border)",
                        flexShrink: 0,
                    }}
                >
                    <button
                        onClick={() => setSidebarOpen(true)}
                        style={{
                            background: "var(--bg-secondary)",
                            border: "1px solid var(--border)",
                            borderRadius: 7,
                            padding: 7,
                            cursor: "pointer",
                            color: "var(--text-secondary)",
                            display: "flex",
                        }}
                        id="learn-menu-btn"
                    >
                        <Menu size={15} />
                    </button>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <h2
                            style={{
                                fontSize: 14,
                                fontWeight: 600,
                                color: "var(--text-primary)",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                            }}
                        >
                            {currentLesson?.title}
                        </h2>
                    </div>
                    {currentLesson?.quiz_link && (
                        <a
                            href={currentLesson.quiz_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ textDecoration: "none" }}
                        >
                            <button
                                className="btn-secondary"
                                style={{ fontSize: 12, padding: "7px 14px", flexShrink: 0, display: "flex", alignItems: "center", gap: 6, marginRight: 8 }}
                            >
                                <FileText size={14} />
                                Take Quiz
                            </button>
                        </a>
                    )}

                    {/* Completion Status / Button */}
                    {currentLesson && (
                        lessonProgress[currentLesson.id]?.completed ? (
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 6,
                                    fontSize: 12,
                                    color: "#4ade80",
                                    padding: "7px 14px",
                                    borderRadius: 8,
                                    background: "rgba(74,222,128,0.1)",
                                }}
                            >
                                <CheckCircle size={14} />
                                <span>Completed</span>
                            </div>
                        ) : !isTrackable ? (
                            <button
                                className="btn-primary"
                                onClick={() => markComplete(currentLesson.id)}
                                style={{ fontSize: 12, padding: "7px 14px", flexShrink: 0 }}
                            >
                                <CheckCircle size={14} />
                                Mark Complete
                            </button>
                        ) : (
                            <button
                                className="btn-secondary"
                                disabled={true}
                                style={{
                                    fontSize: 12,
                                    padding: "7px 14px",
                                    flexShrink: 0,
                                    cursor: "not-allowed",
                                    opacity: 0.6,
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 6
                                }}
                                title="Watch the full video to complete"
                            >
                                <Lock size={12} />
                                Watch to Complete
                            </button>
                        )
                    )}
                </div>

                {/* Video player */}
                {currentLesson && (
                    <div style={{ padding: "20px", maxWidth: 960, width: "100%" }}>
                        <div
                            style={{
                                position: "relative",
                                marginBottom: 20,
                                borderRadius: 12,
                                overflow: "hidden",
                                background: "#000",
                                aspectRatio: "16/9"
                            }}
                        >
                            {!useIframeFallback ? (
                                <ReactPlayer
                                    ref={playerRef}
                                    url={currentLesson.video_url}
                                    width="100%"
                                    height="100%"
                                    controls={true}
                                    onEnded={handleVideoEnded}
                                    onProgress={handleProgress}
                                    config={{
                                        file: {
                                            attributes: {
                                                controlsList: 'nodownload'
                                            }
                                        }
                                    }}
                                />
                            ) : (
                                <iframe
                                    src={getVideoEmbedUrl(currentLesson.video_url, currentLesson.video_type)}
                                    allow="autoplay; fullscreen; picture-in-picture"
                                    allowFullScreen
                                    title={currentLesson.title}
                                    style={{
                                        width: "100%",
                                        height: "100%",
                                        border: "none",
                                    }}
                                />
                            )}

                            {/* Watermark */}
                            <div className="video-watermark" style={{ position: "absolute" }}>
                                {userEmail}
                            </div>
                        </div>

                        {/* Nav */}
                        <div
                            style={{
                                display: "flex",
                                justifyContent: "space-between",
                                marginBottom: 24,
                            }}
                        >
                            <button
                                className="btn-secondary"
                                onClick={() => prevLesson && selectLesson(prevLesson)}
                                disabled={!prevLesson}
                                style={{ fontSize: 13 }}
                            >
                                <ChevronLeft size={15} />
                                Previous
                            </button>
                            <button
                                className="btn-primary"
                                onClick={() => nextLesson && selectLesson(nextLesson)}
                                disabled={!nextLesson || isLessonLocked(nextLesson?.id || "")}
                                style={{
                                    fontSize: 13,
                                    opacity: (!nextLesson || isLessonLocked(nextLesson?.id || "")) ? 0.6 : 1,
                                    cursor: (!nextLesson || isLessonLocked(nextLesson?.id || "")) ? "not-allowed" : "pointer"
                                }}
                            >
                                Next
                                <ChevronRight size={15} />
                            </button>
                        </div>

                        {/* Tabs */}
                        <div
                            style={{
                                display: "flex",
                                gap: 4,
                                borderBottom: "1px solid var(--border)",
                                marginBottom: 20,
                            }}
                        >
                            {(["notes", "resources"] as Tab[]).map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    style={{
                                        padding: "10px 16px",
                                        border: "none",
                                        background: "none",
                                        cursor: "pointer",
                                        fontSize: 14,
                                        fontWeight: activeTab === tab ? 600 : 400,
                                        color: activeTab === tab ? "var(--text-primary)" : "var(--text-muted)",
                                        borderBottom: activeTab === tab ? "2px solid #c9a84c" : "2px solid transparent",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 6,
                                        textTransform: "capitalize",
                                        transition: "all 0.2s",
                                    }}
                                >
                                    {tab === "notes" ? <FileText size={14} /> : <Download size={14} />}
                                    {tab}
                                </button>
                            ))}
                        </div>

                        {/* Tab content */}
                        {activeTab === "notes" && (
                            <div className="markdown-content card" style={{ padding: "24px" }}>
                                {currentLesson.notes ? (
                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                        {currentLesson.notes}
                                    </ReactMarkdown>
                                ) : (
                                    <p style={{ color: "var(--text-muted)", fontSize: 14 }}>
                                        No notes for this lesson.
                                    </p>
                                )}
                            </div>
                        )}

                        {activeTab === "resources" && (
                            <div>
                                {currentLesson.resources && currentLesson.resources.length > 0 ? (
                                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                                        {currentLesson.resources.map((r, i) => (
                                            <a
                                                key={i}
                                                href={r.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                style={{ textDecoration: "none" }}
                                            >
                                                <div
                                                    className="card"
                                                    style={{
                                                        padding: "14px 16px",
                                                        display: "flex",
                                                        alignItems: "center",
                                                        gap: 12,
                                                        cursor: "pointer",
                                                    }}
                                                >
                                                    <Download size={16} color="#c9a84c" />
                                                    <div style={{ flex: 1 }}>
                                                        <div style={{ fontSize: 14, fontWeight: 500, color: "var(--text-primary)" }}>
                                                            {r.name}
                                                        </div>
                                                        <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{r.type}</div>
                                                    </div>
                                                </div>
                                            </a>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="card" style={{ padding: 32, textAlign: "center" }}>
                                        <p style={{ color: "var(--text-muted)", fontSize: 14 }}>
                                            No resources for this lesson.
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>

            <style>{`
        @media (min-width: 768px) {
          #learn-sidebar { display: flex !important; }
          #learn-menu-btn { display: none !important; }
        }
      `}</style>
        </div>
    );
}
