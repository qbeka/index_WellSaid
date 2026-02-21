import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { SUPPORTED_LANGUAGES } from "@wellsaid/shared";

const sessionSchema = z.object({
  title: z
    .string()
    .describe(
      "A short descriptive title for this doctor visit, 5-10 words (e.g. 'Follow-up for blood pressure medication')"
    ),
  summary: z
    .string()
    .describe(
      "A patient-friendly summary of the visit covering what was discussed, any diagnoses, medications, and next steps. 3-6 sentences."
    ),
  keyTopics: z
    .array(z.string())
    .describe(
      "3-8 key topics or terms discussed during the visit (e.g. 'blood pressure', 'medication change')"
    ),
  actionItems: z
    .array(z.string())
    .describe(
      "Specific action items for the patient such as 'Take new medication twice daily', 'Schedule follow-up in 2 weeks'"
    ),
});

export const POST = async (req: Request) => {
  try {
    const { transcript } = await req.json();
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!transcript || typeof transcript !== "string" || transcript.trim().length < 10) {
      return Response.json(
        { error: "Transcript too short to summarize" },
        { status: 400 }
      );
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("preferred_language")
      .eq("id", user.id)
      .single();

    const langCode = profile?.preferred_language ?? "en";
    const langLabel =
      SUPPORTED_LANGUAGES.find((l) => l.code === langCode)?.label || "English";

    const languageInstruction =
      langCode !== "en"
        ? `\n\nIMPORTANT: The patient's preferred language is ${langLabel}. Write ALL output (title, summary, key topics, action items) in ${langLabel}.`
        : "";

    const { object } = await generateObject({
      model: openai("gpt-5.2"),
      schema: sessionSchema,
      prompt: `You are a medical visit summarizer helping patients understand their doctor visits. Analyze this transcript of a doctor-patient conversation and extract:

1. A short descriptive title
2. A clear, patient-friendly summary (avoid jargon, explain medical terms)
3. Key topics discussed
4. Action items for the patient${languageInstruction}

Transcript:
${transcript.trim()}`,
    });

    const { error, data } = await supabase
      .from("sessions")
      .insert({
        user_id: user.id,
        title: object.title,
        transcript: transcript.trim(),
        summary: object.summary,
        key_topics: object.keyTopics,
        action_items: object.actionItems,
      })
      .select("id")
      .single();

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ success: true, session: { id: data.id, ...object } });
  } catch (e) {
    console.error("[summarize-visit] Error:", e);
    return Response.json(
      { error: e instanceof Error ? e.message : "Failed to summarize visit" },
      { status: 500 }
    );
  }
};
