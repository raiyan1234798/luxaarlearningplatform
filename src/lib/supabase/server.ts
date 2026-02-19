import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import { createMockClient } from "./mock";

export async function createClient() {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL?.startsWith("http") || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        return createMockClient();
    }

    const cookieStore = await cookies();

    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll();
                },
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options)
                        );
                    } catch {
                        // The `setAll` method is called from a Server Component.
                        // Read-only contexts can safely ignore this.
                    }
                },
            },
        }
    );
}
