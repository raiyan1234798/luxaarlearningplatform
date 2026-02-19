"use client";

import { useAuth } from "@/lib/contexts/AuthContext";
import AnalyticsClient from "@/components/admin/AnalyticsClient";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function AnalyticsPage() {
    const { user, profile, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && profile && profile.role !== "admin") {
            router.push("/dashboard");
        }
    }, [loading, profile, router]);

    if (!user || !profile || profile.role !== "admin") return null;

    return (
        <AnalyticsClient
            stats={{
                totalUsers: 2,
                approvedUsers: 1,
                pendingUsers: 1,
                totalCourses: 1,
                publishedCourses: 1,
                totalEnrollments: 0,
                totalLessons: 10,
            }}
            recentEnrollments={[]}
        />
    );
}
