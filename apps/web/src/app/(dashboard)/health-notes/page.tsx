import { FileText, ChevronRight, ListChecks } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { getHealthNotes } from "./actions";
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
  const notes = await getHealthNotes();

  return (
    <div className="flex flex-col gap-5">
      <p className="text-sm text-[var(--color-muted)]">
        Your health notes from visits, updated in real time.
      </p>

      {notes.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No health notes yet"
          description="Health notes from your visits will show up here so you can review symptoms, injuries, and pain history."
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
                className="group flex items-center gap-4 rounded-2xl border-2 border-dashed border-[var(--color-border)] bg-[var(--color-surface)] p-4 transition-all hover:border-[var(--color-accent)]/30 hover:shadow-sm active:scale-[0.995]"
              >
                <div className="flex flex-1 flex-col gap-1 overflow-hidden">
                  <span className="truncate text-[15px] font-medium text-[var(--color-foreground)]">
                    {note.title}
                  </span>
                  <div className="flex items-center gap-3 text-xs text-[var(--color-muted)]">
                    <span>{formatDate(note.created_at)}</span>
                    {actionCount > 0 && (
                      <span className="flex items-center gap-1 text-[var(--color-accent)]">
                        <ListChecks size={12} aria-hidden="true" />
                        {actionCount} action{" "}
                        {actionCount === 1 ? "item" : "items"}
                      </span>
                    )}
                  </div>
                </div>

                <ChevronRight
                  size={18}
                  className="shrink-0 text-[var(--color-muted)]/40 transition-colors group-hover:text-[var(--color-accent)]"
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
