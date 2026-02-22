import { supabase } from "./supabase";

const OPENAI_API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY;
const OPENAI_URL = "https://api.openai.com/v1/chat/completions";
const TIMEOUT_MS = 30000;

type ChatMessage = { role: "user" | "assistant" | "system"; content: string };

const LANGUAGE_MAP: Record<string, string> = {
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

const formatItems = (items: Record<string, unknown>[] | null): string => {
  if (!items || items.length === 0) return "";
  return items.map((item) => JSON.stringify(item)).join("\n");
};

const fetchUserContext = async (userId: string) => {
  const [profileRes, notesRes, appointmentsRes, documentsRes, sessionsRes] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("first_name, last_name, preferred_language, pronouns, gender_identity")
        .eq("id", userId)
        .single(),
      supabase
        .from("health_notes")
        .select("title, content, action_items, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(20),
      supabase
        .from("appointments")
        .select("title, provider_name, location, date, time, status, notes")
        .eq("user_id", userId)
        .order("date", { ascending: true })
        .limit(20),
      supabase
        .from("documents")
        .select("title, summary, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(10),
      supabase
        .from("sessions")
        .select("title, summary, key_topics, action_items, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(10),
    ]);

  const profile = profileRes.data;
  const userName = profile
    ? `${profile.first_name} ${profile.last_name}`
    : "User";
  const language = LANGUAGE_MAP[profile?.preferred_language ?? "en"] ?? "English";

  return buildSystemPrompt(
    userName,
    language,
    formatItems(notesRes.data as Record<string, unknown>[] | null),
    formatItems(appointmentsRes.data as Record<string, unknown>[] | null),
    formatItems(documentsRes.data as Record<string, unknown>[] | null),
    formatItems(sessionsRes.data as Record<string, unknown>[] | null),
    profile?.pronouns,
    profile?.gender_identity
  );
};

export const sendChatMessage = async (
  messages: Array<{ role: "user" | "assistant"; content: string }>
): Promise<string> => {
  if (!OPENAI_API_KEY) {
    throw new Error("OpenAI API key is not configured.");
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const systemPrompt = await fetchUserContext(user.id);

  const apiMessages: ChatMessage[] = [
    { role: "system", content: systemPrompt },
    ...messages,
  ];

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(OPENAI_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: apiMessages,
        max_tokens: 1024,
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      const errBody = await res.text().catch(() => "");
      throw new Error(`OpenAI error ${res.status}: ${errBody}`);
    }

    const data = await res.json();
    const text = data?.choices?.[0]?.message?.content;
    if (typeof text !== "string" || !text.trim()) {
      throw new Error("Empty response from OpenAI");
    }
    return text.trim();
  } finally {
    clearTimeout(timeoutId);
  }
};
