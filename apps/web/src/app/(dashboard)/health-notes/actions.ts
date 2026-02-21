"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export const getHealthNotes = async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data } = await supabase
    .from("health_notes")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return data ?? [];
};

export const getHealthNote = async (id: string) => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data } = await supabase
    .from("health_notes")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  return data;
};

export const updateHealthNote = async (
  id: string,
  data: { title?: string; content?: string }
) => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Unauthorized" };

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (data.title !== undefined) updates.title = data.title.trim();
  if (data.content !== undefined) updates.content = data.content.trim();

  const { error } = await supabase
    .from("health_notes")
    .update(updates)
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    console.error("[health-notes] Update error:", error.message);
    return { error: "Failed to update note" };
  }

  revalidatePath("/health-notes");
  revalidatePath(`/health-notes/${id}`);
  return { success: true };
};

export const deleteHealthNote = async (id: string) => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Unauthorized" };

  const { error } = await supabase
    .from("health_notes")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    console.error("[health-notes] Delete error:", error.message);
    return { error: "Failed to delete note" };
  }

  revalidatePath("/health-notes");
  revalidatePath("/action-items");
  return { success: true };
};

export const getUserLanguage = async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return "English";

  const { data: profile } = await supabase
    .from("profiles")
    .select("preferred_language")
    .eq("id", user.id)
    .single();

  const languageMap: Record<string, string> = {
    en: "English",
    es: "Spanish",
    zh: "Mandarin Chinese",
    yue: "Cantonese",
    ko: "Korean",
    ja: "Japanese",
    vi: "Vietnamese",
    tl: "Tagalog",
    ar: "Arabic",
    pt: "Portuguese",
    sq: "Albanian",
    fr: "French",
    hi: "Hindi",
    ru: "Russian",
  };

  return languageMap[profile?.preferred_language ?? "en"] ?? "English";
};
