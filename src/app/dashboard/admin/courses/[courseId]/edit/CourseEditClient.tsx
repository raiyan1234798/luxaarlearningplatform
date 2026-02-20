"use client";

import { useAuth } from "@/lib/contexts/AuthContext";
import CourseFormClient from "@/components/admin/CourseFormClient";
import { notFound, useRouter } from "next/navigation";
import { useEffect, useState, use } from "react";
import { doc, getDoc, collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import LuxaarLoader from "@/components/ui/LuxaarLoader";

export default function CourseEditClient({
    params,
}: {
    params: Promise<{ courseId: string }>;
}) {
    const { courseId } = use(params);
    const { user, profile, loading } = useAuth();
    const router = useRouter();
    const [course, setCourse] = useState<any>(null);
    const [courseLoading, setCourseLoading] = useState(true);
    const [notFoundFlag, setNotFoundFlag] = useState(false);

    useEffect(() => {
        if (!loading && profile && profile.role !== "admin") {
            router.push("/dashboard");
        }
    }, [loading, profile, router]);

    useEffect(() => {
        async function fetchCourse() {
            if (!courseId || !user || !profile || profile.role !== "admin") return;
            try {
                // Fetch course document
                const courseRef = doc(db, "courses", courseId);
                const courseSnap = await getDoc(courseRef);
                if (!courseSnap.exists()) {
                    setNotFoundFlag(true);
                    setCourseLoading(false);
                    return;
                }
                const courseData = { id: courseSnap.id, ...courseSnap.data() };

                // Fetch modules for this course
                const modulesRef = collection(db, "modules");
                const modulesQ = query(modulesRef, where("course_id", "==", courseId));
                const modulesSnap = await getDocs(modulesQ);
                const modules: any[] = [];
                modulesSnap.forEach((doc) => {
                    modules.push({ id: doc.id, ...doc.data() });
                });

                // For each module, fetch lessons
                for (const mod of modules) {
                    const lessonsRef = collection(db, "lessons");
                    const lessonsQ = query(lessonsRef, where("module_id", "==", mod.id));
                    const lessonsSnap = await getDocs(lessonsQ);
                    const lessons: any[] = [];
                    lessonsSnap.forEach((doc) => {
                        lessons.push({ id: doc.id, ...doc.data() });
                    });
                    mod.lessons = lessons.sort((a, b) => a.order_index - b.order_index);
                }

                modules.sort((a, b) => a.order_index - b.order_index);

                setCourse({ ...courseData, modules });
            } catch (error) {
                console.error("Error fetching course:", error);
                setNotFoundFlag(true);
            } finally {
                setCourseLoading(false);
            }
        }

        if (user && profile && profile.role === "admin") {
            fetchCourse();
        }
    }, [courseId, user, profile]);

    if (!user || !profile || profile.role !== "admin") return null;

    if (courseLoading) {
        return <LuxaarLoader text="Loading course..." />;
    }

    if (notFoundFlag) {
        notFound();
    }

    return (
        <CourseFormClient
            mode="edit"
            userId={user.uid}
            initialCourse={course}
        />
    );
}
