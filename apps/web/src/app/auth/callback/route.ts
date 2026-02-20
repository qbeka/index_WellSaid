import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const getBaseUrl = (request: NextRequest) => {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL;
  }
  const host =
    request.headers.get("x-forwarded-host") ||
    request.headers.get("host") ||
    "localhost:3000";
  const protocol = request.headers.get("x-forwarded-proto") || "https";
  return `${protocol}://${host}`;
};

export const GET = async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const baseUrl = getBaseUrl(request);

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("first_name")
          .eq("id", user.id)
          .single();

        if (!profile?.first_name) {
          return NextResponse.redirect(`${baseUrl}/onboarding`);
        }

        return NextResponse.redirect(`${baseUrl}/dashboard`);
      }
    }
  }

  return NextResponse.redirect(`${baseUrl}/login`);
};
