import LearnClientPage from "./LearnClientPage";

export function generateStaticParams() {
    return [{ courseId: "default" }];
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
