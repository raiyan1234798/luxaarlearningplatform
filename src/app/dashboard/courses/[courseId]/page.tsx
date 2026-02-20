import CourseDetailClientPage from "./CourseDetailClientPage";

export function generateStaticParams() {
    return [{ courseId: "default" }];
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
