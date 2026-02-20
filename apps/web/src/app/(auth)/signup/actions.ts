"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const signup = async (formData: FormData) => {
  const supabase = await createClient();

  const { error } = await supabase.auth.signUp({
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  });

  if (error) {
    return { error: error.message };
  }

  redirect("/onboarding");
};
