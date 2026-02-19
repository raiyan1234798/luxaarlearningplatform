"use client";

import { useAuth } from "@/lib/contexts/AuthContext";
import MyCourseClient from "@/components/courses/MyCourseClient";

export default function MyCoursesPage() {
    const { user } = useAuth();
    if (!user) return null;

    return <MyCourseClient enrollments={[]} />;
}
