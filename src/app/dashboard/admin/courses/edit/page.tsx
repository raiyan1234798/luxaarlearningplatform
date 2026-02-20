"use client";

import { useSearchParams } from "next/navigation";
import CourseEditClient from "./CourseEditClient";
import React, { Suspense } from "react";
import LuxaarLoader from "@/components/ui/LuxaarLoader";

export default function EditCoursePage() {
    return (
        <Suspense fallback={<LuxaarLoader />}>
            <PageContent />
        </Suspense>
    );
}

function PageContent() {
    const searchParams = useSearchParams();
    const courseId = searchParams.get("id");

    if (!courseId) return <div className="p-8">No course ID provided</div>;

    // Simulate the Promise structure that the inner component natively expects
    const mockParams = Promise.resolve({ courseId });

    return <CourseEditClient params={mockParams} />;
}
