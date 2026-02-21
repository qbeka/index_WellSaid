import { ArrowLeft, Clock, MessageSquare } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";

type Props = { params: Promise<{ id: string }> };

const SessionDetailPage = async ({ params }: Props) => {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) notFound();

  const { data: session } = await supabase
    .from("sessions")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!session) notFound();

  const topics = (session.key_topics as string[]) ?? [];
  const actionItems = (session.action_items as string[]) ?? [];
  const date = new Date(session.created_at).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Link
          href="/sessions"
          aria-label="Back to sessions"
          tabIndex={0}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-[var(--color-muted)] transition-colors hover:bg-[var(--color-border)]"
        >
          <ArrowLeft size={18} />
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-xl font-semibold tracking-tight text-[var(--color-foreground)]">
            {session.title}
          </h1>
          <p className="flex items-center gap-1 text-sm text-[var(--color-muted)]">
            <Clock size={13} aria-hidden="true" />
            {date}
          </p>
        </div>
      </div>

      {session.summary && (
        <div className="rounded-2xl border-2 border-dashed border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <h2 className="mb-2 text-sm font-semibold text-[var(--color-foreground)]">
            Summary
          </h2>
          <p className="text-[15px] leading-relaxed text-[var(--color-foreground)]">
            {session.summary}
          </p>
        </div>
      )}

      {topics.length > 0 && (
        <div className="rounded-2xl border-2 border-dashed border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <h2 className="mb-3 text-sm font-semibold text-[var(--color-foreground)]">
            Key Topics
          </h2>
          <div className="flex flex-wrap gap-2">
            {topics.map((topic) => (
              <span
                key={topic}
                className="rounded-lg bg-[var(--color-accent-soft)] px-3 py-1.5 text-xs font-medium text-[var(--color-accent)]"
              >
                {topic}
              </span>
            ))}
          </div>
        </div>
      )}

      {actionItems.length > 0 && (
        <div className="rounded-2xl border-2 border-dashed border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <h2 className="mb-3 text-sm font-semibold text-[var(--color-foreground)]">
            Action Items
          </h2>
          <ul className="flex flex-col gap-2">
            {actionItems.map((item) => (
              <li
                key={item}
                className="flex items-start gap-2 text-[15px] leading-relaxed text-[var(--color-foreground)]"
              >
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--color-accent)]" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}

      {session.transcript && (
        <details className="rounded-2xl border-2 border-dashed border-[var(--color-border)] bg-[var(--color-surface)]">
          <summary className="cursor-pointer px-4 py-3 text-sm font-semibold text-[var(--color-foreground)]">
            <span className="ml-1 inline-flex items-center gap-2">
              <MessageSquare size={14} className="text-[var(--color-muted)]" />
              Full Transcript
            </span>
          </summary>
          <div className="border-t border-[var(--color-border)] px-4 py-4">
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-[var(--color-foreground)]">
              {session.transcript}
            </p>
          </div>
        </details>
      )}
    </div>
  );
};

export default SessionDetailPage;
