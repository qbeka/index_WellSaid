import { notFound } from "next/navigation";
import { getHealthNote } from "../actions";
import { ArrowLeft, FileText, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { DeleteNoteButton } from "./delete-button";
import { EditNote } from "./edit-note";

type PageProps = {
  params: Promise<{ id: string }>;
};

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

const HealthNoteDetailPage = async ({ params }: PageProps) => {
  const { id } = await params;
  const note = await getHealthNote(id);

  if (!note) notFound();

  const actionItems: string[] = Array.isArray(note.action_items)
    ? note.action_items
    : [];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Link
          href="/health-notes"
          aria-label="Back to health notes"
          tabIndex={0}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-[var(--color-muted)] transition-colors hover:bg-[var(--color-border)]"
        >
          <ArrowLeft size={18} />
        </Link>
        <h1 className="flex-1 text-xl font-semibold tracking-tight text-[var(--color-foreground)]">
          {note.title}
        </h1>
      </div>

      <div className="flex items-center gap-2 text-xs text-[var(--color-muted)]">
        <FileText size={14} aria-hidden="true" />
        {formatDate(note.created_at)}
      </div>

      <div className="rounded-2xl border-2 border-dashed border-[var(--color-border)] bg-[var(--color-surface)] p-5">
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-[var(--color-foreground)]">
          {note.content}
        </p>
      </div>

      {actionItems.length > 0 && (
        <div className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold text-[var(--color-foreground)]">
            Action Items
          </h2>
          <div className="flex flex-col gap-2">
            {actionItems.map((item, i) => (
              <div
                key={i}
                className="flex items-start gap-3 rounded-xl border-2 border-dashed border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3"
              >
                <CheckCircle2
                  size={16}
                  className="mt-0.5 shrink-0 text-[var(--color-accent)]"
                  aria-hidden="true"
                />
                <span className="text-sm leading-relaxed text-[var(--color-foreground)]">
                  {item}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center gap-3 pt-4">
        <EditNote id={note.id} title={note.title} content={note.content} />
        <DeleteNoteButton id={note.id} />
      </div>
    </div>
  );
};

export default HealthNoteDetailPage;
