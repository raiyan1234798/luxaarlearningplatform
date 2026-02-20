"use client";

import { useAuth } from "@/lib/contexts/AuthContext";
import MyCourseClient from "@/components/courses/MyCourseClient";
import { useEffect, useState } from "react";
import { collection, getDocs, query, where, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import type { Course, Enrollment } from "@/types";

import LuxaarLoader from "@/components/ui/LuxaarLoader";

export default function MyCoursesPage() {
    const { user, profile } = useAuth();
    const [enrollments, setEnrollments] = useState<
        Array<{
            id: string;
            enrolled_at: string;
            completed_at: string | null;
            progress_percentage: number;
            course: Course;
        }>
    >([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchEnrollments() {
            if (!user) return;

            try {
                // 1. Fetch all enrollments for this user
                const enrollmentsRef = collection(db, "enrollments");
                const q = query(
                    enrollmentsRef,
                    where("user_id", "==", user.uid),
                    orderBy("enrolled_at", "desc")
                );
                const enrollSnap = await getDocs(q);
                const enrollmentDocs: Enrollment[] = [];
                enrollSnap.forEach((doc) => {
                    enrollmentDocs.push({ id: doc.id, ...doc.data() } as Enrollment);
                });

                // 2. Fetch all courses from Firestore
                let allCourses: Course[] = [];
                try {
                    const coursesRef = collection(db, "courses");
                    const coursesSnap = await getDocs(coursesRef);
                    coursesSnap.forEach((doc) => {
                        allCourses.push({ id: doc.id, ...doc.data() } as Course);
                    });
                } catch {
                    // fallback
                }

                const courseMap = new Map<string, Course>();
                allCourses.forEach((c) => courseMap.set(c.id, c));

                // 4. Match enrollments to courses
                const enrichedEnrollments = enrollmentDocs
                    .map((enrollment) => {
                        const course = courseMap.get(enrollment.course_id);
                        if (!course) {
                            // If course not found by ID, try building a placeholder from enrollment data
                            if (enrollment.course_title) {
                                return {
                                    id: enrollment.id,
                                    enrolled_at: enrollment.enrolled_at,
                                    completed_at: enrollment.completed_at,
                                    progress_percentage: enrollment.progress_percentage,
                                    course: {
                                        id: enrollment.course_id,
                                        title: enrollment.course_title,
                                        description: "Enrolled course",
                                        thumbnail_url: null,
                                        instructor_name: "Instructor",
                                        instructor_avatar: null,
                                        tags: [],
                                        difficulty: "beginner" as const,
                                        is_published: true,
                                        is_featured: false,
                                        created_by: "",
                                        created_at: enrollment.enrolled_at,
                                        updated_at: enrollment.enrolled_at,
                                    } as Course,
                                };
                            }
                            return null;
                        }
                        return {
                            id: enrollment.id,
                            enrolled_at: enrollment.enrolled_at,
                            completed_at: enrollment.completed_at,
                            progress_percentage: enrollment.progress_percentage,
                            course,
                        };
                    })
                    .filter(Boolean) as Array<{
                        id: string;
                        enrolled_at: string;
                        completed_at: string | null;
                        progress_percentage: number;
                        course: Course;
                    }>;

                setEnrollments(enrichedEnrollments);
            } catch (error) {
                console.error("Error fetching enrollments:", error);
            } finally {
                setLoading(false);
            }
        }

        if (user) {
            fetchEnrollments();
        }
    }, [user]);

    if (!user || !profile) return null;

    if (loading) {
        return <LuxaarLoader text="Loading your courses..." />;
    }

    return <MyCourseClient enrollments={enrollments} />;
}
