import CourseDetailClientPage from "./CourseDetailClientPage";

export default function CourseDetailPage({
    params,
}: {
    params: Promise<{ courseId: string }>;
}) {
    return (
        <CourseDetailClientPage params={params} />
    );
}
