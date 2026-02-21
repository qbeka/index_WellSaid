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
  documentType: z
    .enum([
      "prescription",
      "lab_result",
      "discharge_summary",
      "referral",
      "imaging_report",
      "insurance",
      "receipt",
      "other",
    ])
    .describe("The type/category of this medical document"),
  keyFindings: z
    .array(z.string())
    .describe(
      "Key medical findings, values, or observations extracted from the document (e.g. 'Blood pressure: 120/80', 'Cholesterol: 200 mg/dL')"
    ),
  medications: z
    .array(z.string())
    .describe(
      "Names of any medications mentioned in the document, including dosages if visible"
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
      model: openai("gpt-5.2"),
      schema: documentSchema,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "You are a medical document analyzer. Analyze this document image and extract a title, summary, document type, key findings, and any medications mentioned. Focus on medical information: medications, dosages, lab results, diagnoses, instructions, dates. Do NOT invent information not visible in the image. If a field has no applicable data, return an empty array.",
            },
            {
              type: "image",
              image,
            },
          ],
        },
      ],
    });

    let imageUrl = "";
    let storagePath = "";

    try {
      const base64Match = image.match(/^data:image\/\w+;base64,(.+)$/);
      if (base64Match) {
        const base64Data = base64Match[1];
        const buffer = Buffer.from(base64Data, "base64");
        const fileExt = image.split(";")[0].split("/")[1] || "jpeg";
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("documents")
          .upload(fileName, buffer, {
            contentType: `image/${fileExt}`,
            upsert: false,
          });

        if (!uploadError) {
          storagePath = fileName;
          const { data: signedData } = await supabase.storage
            .from("documents")
            .createSignedUrl(fileName, 60 * 60 * 24 * 365);

          imageUrl = signedData?.signedUrl || "";
        } else {
          console.error("[scan-document] Upload error:", uploadError.message);
          imageUrl = "upload-failed";
        }
      }
    } catch (uploadErr) {
      console.error("[scan-document] Storage error:", uploadErr);
      imageUrl = "upload-failed";
    }

    const { error } = await supabase.from("documents").insert({
      user_id: user.id,
      title: object.title,
      summary: object.summary,
      image_url: imageUrl || "no-image",
      storage_path: storagePath || null,
      document_type: object.documentType,
      key_findings: object.keyFindings,
      medications: object.medications,
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
