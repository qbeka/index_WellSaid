import { openai } from "@ai-sdk/openai";
import { streamText } from "ai";
import { createClient } from "@/lib/supabase/server";

export const maxDuration = 30;

const buildSystemPrompt = (
  userName: string,
  language: string,
  notes: string,
  appointments: string,
  documents: string,
  sessions: string
) => `You are a healthcare assistant for ${userName} using the WellSaid app. Respond in ${language}.

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
  const { messages } = await req.json();
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const [profileRes, notesRes, appointmentsRes, documentsRes, sessionsRes] =
    await Promise.all([
      supabase.from("profiles").select("*").eq("id", user.id).single(),
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
  };

  const language = languageMap[profile?.preferred_language ?? "en"] ?? "English";

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
    formatItems(sessionsRes.data as Record<string, unknown>[] | null)
  );

  const result = streamText({
    model: openai("gpt-4o-mini"),
    system: systemPrompt,
    messages,
  });

  return result.toUIMessageStreamResponse();
};
