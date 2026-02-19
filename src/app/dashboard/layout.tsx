"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/contexts/AuthContext";
import AppShell from "@/components/layout/AppShell";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { user, profile, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && !user) {
            router.push("/login");
        } else if (!loading && profile) {
            if (profile.status === "pending") {
                router.push("/pending");
            } else if (profile.status === "rejected") {
                router.push("/rejected");
            }
        }
    }, [user, profile, loading, router]);

    if (loading) {
        return (
            <div style={{
                height: "100vh",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "var(--bg-primary)",
                color: "var(--text-primary)"
            }}>
                Loading...
            </div>
        );
    }

    if (!user || !profile) return null;

    return <AppShell profile={profile}>{children}</AppShell>;
}
