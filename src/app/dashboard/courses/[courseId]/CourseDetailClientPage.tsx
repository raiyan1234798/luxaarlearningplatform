"use client";

import { useAuth } from "@/lib/contexts/AuthContext";
import CourseDetailClient from "@/components/courses/CourseDetailClient";
import { MOCK_COURSES, MOCK_MODULES } from "@/lib/mockData";
import { notFound } from "next/navigation";
import { use, useEffect, useState } from "react";
import { collection, getDocs, query, where, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import type { Course, Enrollment } from "@/types";
import LuxaarLoader from "@/components/ui/LuxaarLoader";

export default function CourseDetailClientPage({
    params,
}: {
    params: Promise<{ courseId: string }>;
}) {
    const { courseId } = use(params);
    const { user, profile } = useAuth();
    const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
    const [checkingEnrollment, setCheckingEnrollment] = useState(true);
    const [firestoreCourse, setFirestoreCourse] = useState<Course | null>(null);
    const [loadingCourse, setLoadingCourse] = useState(true);

    useEffect(() => {
        async function checkEnrollment() {
            if (!user) {
                setCheckingEnrollment(false);
                return;
            }
            try {
                const enrollmentsRef = collection(db, "enrollments");
                const q = query(
                    enrollmentsRef,
                    where("user_id", "==", user.uid),
                    where("course_id", "==", courseId)
                );
                const snap = await getDocs(q);
                if (!snap.empty) {
                    const enrollData = snap.docs[0].data();
                    setEnrollment({
                        id: snap.docs[0].id,
                        user_id: enrollData.user_id,
                        course_id: enrollData.course_id,
                        enrolled_at: enrollData.enrolled_at,
                        completed_at: enrollData.completed_at,
                        progress_percentage: enrollData.progress_percentage || 0,
                        certificate_issued: enrollData.certificate_issued || false,
                    });
                }
            } catch (e) {
                console.error("Error checking enrollment:", e);
            }
            setCheckingEnrollment(false);
        }

        async function fetchFirestoreCourse() {
            setLoadingCourse(true);
            try {
                const docRef = doc(db, "courses", courseId);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    const cData = docSnap.data();

                    // Fetch Modules
                    const modulesQ = query(collection(db, "modules"), where("course_id", "==", courseId));
                    const modulesSnap = await getDocs(modulesQ);
                    const modules = modulesSnap.docs.map(d => ({ id: d.id, ...d.data(), lessons: [] as any[] }));

                    // Fetch Lessons
                    const lessonsQ = query(collection(db, "lessons"), where("course_id", "==", courseId));
                    const lessonsSnap = await getDocs(lessonsQ);
                    const lessons = lessonsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

                    // Assemble
                    modules.forEach(m => {
                        m.lessons = lessons
                            .filter((l: any) => l.module_id === m.id)
                            .sort((a: any, b: any) => (a.order_index || 0) - (b.order_index || 0));
                    });
                    modules.sort((a: any, b: any) => (a.order_index || 0) - (b.order_index || 0));

                    setFirestoreCourse({ ...cData, id: docSnap.id, modules: modules as any[] } as Course);
                } else {
                    // Check mock
                    const mock = MOCK_COURSES.find(c => c.id === courseId);
                    if (mock) {
                        setFirestoreCourse({
                            ...mock,
                            modules: MOCK_MODULES.filter(m => m.course_id === courseId) as any[]
                        } as unknown as Course);
                    }
                }
            } catch (e) {
                console.error("Error fetching course:", e);
            } finally {
                setLoadingCourse(false);
            }
        }

        if (user) {
            checkEnrollment();
        } else {
            setCheckingEnrollment(false);
        }
        fetchFirestoreCourse();
    }, [user, courseId]);

    if (!profile && !user) return <LuxaarLoader text="Loading..." size="sm" />;

    if (checkingEnrollment || loadingCourse) {
        return <LuxaarLoader text="Loading course..." size="sm" />;
    }

    const course = firestoreCourse;
    if (!course) notFound();

    return (
        <CourseDetailClient
            course={course as any}
            enrollment={enrollment}
            userId={user ? user.uid : ""}
            isAdmin={profile?.role === "admin"}
        />
    );
}
