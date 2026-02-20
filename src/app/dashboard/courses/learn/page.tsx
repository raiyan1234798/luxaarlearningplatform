"use client";

import { useSearchParams } from "next/navigation";
import LearnClientPage from "./LearnClientPage";
import React, { Suspense } from "react";
import LuxaarLoader from "@/components/ui/LuxaarLoader";

export default function CourseLearnPage() {
    return (
        <Suspense fallback={<LuxaarLoader />}>
            <PageContent />
        </Suspense>
    );
}

function PageContent() {
    const searchParams = useSearchParams();
    const courseId = searchParams.get("id");

    if (!courseId) return <div className="p-8 text-red-500">No active course selected to learn.</div>;

    const mockParams = Promise.resolve({ courseId });
    return <LearnClientPage params={mockParams} />;
}
