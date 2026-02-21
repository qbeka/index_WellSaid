import { createClient } from "@/lib/supabase/server";
import { rateLimit } from "@/lib/rate-limit";

export const POST = async () => {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rl = await rateLimit(user.id, "assemblyai-token", 10, 60);
    if (!rl.success) return rl.response;

    const apiKey = process.env.ASSEMBLYAI_API_KEY;
    if (!apiKey) {
      return Response.json(
        { error: "AssemblyAI not configured" },
        { status: 503 }
      );
    }

    const res = await fetch("https://api.assemblyai.com/v2/realtime/token", {
      method: "POST",
      headers: {
        Authorization: apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ expires_in: 300 }),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("[assemblyai-token] Failed:", text);
      return Response.json(
        { error: "Failed to create token" },
        { status: 502 }
      );
    }

    const data = await res.json();
    return Response.json({ token: data.token });
  } catch (e) {
    console.error("[assemblyai-token] Error:", e);
    return Response.json(
      { error: "Internal error" },
      { status: 500 }
    );
  }
};
