"use client";

import { useAuth } from "@/lib/contexts/AuthContext";
import CourseFormClient from "@/components/admin/CourseFormClient";
import { MOCK_COURSES, MOCK_MODULES } from "@/lib/mockData";
import { notFound, useRouter } from "next/navigation";
import { useEffect, use } from "react";

export default function CourseEditClient({
    params,
}: {
    params: Promise<{ courseId: string }>;
}) {
    const { courseId } = use(params);
    const { user, profile, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && profile && profile.role !== "admin") {
            router.push("/dashboard");
        }
    }, [loading, profile, router]);

    if (!user || !profile || profile.role !== "admin") return null;

    const courseData = MOCK_COURSES.find((c) => c.id === courseId);

    if (!courseData) notFound();

    // Enrich course with modules
    const course = {
        ...courseData,
        modules: MOCK_MODULES.filter(m => m.course_id === courseId)
    };

    return (
        <CourseFormClient
            mode="edit"
            userId={user.uid}
            initialCourse={course as any}
        />
    );
}
