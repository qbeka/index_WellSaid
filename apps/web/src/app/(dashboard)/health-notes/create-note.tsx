"use client";

import { useState } from "react";
import { Plus, X, Loader2, Send } from "lucide-react";
import { useRouter } from "next/navigation";

type CreateNoteProps = {
  language: string;
};

export const CreateNote = ({ language }: CreateNoteProps) => {
  const [open, setOpen] = useState(false);
  const [rawText, setRawText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async () => {
    if (!rawText.trim() || loading) return;
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/extract-note", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawText: rawText.trim(), language }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong");
        setLoading(false);
        return;
      }

      setRawText("");
      setOpen(false);
      setLoading(false);
      router.refresh();
    } catch {
      setError("Failed to save note. Please try again.");
      setLoading(false);
    }
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Create new health note"
        tabIndex={0}
        className="flex h-11 items-center gap-2 rounded-full bg-[var(--color-accent)] px-4 text-sm font-medium text-[var(--color-accent-foreground)] transition-opacity hover:opacity-90 active:opacity-80"
      >
        <Plus size={16} aria-hidden="true" />
        New note
      </button>
    );
  }

  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[var(--color-foreground)]">
          New health note
        </h3>
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            setRawText("");
            setError("");
          }}
          aria-label="Cancel"
          tabIndex={0}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--color-muted)] transition-colors hover:bg-zinc-100"
        >
          <X size={16} />
        </button>
      </div>

      <textarea
        value={rawText}
        onChange={(e) => setRawText(e.target.value)}
        placeholder="Describe your health concern, symptoms, or what happened at your visit..."
        rows={4}
        autoFocus
        disabled={loading}
        aria-label="Health note content"
        className="w-full resize-none rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] px-4 py-3 text-sm leading-relaxed text-[var(--color-foreground)] outline-none placeholder:text-[var(--color-muted)] focus:border-[var(--color-accent)] disabled:opacity-50"
      />

      {error && (
        <p className="mt-2 text-sm text-[var(--color-danger)]">{error}</p>
      )}

      <div className="mt-3 flex justify-end">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!rawText.trim() || loading}
          aria-label="Process and save note"
          tabIndex={0}
          className="flex h-10 items-center gap-2 rounded-full bg-[var(--color-accent)] px-4 text-sm font-medium text-[var(--color-accent-foreground)] transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Send size={14} aria-hidden="true" />
              Save note
            </>
          )}
        </button>
      </div>
    </div>
  );
};
