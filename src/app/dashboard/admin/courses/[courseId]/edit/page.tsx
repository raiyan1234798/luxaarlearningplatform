import CourseEditClient from "./CourseEditClient";

import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase/client";

export async function generateStaticParams() {
    try {
        const snap = await getDocs(collection(db, "courses"));
        const courses = snap.docs.map(doc => ({
            courseId: doc.id
        }));
        return courses.length > 0 ? courses : [{ courseId: "default" }];
    } catch {
        return [{ courseId: "default" }];
    }
}

export default function EditCoursePage({
    params,
}: {
    params: Promise<{ courseId: string }>;
}) {
    return (
        <CourseEditClient params={params} />
    );
}
