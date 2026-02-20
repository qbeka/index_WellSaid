"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export const getAppointments = async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data } = await supabase
    .from("appointments")
    .select("*")
    .eq("user_id", user.id)
    .order("date", { ascending: true });

  return data ?? [];
};

export const getAppointment = async (id: string) => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data } = await supabase
    .from("appointments")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  return data;
};

export const createAppointment = async (data: {
  title: string;
  providerName: string;
  location: string;
  date: string;
  time: string;
  notes: string;
}) => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Unauthorized" };

  const { error } = await supabase.from("appointments").insert({
    user_id: user.id,
    title: data.title.trim(),
    provider_name: data.providerName.trim() || null,
    location: data.location.trim() || null,
    date: data.date,
    time: data.time || null,
    notes: data.notes.trim() || null,
  });

  if (error) return { error: error.message };

  revalidatePath("/appointments");
  revalidatePath("/action-items");
  return { success: true };
};

export const updateAppointmentStatus = async (
  id: string,
  status: "upcoming" | "completed" | "cancelled"
) => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Unauthorized" };

  const { error } = await supabase
    .from("appointments")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/appointments");
  return { success: true };
};

export const updateAppointment = async (
  id: string,
  data: {
    title?: string;
    providerName?: string;
    location?: string;
    date?: string;
    time?: string;
    notes?: string;
  }
) => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Unauthorized" };

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (data.title !== undefined) updates.title = data.title.trim();
  if (data.providerName !== undefined) updates.provider_name = data.providerName.trim() || null;
  if (data.location !== undefined) updates.location = data.location.trim() || null;
  if (data.date !== undefined) updates.date = data.date;
  if (data.time !== undefined) updates.time = data.time || null;
  if (data.notes !== undefined) updates.notes = data.notes.trim() || null;

  const { error } = await supabase
    .from("appointments")
    .update(updates)
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/appointments");
  revalidatePath(`/appointments/${id}`);
  return { success: true };
};

export const deleteAppointment = async (id: string) => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Unauthorized" };

  const { error } = await supabase
    .from("appointments")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/appointments");
  return { success: true };
};
