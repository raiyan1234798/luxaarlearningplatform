import CourseEditClient from "./CourseEditClient";

export default function EditCoursePage({
    params,
}: {
    params: Promise<{ courseId: string }>;
}) {
    return (
        <CourseEditClient params={params} />
    );
}
