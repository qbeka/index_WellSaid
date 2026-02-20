import { ListChecks, CheckCircle2, FileText } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
};

const ActionItemsPage = async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  type NoteRow = {
    id: string;
    title: string;
    action_items: string[] | null;
    created_at: string;
  };

  type SessionRow = {
    id: string;
    title: string;
    action_items: string[] | null;
    created_at: string;
  };

  let noteItems: { source: string; sourceId: string; item: string; date: string }[] = [];
  let sessionItems: { source: string; sourceId: string; item: string; date: string }[] = [];

  if (user) {
    const [notesRes, sessionsRes] = await Promise.all([
      supabase
        .from("health_notes")
        .select("id, title, action_items, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("sessions")
        .select("id, title, action_items, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),
    ]);

    const notes = (notesRes.data ?? []) as NoteRow[];
    const sessions = (sessionsRes.data ?? []) as SessionRow[];

    noteItems = notes.flatMap((note) =>
      (note.action_items ?? []).map((item) => ({
        source: note.title,
        sourceId: `/health-notes/${note.id}`,
        item,
        date: note.created_at,
      }))
    );

    sessionItems = sessions.flatMap((session) =>
      (session.action_items ?? []).map((item) => ({
        source: session.title,
        sourceId: `/sessions/${session.id}`,
        item,
        date: session.created_at,
      }))
    );
  }

  const allItems = [...noteItems, ...sessionItems].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <div className="flex flex-col gap-5">
      <p className="text-sm text-[var(--color-muted)]">
        Follow-ups and tasks from your care team, updated in real time.
      </p>

      {allItems.length === 0 ? (
        <EmptyState
          icon={ListChecks}
          title="No action items yet"
          description="Action items from your visits will show up here so you can track follow-ups and medications."
        />
      ) : (
        <div className="flex flex-col gap-2">
          {allItems.map((item, i) => (
            <div
              key={`${item.sourceId}-${i}`}
              className="flex items-start gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3"
            >
              <CheckCircle2
                size={16}
                className="mt-0.5 shrink-0 text-[var(--color-accent)]"
                aria-hidden="true"
              />
              <div className="flex flex-1 flex-col gap-1">
                <span className="text-sm leading-relaxed text-[var(--color-foreground)]">
                  {item.item}
                </span>
                <Link
                  href={item.sourceId}
                  tabIndex={0}
                  className="flex items-center gap-1 text-xs text-[var(--color-muted)] transition-colors hover:text-[var(--color-accent)]"
                >
                  <FileText size={10} aria-hidden="true" />
                  {item.source} -- {formatDate(item.date)}
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ActionItemsPage;
