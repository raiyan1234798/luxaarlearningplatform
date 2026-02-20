"use client";

import { useState } from "react";
import { db } from "@/lib/firebase/client";
import { collection, addDoc, doc, setDoc } from "firebase/firestore";
import { toast } from "react-hot-toast";
import { BookOpen, AlertCircle, CheckCircle } from "lucide-react";

const PREMIUM_COURSES = [
    {
        title: "Modern React & Next.js 14 Masterclass",
        description: "Master the React ecosystem from the ground up to advanced production architectures. Dive deep into the Next.js 14 app router, React Server Components (RSC), complex state management, and deploying full-stack web applications at scale.",
        thumbnail_url: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
        instructor_name: "Sarah Jenkins",
        instructor_avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80",
        modules: [
            {
                title: "1. Next.js Foundations",
                description: "Getting started with the app router and server components.",
                lessons: [
                    {
                        title: "Introduction to Next.js 14",
                        description: "Understand the fundamental shift from pages router to the app router paradigm.",
                        video_url: "https://www.youtube.com/watch?v=ZjAqacIC_3c",
                        video_type: "youtube",
                        duration: 650,
                        notes: "## Key Concepts\n- The physical file system dictates routing.\n- `page.tsx` makes a route publicly accessible.\n- `layout.tsx` wraps the UI of nested pages.\n\n### Why Server Components?\nBy default, all components are Server Components. This allows you to fetch data directly on the server without shipping the client hydration overhead."
                    },
                    {
                        title: "Server vs Client Components",
                        description: "When to use 'use client' and how to interleave tree boundaries.",
                        video_url: "https://www.youtube.com/watch?v=RMBwTjJtZlE",
                        video_type: "youtube",
                        duration: 840,
                        notes: "Remember: Only add `'use client'` when you strictly need interactivity (onClick hooks) or browser APIs (window.scrollY).\n\nKeep client components as low in the tree as possible!"
                    }
                ]
            },
            {
                title: "2. Data Fetching & Caching",
                description: "Deep dive into the extended fetch api.",
                lessons: [
                    {
                        title: "Static vs Dynamic Rendering",
                        description: "How Next.js optimizes your pages automatically.",
                        video_url: "https://www.youtube.com/watch?v=Vbl4mHhEEaA",
                        video_type: "youtube",
                        duration: 520,
                        notes: "## Caching Strategies\n- `force-cache` (Default)\n- `no-store` (Dynamic SSR)\n- `revalidate: 3600` (Incremental Static Regeneration)"
                    }
                ]
            }
        ]
    },
    {
        title: "UX/UI Design: The Complete Guide",
        description: "Transform your eye for design. Learn color theory, typography rhythms, spatial systems, and how to craft pixel-perfect user interfaces using Figma and standard web technologies.",
        thumbnail_url: "https://images.unsplash.com/photo-1561070791-2526d30994b5?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
        instructor_name: "Marcus Aurelius",
        instructor_avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80",
        modules: [
            {
                title: "1. Visual Hierarchy & Spatial Systems",
                description: "Control where the user looks through scale and white space.",
                lessons: [
                    {
                        title: "The Rules of Contrast",
                        description: "Making elements pop while maintaining accessibility.",
                        video_url: "https://www.youtube.com/watch?v=l-vE5j5yZRE",
                        video_type: "youtube",
                        duration: 415,
                        notes: "## Golden Rule\nIf everything is important, nothing is important.\n\n### Practice:\nTry stripping all color from your design (grayscale test). Can you still tell what the primary action is?"
                    }
                ]
            }
        ]
    },
    {
        title: "Python for Data Science & AI",
        description: "From basic Python syntax to training powerful Machine Learning models. Master Pandas, NumPy, Scikit-Learn, and dive into the mathematical intuition behind modern AI.",
        thumbnail_url: "https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
        instructor_name: "Dr. Elena Rostova",
        instructor_avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80",
        modules: [
            {
                title: "1. Data Manipulation with Pandas",
                description: "The core dataframe library.",
                lessons: [
                    {
                        title: "DataFrames and Series",
                        description: "Basic data structures in Pandas.",
                        video_url: "https://www.youtube.com/watch?v=zmdjNSmRXF4",
                        video_type: "youtube",
                        duration: 900,
                        notes: "```python\nimport pandas as pd\ndf = pd.read_csv('data.csv')\ndf.head()\n```"
                    }
                ]
            }
        ]
    }
];

