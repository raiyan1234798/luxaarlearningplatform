import { MOCK_COURSES } from "@/lib/mockData";
import CourseDetailClientPage from "./CourseDetailClientPage";

export function generateStaticParams() {
    return MOCK_COURSES.map((course) => ({
        courseId: course.id,
    }));
}

export default function CourseDetailPage({
    params,
}: {
    params: Promise<{ courseId: string }>;
}) {
    return (
        <CourseDetailClientPage params={params} />
    );
}
