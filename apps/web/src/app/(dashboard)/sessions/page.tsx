import { MessageSquare, Clock, ChevronRight, Mic } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

const SessionsPage = async () => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: sessions } = await supabase
    .from("sessions")
    .select("id, title, summary, key_topics, created_at")
    .eq("user_id", user?.id ?? "")
    .order("created_at", { ascending: false });

  const hasSessions = sessions && sessions.length > 0;

  return (
    <div className="flex flex-col gap-5">
      <p className="text-sm text-[var(--color-muted)]">
        Visit summaries from your appointments.
      </p>

      {hasSessions ? (
        <div className="flex flex-col gap-3">
          {sessions.map((session) => {
            const topics = (session.key_topics as string[]) ?? [];
            const date = new Date(session.created_at).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            });

            return (
              <Link
                key={session.id}
                href={`/sessions/${session.id}`}
                tabIndex={0}
                className="group flex items-start gap-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 transition-all hover:border-[var(--color-accent)]/30 hover:shadow-sm"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--color-accent-soft)]">
                  <MessageSquare
                    size={18}
                    className="text-[var(--color-accent)]"
                    aria-hidden="true"
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <h3 className="font-medium text-[var(--color-foreground)]">
                    {session.title}
                  </h3>
                  {session.summary && (
                    <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-[var(--color-muted)]">
                      {session.summary}
                    </p>
                  )}
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span className="flex items-center gap-1 text-xs text-[var(--color-muted)]">
                      <Clock size={12} aria-hidden="true" />
                      {date}
                    </span>
                    {topics.slice(0, 3).map((topic) => (
                      <span
                        key={topic}
                        className="rounded-md bg-[var(--color-accent-soft)] px-2 py-0.5 text-xs font-medium text-[var(--color-accent)]"
                      >
                        {topic}
                      </span>
                    ))}
                  </div>
                </div>

                <ChevronRight
                  size={16}
                  className="mt-1 shrink-0 text-[var(--color-muted)] transition-transform group-hover:translate-x-0.5"
                  aria-hidden="true"
                />
              </Link>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={MessageSquare}
          title="No past sessions yet"
          description="Visit summaries from your appointments will show up here after you complete a conversation and save the summary."
        />
      )}
    </div>
  );
};

export default SessionsPage;
