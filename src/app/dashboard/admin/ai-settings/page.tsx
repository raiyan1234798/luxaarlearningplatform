"use client";

import { useAuth } from "@/lib/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import LuxaarLoader from "@/components/ui/LuxaarLoader";
import AISettingsClient from "@/components/admin/AISettingsClient";

export default function AdminAISettingsPage() {
    const { user, profile, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && (!user || profile?.role !== "admin")) {
            router.push("/dashboard");
        }
    }, [user, profile, loading, router]);

    if (loading || !profile || profile.role !== "admin") {
        return <LuxaarLoader />;
    }

    return <AISettingsClient />;
}
