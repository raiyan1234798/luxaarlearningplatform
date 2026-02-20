"use client";

import { useAuth } from "@/lib/contexts/AuthContext";
import StudentDashboard from "@/components/dashboard/StudentDashboard";
import AdminDashboard from "@/components/dashboard/AdminDashboard";
import { useEffect, useState } from "react";
import { collection, getDocs, query, orderBy, where } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import type { Profile, DashboardStats, Course, CourseAccessRequest, Enrollment } from "@/types";
import LuxaarLoader from "@/components/ui/LuxaarLoader";

export default function DashboardPage() {
    const { user, profile } = useAuth();
    const [stats, setStats] = useState<DashboardStats>({
        totalUsers: 0,
        approvedUsers: 0,
        pendingUsers: 0,
        totalCourses: 0,
        publishedCourses: 0,
        totalEnrollments: 0,
        totalLessons: 0,
    });
    const [recentUsers, setRecentUsers] = useState<Profile[]>([]);
    const [recentCourses, setRecentCourses] = useState<Course[]>([]);
    const [accessRequests, setAccessRequests] = useState<CourseAccessRequest[]>([]);
    const [studentEnrollments, setStudentEnrollments] = useState<
        Array<{ course: Course; progress_percentage: number; enrolled_at: string; completed_at: string | null }>
    >([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchAdminData() {
            try {
                // Fetch all users
                const usersRef = collection(db, "users");
                const usersSnap = await getDocs(query(usersRef, orderBy("created_at", "desc")));
                const allUsers: Profile[] = [];
                usersSnap.forEach((doc) => {
                    allUsers.push(doc.data() as Profile);
                });

                const approvedCount = allUsers.filter(u => u.status === "approved").length;
                const pendingCount = allUsers.filter(u => u.status === "pending").length;

                // Fetch courses from Firestore
                let coursesList: Course[] = [];
                try {
                    const coursesRef = collection(db, "courses");
                    const coursesSnap = await getDocs(query(coursesRef, orderBy("created_at", "desc")));
                    coursesSnap.forEach((doc) => {
                        coursesList.push({ id: doc.id, ...doc.data() } as Course);
                    });
                } catch (e) {
                    // Collection may not exist yet
                }

                // Fetch course access requests
                let requestsList: CourseAccessRequest[] = [];
                try {
                    const requestsRef = collection(db, "course_access_requests");
                    const requestsSnap = await getDocs(query(requestsRef, orderBy("created_at", "desc")));
                    requestsSnap.forEach((doc) => {
                        requestsList.push({ id: doc.id, ...doc.data() } as CourseAccessRequest);
                    });
                } catch (e) {
                    // Collection may not exist yet
                }

                // Fetch enrollments count
                let enrollmentsCount = 0;
                try {
                    const enrollmentsRef = collection(db, "enrollments");
                    const enrollmentsSnap = await getDocs(enrollmentsRef);
                    enrollmentsCount = enrollmentsSnap.size;
                } catch (e) {
                    // Collection may not exist yet
                }

                const publishedCount = coursesList.filter(c => c.is_published).length;

                setStats({
                    totalUsers: allUsers.length,
                    approvedUsers: approvedCount,
                    pendingUsers: pendingCount,
                    totalCourses: coursesList.length,
                    publishedCourses: publishedCount,
                    totalEnrollments: enrollmentsCount,
                    totalLessons: 0,
                });

                setRecentUsers(allUsers.slice(0, 5));
                setRecentCourses(coursesList.slice(0, 5));
                setAccessRequests(requestsList);
            } catch (error) {
                console.error("Error fetching admin data:", error);
            } finally {
                setLoading(false);
            }
        }

        async function fetchStudentData() {
            try {
                // Fetch all courses
                let coursesList: Course[] = [];
                try {
                    const coursesRef = collection(db, "courses");
                    const coursesSnap = await getDocs(query(coursesRef, orderBy("created_at", "desc")));
                    coursesSnap.forEach((doc) => {
                        coursesList.push({ id: doc.id, ...doc.data() } as Course);
                    });
                } catch (e) {
                    // Collection may not exist yet
                }

                setRecentCourses(coursesList);

                // Fetch this student's enrollments
                if (user) {
                    const enrollmentsRef = collection(db, "enrollments");
                    const q = query(
                        enrollmentsRef,
                        where("user_id", "==", user.uid)
                    );
                    const enrollSnap = await getDocs(q);
                    const enrollmentDocs: Enrollment[] = [];
                    enrollSnap.forEach((doc) => {
                        enrollmentDocs.push({ id: doc.id, ...doc.data() } as Enrollment);
                    });
                    enrollmentDocs.sort((a, b) => new Date(b.enrolled_at).getTime() - new Date(a.enrolled_at).getTime());

                    // Build course map
                    const courseMap = new Map<string, Course>();
                    coursesList.forEach((c) => courseMap.set(c.id, c));

                    // Enrich enrollments with course data
                    const enriched = enrollmentDocs
                        .map((enrollment) => {
                            const course = courseMap.get(enrollment.course_id);
                            if (!course) {
                                if (enrollment.course_title) {
                                    return {
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
                                        progress_percentage: enrollment.progress_percentage,
                                        enrolled_at: enrollment.enrolled_at,
                                        completed_at: enrollment.completed_at,
                                    };
                                }
                                return null;
                            }
                            return {
                                course,
                                progress_percentage: enrollment.progress_percentage,
                                enrolled_at: enrollment.enrolled_at,
                                completed_at: enrollment.completed_at,
                            };
                        })
                        .filter(Boolean) as Array<{
                            course: Course;
                            progress_percentage: number;
                            enrolled_at: string;
                            completed_at: string | null;
                        }>;

                    setStudentEnrollments(enriched);
                }
            } catch (error) {
                console.error("Error fetching student data:", error);
            } finally {
                setLoading(false);
            }
        }

        if (user && profile) {
            if (profile.role === "admin") {
                fetchAdminData();
            } else {
                fetchStudentData();
            }
        }
    }, [user, profile]);

    if (!user || !profile) return null;

    if (loading) {
        return <LuxaarLoader text="Loading dashboard..." />;
    }

    if (profile.role === "admin") {
        return (
            <AdminDashboard
                stats={stats}
                recentUsers={recentUsers}
                recentCourses={recentCourses}
                accessRequests={accessRequests}
                profile={profile}
            />
        );
    }

    return (
        <StudentDashboard
            profile={profile}
            enrollments={studentEnrollments}
            featuredCourses={recentCourses as Course[]}
        />
    );
}
