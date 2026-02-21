import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const translationSchema = z.object({
  translatedText: z.string().describe("The translated text"),
  detectedSourceLanguage: z
    .string()
    .describe("The detected language of the input text, as a human-readable name"),
});

export const POST = async (req: Request) => {
  try {
    const { text, targetLanguage } = await req.json();
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!text || typeof text !== "string" || text.trim().length === 0) {
      return Response.json({ error: "No text provided" }, { status: 400 });
    }

    if (!targetLanguage) {
      return Response.json({ error: "No target language" }, { status: 400 });
    }

    const { object } = await generateObject({
      model: openai("gpt-5.2"),
      schema: translationSchema,
      prompt: `Translate the following text into ${targetLanguage}. Detect the source language automatically. Preserve the original meaning, tone, and medical terminology if present. If the text is already in the target language, return it as-is.

Text to translate:
${text.trim()}`,
    });

    return Response.json({ success: true, ...object });
  } catch (e) {
    console.error("[translate] Error:", e);
    return Response.json(
      { error: e instanceof Error ? e.message : "Translation failed" },
      { status: 500 }
    );
  }
};
