"use client";

import { useAuth } from "@/lib/contexts/AuthContext";
import AdminCoursesClient from "@/components/admin/AdminCoursesClient";
import { MOCK_COURSES } from "@/lib/mockData";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function AdminCoursesPage() {
    const { user, profile, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && profile && profile.role !== "admin") {
            router.push("/dashboard");
        }
    }, [loading, profile, router]);

    if (!user || !profile || profile.role !== "admin") return null;

    return <AdminCoursesClient courses={MOCK_COURSES as any[]} />;
}
