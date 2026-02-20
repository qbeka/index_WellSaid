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
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-[var(--color-foreground)]">
            Past Sessions
          </h1>
          <p className="mt-1 text-sm text-[var(--color-muted)]">
            Summaries from your recorded doctor visits
          </p>
        </div>
        <Link
          href="/visit-flow"
          aria-label="Record a visit"
          tabIndex={0}
          className="flex h-10 items-center gap-2 rounded-xl bg-[var(--color-foreground)] px-4 text-sm font-medium text-[var(--color-background)] transition-all hover:opacity-90 active:scale-[0.97]"
        >
          <Mic size={15} aria-hidden="true" />
          Record
        </Link>
      </div>

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
          title="No sessions yet"
          description="Record your next doctor visit to get an AI-powered summary with key topics and action items."
        />
      )}
    </div>
  );
};

export default SessionsPage;
