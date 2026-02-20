import { FileText, ChevronRight, ListChecks } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { getHealthNotes, getUserLanguage } from "./actions";
import { CreateNote } from "./create-note";
import Link from "next/link";

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const HealthNotesPage = async () => {
  const [notes, language] = await Promise.all([
    getHealthNotes(),
    getUserLanguage(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold tracking-tight text-[var(--color-foreground)]">
          Health Notes
        </h1>
        <CreateNote language={language} />
      </div>

      {notes.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No health notes yet"
          description="Record a health concern or visit by voice or text, and structured notes will be created for you."
        />
      ) : (
        <div className="flex flex-col gap-2">
          {notes.map((note) => {
            const actionCount = Array.isArray(note.action_items)
              ? note.action_items.length
              : 0;

            return (
              <Link
                key={note.id}
                href={`/health-notes/${note.id}`}
                aria-label={note.title}
                tabIndex={0}
                className="group flex items-center gap-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 transition-colors hover:border-[var(--color-accent)]/30"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-100 transition-colors group-hover:bg-[var(--color-accent)]/10">
                  <FileText
                    size={18}
                    className="text-[var(--color-muted)] transition-colors group-hover:text-[var(--color-accent)]"
                    aria-hidden="true"
                  />
                </div>

                <div className="flex flex-1 flex-col gap-1 overflow-hidden">
                  <span className="truncate text-sm font-medium text-[var(--color-foreground)]">
                    {note.title}
                  </span>
                  <div className="flex items-center gap-3 text-xs text-[var(--color-muted)]">
                    <span>{formatDate(note.created_at)}</span>
                    {actionCount > 0 && (
                      <span className="flex items-center gap-1">
                        <ListChecks size={12} aria-hidden="true" />
                        {actionCount} action {actionCount === 1 ? "item" : "items"}
                      </span>
                    )}
                  </div>
                </div>

                <ChevronRight
                  size={16}
                  className="shrink-0 text-[var(--color-border)] transition-colors group-hover:text-[var(--color-accent)]"
                  aria-hidden="true"
                />
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default HealthNotesPage;
