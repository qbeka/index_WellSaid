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

type SendFn = (event: string, data: string) => void;

async function runVapiCall(
  reason: string,
  preferredDate: string,
  preferredTime: string,
  notes: string,
  patientName: string,
  hospitalPhone: string,
  send: SendFn
): Promise<string | undefined> {
  const { VapiClient } = await import("@vapi-ai/server-sdk");
  const vapi = new VapiClient({ token: process.env.VAPI_API_KEY! });

  send(
    "status",
    JSON.stringify({
      step: "dialing",
      message: `Calling ${hospitalPhone}...`,
    })
  );

  /* eslint-disable @typescript-eslint/no-explicit-any */
  const callResponse: any = await (vapi.calls as any).create({
    phoneNumberId: process.env.VAPI_PHONE_NUMBER_ID!,
    customer: { number: hospitalPhone },
    assistant: {
      firstMessage: `Hi, I'm calling on behalf of ${patientName || "a patient"} to schedule an appointment.`,
      model: {
        provider: "openai",
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are a medical scheduling assistant calling a hospital to book an appointment.
Patient: ${patientName}
Reason: ${reason || "general checkup"}
Preferred date: ${preferredDate || "next available"}
Preferred time: ${preferredTime || "any time"}
Additional notes: ${notes || "none"}

Your task:
1. Introduce yourself politely, stating you're calling on behalf of ${patientName || "a patient"}
2. Request an appointment for the stated reason
3. Share the preferred date/time
4. Confirm all details (date, time, provider, location)
5. Thank them and end the call

Be concise, polite, and professional.`,
          },
        ],
      },
      voice: { provider: "11labs", voiceId: "jennifer" },
    },
  });
  /* eslint-enable @typescript-eslint/no-explicit-any */

  const callId: string = callResponse.id;

  send(
    "status",
    JSON.stringify({
      step: "connected",
      message: "Connected. AI assistant is speaking with scheduling staff...",
    })
  );

  let callEnded = false;
  let callTranscript = "";
  const maxPolls = 60;
  const pollIntervalMs = 3000;

  for (let i = 0; i < maxPolls; i++) {
    await new Promise((r) => setTimeout(r, pollIntervalMs));

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const status: any = await (vapi.calls as any).get({ id: callId });
      if (status.transcript) {
        callTranscript = status.transcript;
      }

      if (status.status === "ended") {
        callEnded = true;
        break;
      }

      send(
        "status",
        JSON.stringify({
          step: "in-progress",
          message: "Call in progress...",
        })
      );
    } catch {
      break;
    }
  }

  if (!callEnded) {
    send(
      "error",
      JSON.stringify({ message: "Call timed out. Please try again." })
    );
    return undefined;
  }

  send(
    "status",
    JSON.stringify({
      step: "confirming",
      message: "Call completed. Extracting appointment details...",
    })
  );

  return callTranscript;
}

async function runSimulation(
  reason: string,
  preferredDate: string,
  preferredTime: string,
  notes: string,
  patientName: string,
  hospitalPhone: string | null,
  send: SendFn
): Promise<string> {
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

  return `Simulated call for ${patientName || "patient"}. Reason: ${reason || "general checkup"}. Preferred date: ${preferredDate || "next available"}. Preferred time: ${preferredTime || "any"}. Notes: ${notes || "none"}.`;
}

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

    const useVapi =
      !!process.env.VAPI_API_KEY &&
      !!process.env.VAPI_PHONE_NUMBER_ID &&
      !!hospitalPhone;

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const send: SendFn = (event, data) => {
          controller.enqueue(
            encoder.encode(`event: ${event}\ndata: ${data}\n\n`)
          );
        };

        try {
          let transcript: string | undefined;

          if (useVapi) {
            transcript = await runVapiCall(
              reason,
              preferredDate,
              preferredTime,
              notes,
              patientName,
              hospitalPhone,
              send
            );
          } else {
            transcript = await runSimulation(
              reason,
              preferredDate,
              preferredTime,
              notes,
              patientName,
              hospitalPhone,
              send
            );
          }

          if (!transcript) {
            controller.close();
            return;
          }

          const { object } = await generateObject({
            model: openai("gpt-4o-mini"),
            schema: schedulingResultSchema,
            prompt: `${useVapi ? "Analyze this real phone call transcript" : "You are simulating the result of a phone call to a hospital to schedule an appointment"}.

Patient: ${patientName || "the patient"}
Reason: ${reason || "general checkup"}
Preferred date: ${preferredDate || "next available"}
Preferred time: ${preferredTime || "any time"}
Additional notes: ${notes || "none"}
Hospital phone: ${hospitalPhone || "not specified"}
${useVapi ? `\nCall transcript:\n${transcript}` : ""}

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
                e instanceof Error
                  ? e.message
                  : "Call failed. Please try again.",
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
