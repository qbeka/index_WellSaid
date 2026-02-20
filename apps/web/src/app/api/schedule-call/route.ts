import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const schedulingResultSchema = z.object({
  appointmentDate: z
    .string()
    .describe("The scheduled date in YYYY-MM-DD format"),
  appointmentTime: z
    .string()
    .describe("The scheduled time in HH:MM format (24hr)"),
  providerName: z
    .string()
    .describe("The doctor or provider name, if mentioned"),
  location: z.string().describe("The clinic or hospital location"),
  confirmationNotes: z
    .string()
    .describe(
      "A brief patient-friendly summary of the appointment (1-2 sentences)"
    ),
});

export const POST = async (req: Request) => {
  try {
    const { reason, preferredDate, preferredTime, notes } = await req.json();
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("first_name, last_name, hospital_phone, preferred_language")
      .eq("id", user.id)
      .single();

    const hospitalPhone = profile?.hospital_phone;
    const patientName = [profile?.first_name, profile?.last_name]
      .filter(Boolean)
      .join(" ");

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const send = (event: string, data: string) => {
          controller.enqueue(
            encoder.encode(`event: ${event}\ndata: ${data}\n\n`)
          );
        };

        send(
          "status",
          JSON.stringify({
            step: "dialing",
            message: `Calling ${hospitalPhone || "your healthcare provider"}...`,
          })
        );

        await new Promise((r) => setTimeout(r, 2000));

        send(
          "status",
          JSON.stringify({
            step: "connected",
            message: "Connected. Speaking with scheduling staff...",
          })
        );

        await new Promise((r) => setTimeout(r, 2500));

        send(
          "status",
          JSON.stringify({
            step: "requesting",
            message: `Requesting an appointment${reason ? ` for: ${reason}` : ""}...`,
          })
        );

        await new Promise((r) => setTimeout(r, 2000));

        if (preferredDate || preferredTime) {
          send(
            "status",
            JSON.stringify({
              step: "preferences",
              message: `Sharing your preferred timing${preferredDate ? ` (${preferredDate})` : ""}${preferredTime ? ` at ${preferredTime}` : ""}...`,
            })
          );
          await new Promise((r) => setTimeout(r, 2000));
        }

        send(
          "status",
          JSON.stringify({
            step: "confirming",
            message: "Confirming available slots...",
          })
        );

        await new Promise((r) => setTimeout(r, 2000));

        try {
          const { object } = await generateObject({
            model: openai("gpt-4o-mini"),
            schema: schedulingResultSchema,
            prompt: `You are simulating the result of a phone call to a hospital to schedule an appointment.

Patient: ${patientName || "the patient"}
Reason: ${reason || "general checkup"}
Preferred date: ${preferredDate || "next available"}
Preferred time: ${preferredTime || "any time"}
Additional notes: ${notes || "none"}
Hospital phone: ${hospitalPhone || "not specified"}

Generate a realistic appointment result. The date should be in the near future (within 1-2 weeks from today, ${new Date().toISOString().split("T")[0]}). Use realistic provider names and the hospital location if available, otherwise use a generic clinic name.`,
          });

          const { error } = await supabase.from("appointments").insert({
            user_id: user.id,
            title: reason || "Doctor Appointment",
            provider_name: object.providerName || null,
            location: object.location || null,
            date: object.appointmentDate,
            time: object.appointmentTime || null,
            notes: object.confirmationNotes || null,
            status: "upcoming",
          });

          if (error) {
            send(
              "error",
              JSON.stringify({ message: "Failed to save appointment." })
            );
          } else {
            send(
              "status",
              JSON.stringify({
                step: "confirmed",
                message: "Appointment confirmed and saved!",
              })
            );

            send("result", JSON.stringify(object));
          }
        } catch (e) {
          send(
            "error",
            JSON.stringify({
              message:
                e instanceof Error ? e.message : "Call failed. Please try again.",
            })
          );
        }

        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (e) {
    console.error("[schedule-call] Error:", e);
    return Response.json(
      { error: e instanceof Error ? e.message : "Scheduling failed" },
      { status: 500 }
    );
  }
};