export default function PremiumSeedPage() {
    const [loading, setLoading] = useState(false);
    const [log, setLog] = useState<string[]>([]);

    const addLog = (msg: string) => setLog(prev => [...prev, msg]);

    const seedPremiumContent = async () => {
        setLoading(true);
        setLog([]);
        try {
            addLog("Starting Premium Course DB Seed...");

            for (const courseData of PREMIUM_COURSES) {
                addLog(`Creating Course: ${courseData.title}`);

                // Create Course
                const courseRef = doc(collection(db, "courses"));
                await setDoc(courseRef, {
                    id: courseRef.id,
                    title: courseData.title,
                    description: courseData.description,
                    thumbnail_url: courseData.thumbnail_url,
                    instructor_name: courseData.instructor_name,
                    instructor_avatar: courseData.instructor_avatar,
                    is_published: true,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                });

                let moduleIndex = 0;
                for (const moduleData of courseData.modules) {
                    addLog(`  + Module: ${moduleData.title}`);
                    const modRef = doc(collection(db, "modules"));
                    await setDoc(modRef, {
                        id: modRef.id,
                        course_id: courseRef.id,
                        title: moduleData.title,
                        description: moduleData.description,
                        order_index: moduleIndex++,
                        created_at: new Date().toISOString()
                    });

                    let lessonIndex = 0;
                    for (const lessonData of moduleData.lessons) {
                        addLog(`    - Lesson: ${lessonData.title}`);
                        const lessRef = doc(collection(db, "lessons"));
                        await setDoc(lessRef, {
                            id: lessRef.id,
                            module_id: modRef.id,
                            course_id: courseRef.id,
                            title: lessonData.title,
                            description: lessonData.description,
                            video_url: lessonData.video_url,
                            video_type: lessonData.video_type,
                            duration_seconds: lessonData.duration,
                            notes: lessonData.notes || "",
                            resources: [],
                            order_index: lessonIndex++,
                            created_at: new Date().toISOString()
                        });
                    }
                }
            }

            addLog("✅ Successfully seeded all premium courses!");
            toast.success("Premium demo courses added successfully!");
        } catch (error: any) {
            console.error(error);
            addLog(`❌ Error: ${error.message}`);
            toast.error("Failed to seed premium content");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ minHeight: "100vh", background: "var(--bg-primary)", padding: "40px 20px" }}>
            <div style={{ maxWidth: 640, margin: "0 auto" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
                    <div style={{ width: 48, height: 48, borderRadius: 12, background: "rgba(201,168,76,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <BookOpen size={24} color="#c9a84c" />
                    </div>
                    <div>
                        <h1 style={{ fontSize: 24, fontWeight: 700, color: "var(--text-primary)" }}>Premium Content Seeder</h1>
                        <p style={{ color: "var(--text-muted)", fontSize: 14 }}>Populate your database with rich demo courses.</p>
                    </div>
                </div>

                <div className="card" style={{ padding: 24, marginBottom: 24, border: "1px solid rgba(248,113,113,0.3)", background: "rgba(248,113,113,0.05)" }}>
                    <div style={{ display: "flex", gap: 12 }}>
                        <AlertCircle size={20} color="#f87171" style={{ flexShrink: 0 }} />
                        <div>
                            <h3 style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)", marginBottom: 4 }}>Warning: Production Databse</h3>
                            <p style={{ color: "var(--text-secondary)", fontSize: 13, lineHeight: 1.6 }}>
                                This will add 3 brand new, highly polished premium courses to your live Firebase database immediately.
                                These courses include YouTube video embeds, markdown notes, thumbnail images, and proper module structures.
                            </p>
                        </div>
                    </div>
                </div>

                <button
                    onClick={seedPremiumContent}
                    disabled={loading}
                    className="btn-primary"
                    style={{ width: "100%", padding: "14px", fontSize: 15, fontWeight: 600, justifyContent: "center", marginBottom: 24 }}
                >
                    {loading ? "Injecting Data to Firebase..." : "Inject Premium Demo Courses"}
                </button>

                {log.length > 0 && (
                    <div className="card" style={{ padding: 16, background: "#0a0a0a", border: "1px solid #333" }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: "#888", marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.05em" }}>Execution Logs</div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 300, overflowY: "auto", fontFamily: "monospace" }}>
                            {log.map((l, i) => (
                                <div key={i} style={{ fontSize: 13, color: l.includes("Error") ? "#f87171" : l.includes("✅") ? "#4ade80" : "#d4d4d8", display: "flex", alignItems: "flex-start", gap: 8 }}>
                                    {l.includes("Course:") && <CheckCircle size={14} color="#c9a84c" style={{ marginTop: 2, flexShrink: 0 }} />}
                                    {l}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
