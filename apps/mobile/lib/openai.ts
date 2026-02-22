const OPENAI_API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY;
const OPENAI_URL = "https://api.openai.com/v1/chat/completions";
const TIMEOUT_MS = 45000;

type Message = { role: "system" | "user" | "assistant"; content: string };

export const callOpenAI = async (
  messages: Message[],
  responseFormat?: { type: "json_object" }
): Promise<string> => {
  if (!OPENAI_API_KEY) throw new Error("OpenAI API key not configured");

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const body: Record<string, unknown> = {
      model: "gpt-4o",
      messages,
      max_tokens: 2048,
    };
    if (responseFormat) body.response_format = responseFormat;

    const res = await fetch(OPENAI_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    if (!res.ok) {
      const err = await res.text().catch(() => "");
      throw new Error(`OpenAI ${res.status}: ${err}`);
    }

    const data = await res.json();
    return data?.choices?.[0]?.message?.content?.trim() ?? "";
  } finally {
    clearTimeout(timeoutId);
  }
};

export const transcribeAudio = async (
  audioUri: string,
  language?: string
): Promise<string> => {
  if (!OPENAI_API_KEY) throw new Error("OpenAI API key not configured");

  const formData = new FormData();
  formData.append("file", {
    uri: audioUri,
    type: "audio/m4a",
    name: "recording.m4a",
  } as any);
  formData.append("model", "whisper-1");
  if (language) formData.append("language", language);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 60000);

  try {
    const res = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${OPENAI_API_KEY}` },
      body: formData,
      signal: controller.signal,
    });

    if (!res.ok) {
      const err = await res.text().catch(() => "");
      throw new Error(`Whisper ${res.status}: ${err}`);
    }

    const data = await res.json();
    return data?.text?.trim() ?? "";
  } finally {
    clearTimeout(timeoutId);
  }
};
