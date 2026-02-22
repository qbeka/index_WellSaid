import { supabase } from "./supabase";

const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000";
const REQUEST_TIMEOUT_MS = 45000;

const withTimeout = async (input: RequestInfo | URL, init?: RequestInit) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeoutId);
  }
};

const extractTextFromSSE = (payload: string): string => {
  let text = "";
  const lines = payload.split(/\r?\n/);
  for (const line of lines) {
    if (!line.startsWith("data:")) continue;
    const raw = line.slice(5).trim();
    if (!raw || raw === "[DONE]") continue;

    // Vercel AI SDK can emit either JSON objects or compact 0:"text" deltas.
    try {
      const parsed = JSON.parse(raw);
      if (typeof parsed?.text === "string") {
        text += parsed.text;
        continue;
      }
      if (parsed?.type === "text-delta" && typeof parsed?.delta === "string") {
        text += parsed.delta;
        continue;
      }
      if (parsed?.type === "text" && typeof parsed?.text === "string") {
        text += parsed.text;
        continue;
      }
      continue;
    } catch {
      const match = raw.match(/^0:(.+)$/);
      if (!match) continue;
      try {
        const delta = JSON.parse(match[1]);
        if (typeof delta === "string") text += delta;
      } catch {
        // Ignore malformed chunks and keep parsing.
      }
    }
  }
  return text.trim();
};

export const getAuthHeaders = async (): Promise<Record<string, string>> => {
  const { data: { session } } = await supabase.auth.getSession();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (session?.access_token) {
    headers.Authorization = `Bearer ${session.access_token}`;
  }
  return headers;
};

export const apiPost = async <T = any>(
  path: string,
  body: Record<string, unknown>
): Promise<T> => {
  const headers = await getAuthHeaders();
  const res = await withTimeout(`${API_URL}${path}`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "Request failed");
    throw new Error(text);
  }
  return res.json();
};

export const apiChat = async (
  messages: Array<{ role: "user" | "assistant"; content: string }>
): Promise<string> => {
  const headers = await getAuthHeaders();
  const res = await withTimeout(`${API_URL}/api/chat`, {
    method: "POST",
    headers,
    body: JSON.stringify({ messages }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "Chat request failed");
    throw new Error(text);
  }

  const contentType = res.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    const data = (await res.json()) as { text?: string };
    return data.text?.trim() || "Sorry, I could not respond.";
  }

  const raw = await res.text();
  const streamText = extractTextFromSSE(raw);
  if (streamText) return streamText;

  return raw.trim() || "Sorry, I could not respond.";
};

export const apiPostStream = async (
  path: string,
  body: Record<string, unknown>,
  onChunk: (text: string) => void
): Promise<void> => {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error("Stream request failed");
  const reader = res.body?.getReader();
  if (!reader) throw new Error("No response body");
  const decoder = new TextDecoder();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    onChunk(decoder.decode(value, { stream: true }));
  }
};
