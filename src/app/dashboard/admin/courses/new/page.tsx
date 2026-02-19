"use client";

import { useAuth } from "@/lib/contexts/AuthContext";
import CourseFormClient from "@/components/admin/CourseFormClient";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function NewCoursePage() {
    const { user, profile, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && profile && profile.role !== "admin") {
            router.push("/dashboard");
        }
    }, [loading, profile, router]);

    if (!user || !profile || profile.role !== "admin") return null;

    return <CourseFormClient mode="create" userId={user.uid} />;
}
