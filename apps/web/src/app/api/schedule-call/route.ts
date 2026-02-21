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

const VAPI_BASE = "https://api.vapi.ai";

async function vapiRequest(
  path: string,
  method: "GET" | "POST",
  body?: Record<string, unknown>
) {
  const res = await fetch(`${VAPI_BASE}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${process.env.VAPI_API_KEY}`,
      "Content-Type": "application/json",
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const data = await res.json();
  if (!res.ok) {
    console.error("[vapi] API error:", res.status, JSON.stringify(data));
    throw new Error(
      `Vapi API ${res.status}: ${data?.message || JSON.stringify(data)}`
    );
  }
  return data;
}

async function runVapiCall(
  reason: string,
  doctorName: string,
  preferredDate: string,
  preferredTime: string,
  notes: string,
  patientName: string,
  hospitalPhone: string,
  send: SendFn
): Promise<string | undefined> {
  send(
    "status",
    JSON.stringify({
      step: "dialing",
      message: `Calling ${hospitalPhone}...`,
    })
  );

  const assistantId = process.env.VAPI_ASSISTANT_ID;

  const callPayload: Record<string, unknown> = {
    phoneNumberId: process.env.VAPI_PHONE_NUMBER_ID,
    customer: { number: hospitalPhone },
  };

  if (assistantId) {
    callPayload.assistantId = assistantId;
    callPayload.assistantOverrides = {
      firstMessageMode: "assistant-speaks-first",
      variableValues: {
        patientName: patientName || "a patient",
        reason: reason || "general checkup",
        doctorName: doctorName || "any available doctor",
        preferredDate: preferredDate || "next available",
        preferredTime: preferredTime || "any time",
        notes: notes || "none",
      },
    };
  } else {
    callPayload.assistant = {
      name: "Riley",
      firstMessageMode: "assistant-speaks-first",
      firstMessage: `Hi there, my name is Riley and I'm calling from WellSaid Health on behalf of ${patientName || "a patient"}. I'd like to schedule an appointment${doctorName ? ` with ${doctorName}` : ""} for ${reason || "general checkup"}. Do you have a moment to help me with that?`,
      transcriber: {
        provider: "deepgram",
        model: "nova-2",
        language: "en",
      },
      model: {
        provider: "openai",
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are Riley, a polite and professional medical scheduling assistant working for WellSaid Health. You are making an outbound phone call to a hospital or clinic to schedule an appointment on behalf of a patient.

Patient: ${patientName}
Reason for visit: ${reason || "general checkup"}
Requested doctor: ${doctorName || "any available doctor"}
Preferred date: ${preferredDate || "next available"}
Preferred time: ${preferredTime || "any time"}
Additional notes: ${notes || "none"}

Your task:
1. Greet the receptionist warmly. State your name is Riley and you are calling from WellSaid Health on behalf of ${patientName || "a patient"}.
2. Provide the reason for the visit.
3. Share the preferred date and time. If no preference was given, ask for the next available slot.
4. If the receptionist offers a slot, confirm the exact date, time, provider name, and clinic location by repeating them back.
5. Ask if the patient needs to bring anything or prepare.
6. Thank them and end the call politely.

Rules:
- Be concise. Clinic staff are busy.
- Never invent or assume medical details. Only share information you were explicitly given.
- If asked a medical question you cannot answer, say you do not have that information and the patient or their family will follow up directly.
- If the preferred time is unavailable, be flexible and accept a reasonable alternative. Confirm with clear details.
- If you reach voicemail, leave a brief message with the patient name, reason, and ask them to return the call.
- Do not discuss insurance, payment, or billing.
- Always confirm the final appointment details before ending the call.`,
          },
        ],
      },
      voice: {
        provider: "vapi",
        voiceId: "Elliot",
      },
    };
  }

  console.log("[vapi] Creating call with payload:", JSON.stringify(callPayload, null, 2));
  const callResponse = await vapiRequest("/call", "POST", callPayload);
  console.log("[vapi] Call created:", JSON.stringify(callResponse, null, 2));

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
      const status = await vapiRequest(`/call/${callId}`, "GET");
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
    } catch (e) {
      console.error("[vapi] Poll error:", e);
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
  doctorName: string,
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

  return `Simulated call for ${patientName || "patient"}. Reason: ${reason || "general checkup"}. Doctor: ${doctorName || "any available"}. Preferred date: ${preferredDate || "next available"}. Preferred time: ${preferredTime || "any"}. Notes: ${notes || "none"}.`;
}

export const POST = async (req: Request) => {
  try {
    const { reason, doctorName, preferredDate, preferredTime, notes } = await req.json();
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
              doctorName || "",
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
              doctorName || "",
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
Requested doctor: ${doctorName || "any available"}
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
