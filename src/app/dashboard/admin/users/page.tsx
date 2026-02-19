"use client";

import { useAuth } from "@/lib/contexts/AuthContext";
import AdminUsersClient from "@/components/admin/AdminUsersClient";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function AdminUsersPage() {
    const { user, profile, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && profile && profile.role !== "admin") {
            router.push("/dashboard");
        }
    }, [loading, profile, router]);

    if (!user || !profile || profile.role !== "admin") return null;

    return <AdminUsersClient users={[]} />;
}
