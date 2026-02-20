"use client";

import { useAuth } from "@/lib/contexts/AuthContext";
import AdminCoursesClient from "@/components/admin/AdminCoursesClient";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import type { Course } from "@/types";
import LuxaarLoader from "@/components/ui/LuxaarLoader";

export default function AdminCoursesPage() {
    const { user, profile, loading } = useAuth();
    const router = useRouter();
    const [courses, setCourses] = useState<Course[]>([]);
    const [coursesLoading, setCoursesLoading] = useState(true);

    useEffect(() => {
        if (!loading && profile && profile.role !== "admin") {
            router.push("/dashboard");
        }
    }, [loading, profile, router]);

    useEffect(() => {
        async function fetchCourses() {
            if (!user || !profile || profile.role !== "admin") return;
            try {
                const coursesRef = collection(db, "courses");
                const q = query(coursesRef, orderBy("created_at", "desc"));
                const snap = await getDocs(q);
                const list: Course[] = [];
                snap.forEach((doc) => {
                    list.push({ id: doc.id, ...doc.data() } as Course);
                });
                setCourses(list);
            } catch (error) {
                console.error("Error fetching courses:", error);
            } finally {
                setCoursesLoading(false);
            }
        }

        if (user && profile && profile.role === "admin") {
            fetchCourses();
        }
    }, [user, profile]);

    if (!user || !profile || profile.role !== "admin") return null;

    if (coursesLoading) {
        return <LuxaarLoader text="Loading courses..." />;
    }

    return <AdminCoursesClient courses={courses} />;
}
