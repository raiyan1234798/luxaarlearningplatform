import { createBrowserClient } from "@supabase/ssr";

import { createMockClient } from "./mock";

export function createClient() {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL?.startsWith("http") || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        return createMockClient();
    }

    return createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
}
