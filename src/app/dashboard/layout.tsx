"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/contexts/AuthContext";
import AppShell from "@/components/layout/AppShell";
import LuxaarLoader from "@/components/ui/LuxaarLoader";
import SupportWidget from "@/components/common/SupportWidget";

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
            if (profile.role === "admin") {
                // do nothing, let them pass
            } else if (profile.status === "pending") {
                router.push("/pending");
            } else if (profile.status === "rejected") {
                router.push("/rejected");
            }
        }
    }, [user, profile, loading, router]);

    if (loading) {
        return (
            <>
                <div className="sidebar" style={{ display: "none" }} />
                <LuxaarLoader fullScreen text="Preparing your dashboard..." />
            </>
        );
    }

    if (!user || !profile) return null;

    return (
        <AppShell profile={profile}>
            {children}
            <SupportWidget />
        </AppShell>
    );
}
