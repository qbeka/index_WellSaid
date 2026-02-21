"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const completeOnboarding = async (data: {
  firstName: string;
  lastName: string;
  preferredLanguage: string;
  hospitalPhone: string;
  phoneExtension: string;
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
      phone_extension: data.phoneExtension || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) {
    console.error("[onboarding] Profile update error:", error.message);
    return { error: "Failed to save profile" };
  }

  redirect("/dashboard");
};
