import { MOCK_COURSES } from "@/lib/mockData";
import CourseEditClient from "./CourseEditClient";

export function generateStaticParams() {
    return MOCK_COURSES.map((course) => ({
        courseId: course.id,
    }));
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
