import { MOCK_COURSES } from "@/lib/mockData";
import LearnClientPage from "./LearnClientPage";

export function generateStaticParams() {
    return MOCK_COURSES.map((course) => ({
        courseId: course.id,
    }));
}

export default function LearnPage({
    params,
}: {
    params: Promise<{ courseId: string }>;
}) {
    return (
        <LearnClientPage params={params} />
    );
}
