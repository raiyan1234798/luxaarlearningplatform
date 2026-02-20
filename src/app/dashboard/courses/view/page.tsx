"use client";

import { useSearchParams } from "next/navigation";
import CourseDetailClientPage from "./CourseDetailClientPage";
import React, { Suspense } from "react";
import LuxaarLoader from "@/components/ui/LuxaarLoader";

export default function CourseViewPage() {
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

    const mockParams = Promise.resolve({ courseId });
    return <CourseDetailClientPage params={mockParams} />;
}
