import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ArrowLeft, FileText, Calendar } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

type PageProps = {
  params: Promise<{ id: string }>;
};

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
};

const DocumentDetailPage = async ({ params }: PageProps) => {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) notFound();

  const { data: doc } = await supabase
    .from("documents")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!doc) notFound();

  const hasImage =
    doc.image_url &&
    doc.image_url !== "no-image" &&
    doc.image_url !== "upload-failed";

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Link
          href="/documents"
          aria-label="Back to documents"
          tabIndex={0}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-[var(--color-muted)] transition-colors hover:bg-[var(--color-background-muted)]"
        >
          <ArrowLeft size={18} />
        </Link>
        <h1 className="flex-1 text-xl font-semibold tracking-tight text-[var(--color-foreground)]">
          {doc.title}
        </h1>
      </div>

      <div className="flex items-center gap-2 text-xs text-[var(--color-muted)]">
        <Calendar size={12} aria-hidden="true" />
        {formatDate(doc.created_at)}
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 text-sm font-semibold text-[var(--color-foreground)]">
          <FileText size={14} aria-hidden="true" />
          Summary
        </div>
        <div className="rounded-2xl border-2 border-dashed border-[var(--color-border)] bg-[var(--color-surface)] p-5">
          <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-[var(--color-foreground)]">
            {doc.summary}
          </p>
        </div>
      </div>

      {hasImage && (
        <div className="flex flex-col gap-2">
          <span className="text-sm font-semibold text-[var(--color-foreground)]">
            Original Document
          </span>
          <div className="overflow-hidden rounded-2xl border-2 border-dashed border-[var(--color-border)]">
            <Image
              src={doc.image_url}
              alt={doc.title}
              width={800}
              height={1000}
              className="h-auto w-full object-contain"
              unoptimized
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentDetailPage;
