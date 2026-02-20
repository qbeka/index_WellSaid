import { FolderOpen, ScanLine, ChevronRight } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const DocumentsPage = async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let documents: { id: string; title: string; summary: string; created_at: string }[] = [];

  if (user) {
    const { data } = await supabase
      .from("documents")
      .select("id, title, summary, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    documents = data ?? [];
  }

  return (
    <div className="flex flex-col gap-5">
      <p className="text-sm text-[var(--color-muted)]">
        Summaries from scanned documents, updated in real time.
      </p>

      {documents.length === 0 ? (
        <EmptyState
          icon={FolderOpen}
          title="No documents yet"
          description="Scan a document from the menu to create summaries from photos of forms, prescriptions, or notes."
        />
      ) : (
        <div className="flex flex-col gap-2">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4"
            >
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-[15px] font-medium text-[var(--color-foreground)]">
                  {doc.title}
                </h3>
                <span className="text-xs text-[var(--color-muted)]">
                  {formatDate(doc.created_at)}
                </span>
              </div>
              <p className="text-sm leading-relaxed text-[var(--color-muted)]">
                {doc.summary}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DocumentsPage;
