import { FolderOpen, ChevronRight } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { t } from "@/i18n";
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

  let lang = "en";
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("preferred_language")
      .eq("id", user.id)
      .single();
    if (profile?.preferred_language) {
      lang = profile.preferred_language;
    }
  }

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
        {t(lang, "documents.subtitle")}
      </p>

      {documents.length === 0 ? (
        <EmptyState
          icon={FolderOpen}
          title={t(lang, "documents.empty")}
          description={t(lang, "documents.emptyDesc")}
        />
      ) : (
        <div className="flex flex-col gap-2">
          {documents.map((doc) => (
            <Link
              key={doc.id}
              href={`/documents/${doc.id}`}
              tabIndex={0}
              className="group rounded-2xl border-2 border-dashed border-[var(--color-border)] bg-[var(--color-surface)] p-4 transition-all hover:border-[var(--color-accent)]/30 hover:shadow-sm active:scale-[0.995]"
            >
              <div className="flex items-center justify-between">
                <div className="flex flex-1 flex-col gap-1 overflow-hidden">
                  <span className="truncate text-[15px] font-medium text-[var(--color-foreground)]">
                    {doc.title}
                  </span>
                  <p className="line-clamp-2 text-sm leading-relaxed text-[var(--color-muted)]">
                    {doc.summary}
                  </p>
                  <span className="mt-1 text-xs text-[var(--color-muted)]">
                    {formatDate(doc.created_at)}
                  </span>
                </div>
                <ChevronRight
                  size={18}
                  className="ml-3 shrink-0 text-[var(--color-muted)]/40 transition-colors group-hover:text-[var(--color-accent)]"
                  aria-hidden="true"
                />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default DocumentsPage;
