"use client";

import { useAuth } from "@/lib/contexts/AuthContext";
import CourseAccessRequestsClient from "@/components/admin/CourseAccessRequestsClient";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import type { CourseAccessRequest } from "@/types";
import LuxaarLoader from "@/components/ui/LuxaarLoader";

export default function CourseAccessRequestsPage() {
    const { user, profile, loading } = useAuth();
    const router = useRouter();
    const [requests, setRequests] = useState<CourseAccessRequest[]>([]);
    const [enrollments, setEnrollments] = useState<any[]>([]); // Add state for enrollments
    const [fetching, setFetching] = useState(true);

    useEffect(() => {
        if (!loading && profile && profile.role !== "admin") {
            router.push("/dashboard");
        }
    }, [loading, profile, router]);

    useEffect(() => {
        async function fetchData() {
            try {
                // Fetch requests
                const requestsRef = collection(db, "course_access_requests");
                const qRequests = query(requestsRef, orderBy("created_at", "desc"));
                const requestsSnap = await getDocs(qRequests);
                const requestsList: CourseAccessRequest[] = [];
                requestsSnap.forEach((doc) => {
                    requestsList.push({ id: doc.id, ...doc.data() } as CourseAccessRequest);
                });
                setRequests(requestsList);

                // Fetch enrollments
                const enrollmentsRef = collection(db, "enrollments");
                const qEnrollments = query(enrollmentsRef, orderBy("enrolled_at", "desc"));
                const enrollmentsSnap = await getDocs(qEnrollments);
                const enrollmentsList: any[] = [];
                enrollmentsSnap.forEach((doc) => {
                    enrollmentsList.push({ id: doc.id, ...doc.data() });
                });
                setEnrollments(enrollmentsList);

            } catch (error) {
                console.error("Error fetching data:", error);
            } finally {
                setFetching(false);
            }
        }

        if (user && profile?.role === "admin") {
            fetchData();
        }
    }, [user, profile]);

    if (!user || !profile || profile.role !== "admin") return null;

    if (fetching) {
        return <LuxaarLoader text="Loading enrollments..." />;
    }

    return <CourseAccessRequestsClient requests={requests} enrollments={enrollments} />;
}
