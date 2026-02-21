import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { rateLimit } from "@/lib/rate-limit";

const noteSchema = z.object({
  title: z
    .string()
    .describe("A short, descriptive title for this health note (5-10 words)"),
  content: z
    .string()
    .describe(
      "A clean, structured version of the raw input organized into clear sentences. Remove filler words and small talk."
    ),
  actionItems: z
    .array(z.string())
    .describe(
      "Specific follow-up tasks extracted from the content, e.g. 'Schedule blood work', 'Take medication at 8am daily'. Empty array if none."
    ),
});

export const POST = async (req: Request) => {
  const { rawText, language } = await req.json();
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rl = await rateLimit(user.id, "extract-note", 20, 60);
  if (!rl.success) return rl.response;

  if (!rawText || typeof rawText !== "string" || rawText.trim().length === 0) {
    return Response.json({ error: "No text provided" }, { status: 400 });
  }

  const languageName = language || "English";

  const { object } = await generateObject({
    model: openai("gpt-5.2"),
    schema: noteSchema,
    prompt: `You are a healthcare note organizer. The user has provided a raw health note or voice transcription. Process it into structured data.

Respond in ${languageName}.

RULES:
- Extract only factual healthcare information from the input.
- Do NOT invent or add information not present in the input.
- If the input has no actionable follow-ups, return an empty actionItems array.
- Keep the title concise and descriptive.
- Clean up the content but preserve all medical details.

RAW INPUT:
${rawText.trim()}`,
  });

  const { error } = await supabase.from("health_notes").insert({
    user_id: user.id,
    title: object.title,
    content: object.content,
    action_items: object.actionItems,
  });

  if (error) {
    console.error("[extract-note] DB error:", error.message);
    return Response.json({ error: "Failed to save note" }, { status: 500 });
  }

  return Response.json({ success: true, note: object });
};
