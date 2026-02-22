import { openai } from "@ai-sdk/openai";
import { streamText, generateText, convertToModelMessages, type UIMessage } from "ai";
import { createClient } from "@/lib/supabase/server";
import { rateLimit } from "@/lib/rate-limit";

export const maxDuration = 30;

const buildSystemPrompt = (
  userName: string,
  language: string,
  notes: string,
  appointments: string,
  documents: string,
  sessions: string,
  pronouns?: string | null,
  genderIdentity?: string | null
) => `You are a healthcare assistant for ${userName} using the WellSaid app. Respond in ${language}.${pronouns ? `\nThe user's preferred pronouns are: ${pronouns}.` : ""}${genderIdentity ? ` Their gender identity is: ${genderIdentity}.` : ""}

STRICT RULES:
- You may ONLY use the information provided below to answer questions.
- If the information needed is not available, say so clearly. Do NOT invent, guess, or hallucinate.
- Never provide medical diagnoses or treatment recommendations. You are an information organizer, not a doctor.
- Be concise, clear, and compassionate. Use simple language appropriate for elderly users.

USER DATA:

HEALTH NOTES:
${notes || "No health notes recorded yet."}

APPOINTMENTS:
${appointments || "No appointments scheduled yet."}

DOCUMENTS:
${documents || "No documents uploaded yet."}

VISIT SESSIONS:
${sessions || "No visit sessions recorded yet."}`;

export const POST = async (req: Request) => {
  try {
    const authHeader = req.headers.get("authorization");
    const isBearerClient = authHeader?.startsWith("Bearer ");
    const { messages } = (await req.json()) as { messages: UIMessage[] };
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return new Response("Unauthorized", { status: 401 });
    }

    const rl = await rateLimit(user.id, "chat", 30, 60);
    if (!rl.success) return rl.response;

    const [profileRes, notesRes, appointmentsRes, documentsRes, sessionsRes] =
      await Promise.all([
        supabase.from("profiles").select("first_name, last_name, preferred_language, pronouns, gender_identity").eq("id", user.id).single(),
        supabase
          .from("health_notes")
          .select("title, content, action_items, created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(20),
        supabase
          .from("appointments")
          .select("title, provider_name, location, date, time, status, notes")
          .eq("user_id", user.id)
          .order("date", { ascending: true })
          .limit(20),
        supabase
          .from("documents")
          .select("title, summary, created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(10),
        supabase
          .from("sessions")
          .select("title, summary, key_topics, action_items, created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(10),
      ]);

    const profile = profileRes.data;
    const userName = profile
      ? `${profile.first_name} ${profile.last_name}`
      : "User";

    const languageMap: Record<string, string> = {
      en: "English",
      es: "Spanish",
      zh: "Mandarin Chinese",
      yue: "Cantonese",
      ko: "Korean",
      ja: "Japanese",
      vi: "Vietnamese",
      tl: "Tagalog",
      ar: "Arabic",
      pt: "Portuguese",
      sq: "Albanian",
      fr: "French",
      hi: "Hindi",
      ru: "Russian",
      de: "German",
      nl: "Dutch",
    };

    const language =
      languageMap[profile?.preferred_language ?? "en"] ?? "English";

    const formatItems = (items: Record<string, unknown>[] | null) => {
      if (!items || items.length === 0) return "";
      return items.map((item) => JSON.stringify(item)).join("\n");
    };

    const systemPrompt = buildSystemPrompt(
      userName,
      language,
      formatItems(notesRes.data as Record<string, unknown>[] | null),
      formatItems(appointmentsRes.data as Record<string, unknown>[] | null),
      formatItems(documentsRes.data as Record<string, unknown>[] | null),
      formatItems(sessionsRes.data as Record<string, unknown>[] | null),
      profile?.pronouns,
      profile?.gender_identity
    );

    const modelMessages = await convertToModelMessages(messages);

    if (isBearerClient) {
      const result = await generateText({
        model: openai("gpt-5.2"),
        system: systemPrompt,
        messages: modelMessages,
      });

      return new Response(
        JSON.stringify({ text: result.text }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    const result = streamText({
      model: openai("gpt-5.2"),
      system: systemPrompt,
      messages: modelMessages,
    });

    return result.toUIMessageStreamResponse();
  } catch (e) {
    console.error("[chat] Error:", e);
    return new Response(
      JSON.stringify({ error: "Something went wrong" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
