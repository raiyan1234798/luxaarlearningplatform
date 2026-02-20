"use client";

import { useAuth } from "@/lib/contexts/AuthContext";
import CoursesPageClient from "@/components/courses/CoursesPageClient";
import { useEffect, useState } from "react";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import type { Course } from "@/types";
import LuxaarLoader from "@/components/ui/LuxaarLoader";

export default function CoursesPage() {
    const { user, profile } = useAuth();
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchCourses() {
            try {
                const coursesRef = collection(db, "courses");
                const coursesSnap = await getDocs(query(coursesRef, orderBy("created_at", "desc")));
                const coursesList: Course[] = [];
                coursesSnap.forEach((doc) => {
                    coursesList.push({ id: doc.id, ...doc.data() } as Course);
                });

                if (coursesList.length > 0) {
                    setCourses(coursesList);
                }
            } catch (error) {
                console.error("Error fetching courses:", error);
            } finally {
                setLoading(false);
            }
        }

        if (user && profile) {
            fetchCourses();
        }
    }, [user, profile]);

    if (!user || !profile) return null;

    if (loading) {
        return <LuxaarLoader text="Loading courses..." />;
    }

    return (
        <CoursesPageClient
            courses={courses}
            enrolledIds={[]}
        />
    );
}
