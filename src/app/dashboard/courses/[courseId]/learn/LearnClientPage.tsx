"use client";

import { useAuth } from "@/lib/contexts/AuthContext";
import LearnPageClient from "@/components/courses/LearnPageClient";
import { MOCK_COURSES, MOCK_MODULES } from "@/lib/mockData";
import { notFound, useSearchParams, useRouter } from "next/navigation";
import { use, useEffect, useState, Suspense } from "react";
import { collection, getDocs, query, where, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { Lock, ArrowLeft } from "lucide-react";
import Link from "next/link";
import LuxaarLoader from "@/components/ui/LuxaarLoader";

function LearnPageContent({
    params,
}: {
    params: Promise<{ courseId: string }>;
}) {
    const { courseId } = use(params);
    const searchParams = useSearchParams();
    const lessonId = searchParams.get("lesson") || undefined;
    const { user, profile } = useAuth();
    const router = useRouter();
    const [hasAccess, setHasAccess] = useState<boolean | null>(null);
    const [progress, setProgress] = useState<any[]>([]);
    const [courseData, setCourseData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchAll() {
            if (!user || !profile) return;

            try {
                // 1. Check Access
                let accessGranted = false;
                if (profile.role === "admin") {
                    accessGranted = true;
                } else {
                    const enrollmentsRef = collection(db, "enrollments");
                    const q = query(
                        enrollmentsRef,
                        where("user_id", "==", user.uid),
                        where("course_id", "==", courseId)
                    );
                    const snap = await getDocs(q);
                    accessGranted = !snap.empty;
                }
                setHasAccess(accessGranted);

                // 2. Fetch Progress
                const progressRef = collection(db, "lesson_progress");
                const qProgress = query(
                    progressRef,
                    where("user_id", "==", user.uid),
                    where("course_id", "==", courseId)
                );
                const progressSnap = await getDocs(qProgress);
                const p: any[] = [];
                progressSnap.forEach((doc) => p.push(doc.data()));
                setProgress(p);

                // 3. Fetch Course Content (Firestore -> Mock Fallback)
                const courseDocRef = doc(db, "courses", courseId);
                const courseDoc = await getDoc(courseDocRef);

                if (courseDoc.exists()) {
                    const cData = courseDoc.data();

                    // Fetch Modules
                    const modulesQ = query(collection(db, "modules"), where("course_id", "==", courseId));
                    const modulesSnap = await getDocs(modulesQ);
                    const modules = modulesSnap.docs.map(d => ({ id: d.id, ...d.data(), lessons: [] as any[] }));

                    // Fetch Lessons
                    const lessonsQ = query(collection(db, "lessons"), where("course_id", "==", courseId));
                    const lessonsSnap = await getDocs(lessonsQ);
                    const lessons = lessonsSnap.docs.map(d => ({ id: d.id, ...d.data() })) as any[];

                    // Assemble
                    modules.forEach(m => {
                        m.lessons = lessons
                            .filter((l: any) => l.module_id === m.id)
                            .sort((a: any, b: any) => (a.order_index || 0) - (b.order_index || 0));
                    });
                    modules.sort((a: any, b: any) => (a.order_index || 0) - (b.order_index || 0));

                    setCourseData({ ...cData, id: courseDoc.id, modules });
                } else {
                    // Fallback to MOCK
                    const mockC = MOCK_COURSES.find(c => c.id === courseId);
                    if (mockC) {
                        setCourseData({
                            ...mockC,
                            modules: MOCK_MODULES.filter(m => m.course_id === courseId)
                        });
                    } else {
                        setCourseData(null);
                    }
                }

            } catch (e) {
                console.error("Error fetching data:", e);
                // Even on error, we stop loading
            } finally {
                setLoading(false);
            }
        }

        fetchAll();
    }, [user, profile, courseId]);

    if (!user || !profile) return null;

    if (loading) {
        return <LuxaarLoader text="Loading course..." />;
    }

    if (!courseData) {
        notFound();
    }

    // No access
    if (!hasAccess) {
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
                    padding: 20,
                }}
            >
                <div
                    style={{
                        width: 64,
                        height: 64,
                        borderRadius: 16,
                        background: "rgba(248,113,113,0.1)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        marginBottom: 8,
                    }}
                >
                    <Lock size={28} color="#f87171" />
                </div>
                <h2 style={{ fontSize: 20, fontWeight: 700, color: "var(--text-primary)" }}>
                    Access Required
                </h2>
                <p style={{ color: "var(--text-muted)", fontSize: 14, maxWidth: 400 }}>
                    You need approved access to view this course content.
                    Request access from the course page and wait for admin approval.
                </p>
                <Link href={`/dashboard/courses/${courseId}`}>
                    <button className="btn-primary" style={{ marginTop: 8, fontSize: 13 }}>
                        <ArrowLeft size={15} />
                        Go to Course Page
                    </button>
                </Link>
            </div>
        );
    }

    return (
        <LearnPageClient
            course={courseData}
            initialLessonId={lessonId}
            progress={progress}
            userId={user.uid}
            userEmail={profile.email}
        />
    );
}

export default function LearnClientPage({
    params,
}: {
    params: Promise<{ courseId: string }>;
}) {
    return (
        <Suspense fallback={<div>Loading course content...</div>}>
            <LearnPageContent params={params} />
        </Suspense>
    );
}
