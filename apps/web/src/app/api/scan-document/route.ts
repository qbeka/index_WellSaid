import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const documentSchema = z.object({
  title: z
    .string()
    .describe("A short, descriptive title for this document (5-10 words)"),
  summary: z
    .string()
    .describe(
      "A concise summary of the document's contents including key information like medications, lab results, diagnoses, or instructions. 2-4 sentences."
    ),
});

export const POST = async (req: Request) => {
  try {
    const { image } = await req.json();
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!image || typeof image !== "string") {
      return Response.json({ error: "No image provided" }, { status: 400 });
    }

    const { object } = await generateObject({
      model: openai("gpt-4o"),
      schema: documentSchema,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "You are a medical document analyzer. Analyze this document image and extract a title and summary. Focus on medical information: medications, dosages, lab results, diagnoses, instructions, dates. Do NOT invent information not visible in the image.",
            },
            {
              type: "image",
              image,
            },
          ],
        },
      ],
    });

    const { error } = await supabase.from("documents").insert({
      user_id: user.id,
      title: object.title,
      summary: object.summary,
      image_url: image.substring(0, 100) + "...",
    });

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ success: true, document: object });
  } catch (e) {
    console.error("[scan-document] Error:", e);
    return Response.json(
      { error: e instanceof Error ? e.message : "Failed to process document" },
      { status: 500 }
    );
  }
};
