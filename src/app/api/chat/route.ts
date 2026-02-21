import { NextResponse } from 'next/server';

export const runtime = 'edge';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { messages, model, temperature, max_tokens } = body;

        // Verify the user is authenticated (Optional but recommended: use Firebase Auth headers)
        // Here we just proxy the request securely

        // Fetch AI Settings from Firestore to get the Groq API Key securely on the backend
        let groqKey = process.env.GROQ_API_KEY;

        // Depending on your setup, you might want to fetch from Firestore if it's dynamic
        // Since we are in the edge runtime, we can use fetch to Google Firestore REST API 
        // OR we can just use the provided api key from the client if it's safe (NOT SAFE for Groq).

        // It's safer if the admin has saved the Groq key in the `ai_settings` collection.
        // But since this is edge runtime, `adminDb` from firebase-admin might not work if it uses Node.js crypto.
        // Let's rely on standard fetch or env var for now. Wait, I'll allow reading from standard REST if needed.

        // Use an environment variable by default for maximum security, or if a user must set it in DB:
        // Normally we'd fetch from Firestore here...
        // For simplicity and speed in edge, `process.env.GROQ_API_KEY` is completely secure.

        if (!groqKey) {
            // Let's fetch from Firestore using REST API to work in Edge
            const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
            if (projectId) {
                const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/ai_settings/default`;
                const res = await fetch(url);
                if (res.ok) {
                    const data = await res.json();
                    if (data.fields?.groqApiKey?.stringValue) {
                        groqKey = data.fields.groqApiKey.stringValue;
                    }
                }
            }
        }

        if (!groqKey) {
            return NextResponse.json({ error: "Groq API Key not configured on the server." }, { status: 500 });
        }

        const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${groqKey}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: model || "llama3-8b-8192",
                messages: messages,
                temperature: temperature || 0.7,
                max_tokens: max_tokens || 1024,
                stream: true // Enable streaming
            })
        });

        if (!groqResponse.ok) {
            const err = await groqResponse.text();
            return new Response(`Groq API Error: ${err}`, { status: groqResponse.status });
        }

        // Return the stream directly to the client
        return new Response(groqResponse.body, {
            headers: {
                "Content-Type": "text/event-stream",
                "Cache-Control": "no-cache",
                "Connection": "keep-alive"
            }
        });

    } catch (error: any) {
        return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
    }
}
