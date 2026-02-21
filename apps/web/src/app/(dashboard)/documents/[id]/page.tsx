import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ArrowLeft, FileText, Calendar, Tag, FlaskConical, Pill } from "lucide-react";
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

const DOC_TYPE_LABELS: Record<string, string> = {
  prescription: "Prescription",
  lab_result: "Lab Result",
  discharge_summary: "Discharge Summary",
  referral: "Referral",
  imaging_report: "Imaging Report",
  insurance: "Insurance",
  receipt: "Receipt",
  other: "Other",
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

  let imageUrl = doc.image_url;
  if (
    doc.storage_path &&
    doc.image_url !== "no-image" &&
    doc.image_url !== "upload-failed"
  ) {
    const { data: signedData } = await supabase.storage
      .from("documents")
      .createSignedUrl(doc.storage_path, 60 * 60);

    if (signedData?.signedUrl) {
      imageUrl = signedData.signedUrl;
    }
  }

  const hasImage =
    imageUrl &&
    imageUrl !== "no-image" &&
    imageUrl !== "upload-failed";

  const keyFindings: string[] = Array.isArray(doc.key_findings)
    ? doc.key_findings
    : [];
  const medications: string[] = Array.isArray(doc.medications)
    ? doc.medications
    : [];
  const docType = doc.document_type
    ? DOC_TYPE_LABELS[doc.document_type] || doc.document_type
    : null;

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

      <div className="flex flex-wrap items-center gap-3 text-xs text-[var(--color-muted)]">
        <span className="flex items-center gap-1.5">
          <Calendar size={12} aria-hidden="true" />
          {formatDate(doc.created_at)}
        </span>
        {docType && (
          <span className="flex items-center gap-1.5 rounded-full bg-[var(--color-accent-soft)] px-2.5 py-1 text-[var(--color-accent)]">
            <Tag size={10} aria-hidden="true" />
            {docType}
          </span>
        )}
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

      {keyFindings.length > 0 && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-sm font-semibold text-[var(--color-foreground)]">
            <FlaskConical size={14} aria-hidden="true" />
            Key Findings
          </div>
          <div className="flex flex-col gap-1.5">
            {keyFindings.map((finding, i) => (
              <div
                key={i}
                className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2.5 text-[14px] text-[var(--color-foreground)]"
              >
                {finding}
              </div>
            ))}
          </div>
        </div>
      )}

      {medications.length > 0 && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-sm font-semibold text-[var(--color-foreground)]">
            <Pill size={14} aria-hidden="true" />
            Medications
          </div>
          <div className="flex flex-wrap gap-2">
            {medications.map((med, i) => (
              <span
                key={i}
                className="rounded-full bg-[var(--color-accent-soft)] px-3 py-1.5 text-[13px] font-medium text-[var(--color-accent)]"
              >
                {med}
              </span>
            ))}
          </div>
        </div>
      )}

      {hasImage && (
        <div className="flex flex-col gap-2">
          <span className="text-sm font-semibold text-[var(--color-foreground)]">
            Original Document
          </span>
          <div className="overflow-hidden rounded-2xl border-2 border-dashed border-[var(--color-border)]">
            <Image
              src={imageUrl}
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
