"use client";

import { useState } from "react";
import { db } from "@/lib/firebase/client";
import { collection, getDocs, addDoc, doc, setDoc, query, where } from "firebase/firestore";
import { toast } from "react-hot-toast";
import { Lesson, Module, Course } from "@/types";

export default function SeedPage() {
    const [loading, setLoading] = useState(false);
    const [log, setLog] = useState<string[]>([]);

    const addLog = (msg: string) => setLog(prev => [...prev, msg]);

    const seedContent = async () => {
        setLoading(true);
        setLog([]);
        try {
            addLog("Fetching courses...");
            const coursesRef = collection(db, "courses");
            const snapshot = await getDocs(coursesRef);

            if (snapshot.empty) {
                addLog("No courses found!");
                toast.error("No courses found to add content to.");
                setLoading(false);
                return;
            }

            for (const docSnap of snapshot.docs) {
                addLog(`Processing course: ${docSnap.data().title}`);
                await addModulesAndLessons(docSnap.id);
            }

            addLog("Done! Content added.");
            toast.success("Content added successfully!");
        } catch (error) {
            console.error(error);
            addLog(`Error: ${error}`);
            toast.error("Failed to seed content");
        } finally {
            setLoading(false);
        }
    };

    const addModulesAndLessons = async (courseId: string) => {
        // ALWAYS create a new module for workflow testing
        const newModRef = doc(collection(db, "modules"));
        const moduleTitle = `Workflow Check - ${new Date().toLocaleTimeString()}`;

        addLog(`  + Creating new module: ${moduleTitle}`);

        const newMod: Module = {
            id: newModRef.id,
            course_id: courseId,
            title: moduleTitle,
            description: "Module specifically for verifying video playback, links, and images workflow.",
            order_index: 999, // Ensure it's last
            created_at: new Date().toISOString(),
        };
        await setDoc(newModRef, newMod);

        const samples = [
            {
                title: "1. YouTube Test (Sequential Lock)",
                video_url: "https://www.youtube.com/watch?v=LXb3EKWsInQ",
                video_type: "youtube",
                duration: 60, // Short duration for testing
                notes: "# YouTube Test\nThis video should:\n- Be trackable\n- Prevent skipping\n- Unlock the next lesson when finished\n\n![Sample Image](https://images.unsplash.com/photo-1542831371-29b0f74f9713?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80)\n\n[External Link Test](https://google.com)",
                resources: [
                    { name: "Test PDF Link", url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf", type: "PDF" }
                ]
            },
            {
                title: "2. Loom/Drive Test (Fallback Player)",
                video_url: "https://www.loom.com/share/255b9a89765243889146522c15981446",
                video_type: "loom", // Intentionally test fallback type
                duration: 120,
                notes: "This video uses the iframe fallback player. The 'Mark Complete' button should be clickable immediately.",
                resources: []
            },
            {
                title: "3. Vimeo Test (Strict Tracking)",
                video_url: "https://vimeo.com/76979871",
                video_type: "vimeo",
                duration: 60,
                notes: "Vimeo player test. Similar to YouTube.",
                resources: [
                    { name: "Source Code", url: "https://github.com/example/repo", type: "Link" }
                ]
            }
        ];

        let index = 0;
        for (const s of samples) {
            const lRef = doc(collection(db, "lessons"));
            const lesson: Lesson = {
                id: lRef.id,
                module_id: newModRef.id,
                course_id: courseId,
                title: s.title,
                description: "Workflow test lesson.",
                video_url: s.video_url,
                video_type: s.video_type as any,
                notes: s.notes,
                resources: s.resources,
                duration_seconds: s.duration,
                order_index: index++,
                created_at: new Date().toISOString(),
            };
            await setDoc(lRef, lesson);
            addLog(`    + Added lesson: ${s.title}`);
        }
    };

    return (
        <div className="p-10 max-w-2xl mx-auto">
            <h1 className="text-2xl font-bold mb-4">Content Seeder (Force Add)</h1>
            <p className="mb-6 text-gray-600">
                This version will ALWAYS add a new "Workflow Check" module with 3 test lessons to EVERY course.
            </p>

            <button
                id="seed-btn"
                onClick={seedContent}
                disabled={loading}
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 disabled:opacity-50"
            >
                {loading ? "Seeding..." : "Force Add Content"}
            </button>

            <div className="mt-8 bg-gray-100 p-4 rounded h-64 overflow-y-auto font-mono text-sm">
                {log.length === 0 ? <span className="text-gray-400">waiting...</span> : log.map((l, i) => (
                    <div key={i}>{l}</div>
                ))}
            </div>
        </div>
    );
}
