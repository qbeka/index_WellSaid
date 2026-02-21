import { createClient } from "@/lib/supabase/server";
import { DashboardShell } from "./dashboard-shell";
import { TranslationProvider } from "@/i18n";

const DashboardLayout = async ({ children }: { children: React.ReactNode }) => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let lang = "en";
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("preferred_language")
      .eq("id", user.id)
      .single();
    if (profile?.preferred_language) {
      lang = profile.preferred_language;
    }
  }

  return (
    <TranslationProvider lang={lang}>
      <DashboardShell>{children}</DashboardShell>
    </TranslationProvider>
  );
};

export default DashboardLayout;
