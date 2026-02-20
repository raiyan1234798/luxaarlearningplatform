import LearnClientPage from "./LearnClientPage";

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

export default function LearnPage({
    params,
}: {
    params: Promise<{ courseId: string }>;
}) {
    return (
        <LearnClientPage params={params} />
    );
}
