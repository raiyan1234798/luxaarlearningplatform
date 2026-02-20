import LearnClientPage from "./LearnClientPage";

export default function LearnPage({
    params,
}: {
    params: Promise<{ courseId: string }>;
}) {
    return (
        <LearnClientPage params={params} />
    );
}
