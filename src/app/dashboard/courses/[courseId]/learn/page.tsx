"use client";

import { useAuth } from "@/lib/contexts/AuthContext";
import LearnPageClient from "@/components/courses/LearnPageClient";
import { MOCK_COURSES, MOCK_MODULES } from "@/lib/mockData";
import { notFound, useSearchParams } from "next/navigation";
import { use } from "react";

export default function LearnPage({
    params,
    searchParams,
}: {
    params: Promise<{ courseId: string }>;
    searchParams: Promise<{ lesson?: string }>;
}) {
    const { courseId } = use(params);
    const resolvedSearchParams = use(searchParams);
    const lessonId = resolvedSearchParams?.lesson;
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
        <LearnPageClient
            course={course as any}
            initialLessonId={lessonId}
            progress={[]} // Mock: no progress
            userId={user.uid}
            userEmail={profile.email}
        />
    );
}
