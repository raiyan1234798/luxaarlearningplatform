"use client";

import { useAuth } from "@/lib/contexts/AuthContext";
import CoursesPageClient from "@/components/courses/CoursesPageClient";
import { MOCK_COURSES } from "@/lib/mockData";

export default function CoursesPage() {
    // Auth is handled by DashboardLayout
    const { user, profile } = useAuth();

    if (!user || !profile) return null;

    return (
        <CoursesPageClient
            courses={MOCK_COURSES as any[]}
            enrolledIds={[]} // Mock: not enrolled in any by default
        />
    );
}
