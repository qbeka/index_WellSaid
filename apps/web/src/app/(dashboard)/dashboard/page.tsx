import { createClient } from "@/lib/supabase/server";
import { HomeContent } from "./home-content";

type ActionItem = {
  text: string;
  source: string;
  date: string;
};

const DashboardPage = async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let firstName = "";
  let actionItems: ActionItem[] = [];
  let upcomingCount = 0;

  if (user) {
    const [profileRes, notesRes, sessionsRes, appointmentsRes] =
      await Promise.all([
        supabase
          .from("profiles")
          .select("first_name")
          .eq("id", user.id)
          .single(),
        supabase
          .from("health_notes")
          .select("title, action_items, created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("sessions")
          .select("title, action_items, created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("appointments")
          .select("id")
          .eq("user_id", user.id)
          .eq("status", "upcoming"),
      ]);

    firstName = profileRes.data?.first_name ?? "";

    const notes = notesRes.data ?? [];
    const sessions = sessionsRes.data ?? [];

    const noteItems: ActionItem[] = notes.flatMap((note) =>
      (Array.isArray(note.action_items) ? note.action_items : []).map(
        (item: string) => ({
          text: item,
          source: note.title,
          date: note.created_at,
        })
      )
    );

    const sessionActionItems: ActionItem[] = sessions.flatMap((session) =>
      (Array.isArray(session.action_items) ? session.action_items : []).map(
        (item: string) => ({
          text: item,
          source: session.title,
          date: session.created_at,
        })
      )
    );

    actionItems = [...noteItems, ...sessionActionItems].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    upcomingCount = appointmentsRes.data?.length ?? 0;
  }

  return (
    <HomeContent
      firstName={firstName}
      actionItems={actionItems}
      upcomingAppointments={upcomingCount}
    />
  );
};

export default DashboardPage;
