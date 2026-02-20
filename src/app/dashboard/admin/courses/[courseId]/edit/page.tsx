import CourseEditClient from "./CourseEditClient";

export function generateStaticParams() {
    return [{ courseId: "default" }];
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
