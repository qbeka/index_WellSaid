import { createClient } from "@/lib/supabase/server";
import { HomeContent } from "./home-content";

const DashboardPage = async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let firstName = "";
  let actionItemCount = 0;
  let upcomingCount = 0;

  if (user) {
    const [profileRes, notesRes, appointmentsRes] = await Promise.all([
      supabase
        .from("profiles")
        .select("first_name")
        .eq("id", user.id)
        .single(),
      supabase
        .from("health_notes")
        .select("action_items")
        .eq("user_id", user.id),
      supabase
        .from("appointments")
        .select("id")
        .eq("user_id", user.id)
        .eq("status", "upcoming"),
    ]);

    firstName = profileRes.data?.first_name ?? "";

    const notes = notesRes.data ?? [];
    actionItemCount = notes.reduce((acc, note) => {
      const items = Array.isArray(note.action_items) ? note.action_items : [];
      return acc + items.length;
    }, 0);

    upcomingCount = appointmentsRes.data?.length ?? 0;
  }

  return (
    <HomeContent
      firstName={firstName}
      actionItemCount={actionItemCount}
      upcomingAppointments={upcomingCount}
    />
  );
};

export default DashboardPage;
