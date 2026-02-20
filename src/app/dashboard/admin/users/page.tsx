"use client";

import { useAuth } from "@/lib/contexts/AuthContext";
import AdminUsersClient from "@/components/admin/AdminUsersClient";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import type { Profile } from "@/types";
import LuxaarLoader from "@/components/ui/LuxaarLoader";

export default function AdminUsersPage() {
    const { user, profile, loading } = useAuth();
    const router = useRouter();
    const [users, setUsers] = useState<Profile[]>([]);
    const [fetching, setFetching] = useState(true);

    useEffect(() => {
        if (!loading && profile && profile.role !== "admin") {
            router.push("/dashboard");
        }
    }, [loading, profile, router]);

    useEffect(() => {
        async function fetchUsers() {
            try {
                const usersRef = collection(db, "users");
                const q = query(usersRef, orderBy("created_at", "desc"));
                const snapshot = await getDocs(q);
                const usersList: Profile[] = [];
                snapshot.forEach((doc) => {
                    usersList.push(doc.data() as Profile);
                });
                setUsers(usersList);
            } catch (error) {
                console.error("Error fetching users:", error);
            } finally {
                setFetching(false);
            }
        }

        if (user && profile?.role === "admin") {
            fetchUsers();
        }
    }, [user, profile]);

    if (!user || !profile || profile.role !== "admin") return null;

    if (fetching) {
        return <LuxaarLoader text="Loading users..." />;
    }

    return <AdminUsersClient users={users} />;
}
