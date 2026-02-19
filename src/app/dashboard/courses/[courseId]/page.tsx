"use client";

import { useAuth } from "@/lib/contexts/AuthContext";
import CourseDetailClient from "@/components/courses/CourseDetailClient";
import { MOCK_COURSES, MOCK_MODULES } from "@/lib/mockData";
import { notFound } from "next/navigation";
import { use } from "react";

export default function CourseDetailPage({
    params,
}: {
    params: Promise<{ courseId: string }>;
}) {
    const { courseId } = use(params);
    const { user, profile } = useAuth();

    if (!user || !profile) return null;

    const courseData = MOCK_COURSES.find((c) => c.id === courseId);

    if (!courseData) notFound();

    // Enrich course with modules
    const course = {
        ...courseData,
        modules: MOCK_MODULES.filter(m => m.course_id === courseId)
    };

    return (
        <CourseDetailClient
            course={course as any}
            enrollment={null} // Mock: not enrolled
            userId={user.uid}
            isAdmin={profile?.role === "admin"}
        />
    );
}
