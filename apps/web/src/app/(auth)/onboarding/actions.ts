"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const completeOnboarding = async (data: {
  firstName: string;
  lastName: string;
  preferredLanguage: string;
  hospitalPhone: string;
}) => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      first_name: data.firstName,
      last_name: data.lastName,
      preferred_language: data.preferredLanguage,
      hospital_phone: data.hospitalPhone || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) {
    return { error: error.message };
  }

  redirect("/dashboard");
};
