"use client";

import { useState } from "react";
import { Trash2, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { deleteHealthNote } from "../actions";

type DeleteNoteButtonProps = {
  id: string;
};

export const DeleteNoteButton = ({ id }: DeleteNoteButtonProps) => {
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    setLoading(true);
    const result = await deleteHealthNote(id);
    if (result.success) {
      router.push("/health-notes");
    } else {
      setLoading(false);
      setConfirming(false);
    }
  };

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        aria-label="Delete this note"
        tabIndex={0}
        className="flex h-10 items-center gap-2 rounded-full border border-[var(--color-danger)]/20 px-4 text-sm font-medium text-[var(--color-danger)] transition-colors hover:bg-[var(--color-danger)]/5"
      >
        <Trash2 size={14} aria-hidden="true" />
        Delete note
      </button>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={handleDelete}
        disabled={loading}
        aria-label="Confirm delete"
        tabIndex={0}
        className="flex h-10 items-center gap-2 rounded-full bg-[var(--color-danger)] px-4 text-sm font-medium text-white transition-opacity disabled:opacity-50"
      >
        {loading ? (
          <Loader2 size={14} className="animate-spin" />
        ) : (
          <Trash2 size={14} aria-hidden="true" />
        )}
        {loading ? "Deleting..." : "Confirm delete"}
      </button>
      <button
        type="button"
        onClick={() => setConfirming(false)}
        aria-label="Cancel delete"
        tabIndex={0}
        className="flex h-10 items-center rounded-full border border-[var(--color-border)] px-4 text-sm font-medium text-[var(--color-muted)] transition-colors hover:bg-zinc-50"
      >
        Cancel
      </button>
    </div>
  );
};
