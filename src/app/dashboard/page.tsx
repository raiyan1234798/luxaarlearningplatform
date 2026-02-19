"use client";

import { useAuth } from "@/lib/contexts/AuthContext";
import StudentDashboard from "@/components/dashboard/StudentDashboard";
import AdminDashboard from "@/components/dashboard/AdminDashboard";

export default function DashboardPage() {
    const { user, profile } = useAuth();

    if (!user || !profile) return null; // Loading state handled by layout

    if (profile.role === "admin") {
        return (
            <AdminDashboard
                stats={{
                    totalUsers: 1, // Placeholder
                    approvedUsers: 1,
                    pendingUsers: 0,
                    totalCourses: 0,
                    publishedCourses: 0,
                    totalEnrollments: 0,
                    totalLessons: 0,
                }}
                recentUsers={[]}
                recentCourses={[]}
                profile={profile}
            />
        );
    }

    return (
        <StudentDashboard
            profile={profile}
            enrollments={[]}
            featuredCourses={[]}
        />
    );
}
