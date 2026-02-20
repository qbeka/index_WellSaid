"use client";

import { useState } from "react";
import { Pencil, X, Loader2, Check } from "lucide-react";
import { updateHealthNote } from "../actions";
import { useRouter } from "next/navigation";

type EditNoteProps = {
  id: string;
  title: string;
  content: string;
};

export const EditNote = ({ id, title, content }: EditNoteProps) => {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ title, content });
  const router = useRouter();

  const handleSave = async () => {
    if (!form.title.trim() || !form.content.trim()) return;
    setSaving(true);
    const result = await updateHealthNote(id, form);
    setSaving(false);
    if (result.success) {
      setEditing(false);
      router.refresh();
    }
  };

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        aria-label="Edit health note"
        tabIndex={0}
        className="flex h-11 items-center gap-2 rounded-xl bg-[var(--color-accent-soft)] px-4 text-sm font-medium text-[var(--color-accent)] transition-all hover:bg-[var(--color-accent-soft)] active:scale-[0.97]"
      >
        <Pencil size={15} />
        Edit
      </button>
    );
  }

  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-[15px] font-semibold text-[var(--color-foreground)]">
          Edit Health Note
        </h3>
        <button
          type="button"
          onClick={() => {
            setEditing(false);
            setForm({ title, content });
          }}
          aria-label="Cancel editing"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--color-muted)] hover:bg-[var(--color-background-muted)]"
        >
          <X size={16} />
        </button>
      </div>

      <div className="flex flex-col gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-[var(--color-muted)]">Title</label>
          <input
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="h-11 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] px-3 text-[15px] text-[var(--color-foreground)] outline-none focus:border-[var(--color-accent)]"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-[var(--color-muted)]">Content</label>
          <textarea
            value={form.content}
            onChange={(e) => setForm({ ...form, content: e.target.value })}
            rows={6}
            className="w-full resize-none rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-[15px] leading-relaxed text-[var(--color-foreground)] outline-none focus:border-[var(--color-accent)]"
          />
        </div>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || !form.title.trim() || !form.content.trim()}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[var(--color-accent)] text-[15px] font-medium text-white transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-40"
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
          {saving ? "Saving..." : "Save changes"}
        </button>
      </div>
    </div>
  );
};
