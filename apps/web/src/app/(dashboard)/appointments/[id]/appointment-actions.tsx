"use client";

import { useState } from "react";
import { Check, XCircle, Trash2, Loader2, Undo2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { updateAppointmentStatus, deleteAppointment } from "../actions";

type AppointmentActionsProps = {
  id: string;
  currentStatus: string;
};

export const AppointmentActions = ({
  id,
  currentStatus,
}: AppointmentActionsProps) => {
  const [loading, setLoading] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const router = useRouter();

  const handleStatus = async (status: "upcoming" | "completed" | "cancelled") => {
    setLoading(status);
    await updateAppointmentStatus(id, status);
    setLoading("");
    router.refresh();
  };

  const handleDelete = async () => {
    setLoading("delete");
    const result = await deleteAppointment(id);
    if (result.success) {
      router.push("/appointments");
    } else {
      setLoading("");
      setConfirmDelete(false);
    }
  };

  return (
    <div className="flex flex-col gap-3 pt-2">
      <div className="flex flex-wrap gap-2">
        {currentStatus === "upcoming" && (
          <>
            <button
              type="button"
              onClick={() => handleStatus("completed")}
              disabled={!!loading}
              aria-label="Mark as completed"
              tabIndex={0}
              className="flex h-11 items-center gap-2 rounded-xl bg-emerald-50 px-4 text-sm font-medium text-emerald-600 transition-all hover:bg-emerald-100 active:scale-[0.97] disabled:opacity-50"
            >
              {loading === "completed" ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Check size={14} aria-hidden="true" />
              )}
              Mark completed
            </button>
            <button
              type="button"
              onClick={() => handleStatus("cancelled")}
              disabled={!!loading}
              aria-label="Cancel appointment"
              tabIndex={0}
              className="flex h-11 items-center gap-2 rounded-xl border border-[var(--color-border)] px-4 text-sm font-medium text-[var(--color-muted)] transition-all hover:bg-zinc-50 active:scale-[0.97] disabled:opacity-50"
            >
              {loading === "cancelled" ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <XCircle size={14} aria-hidden="true" />
              )}
              Cancel
            </button>
          </>
        )}

        {(currentStatus === "completed" || currentStatus === "cancelled") && (
          <button
            type="button"
            onClick={() => handleStatus("upcoming")}
            disabled={!!loading}
            aria-label="Restore to upcoming"
            tabIndex={0}
            className="flex h-11 items-center gap-2 rounded-xl bg-[var(--color-accent-soft)] px-4 text-sm font-medium text-[var(--color-accent)] transition-all hover:bg-indigo-100 active:scale-[0.97] disabled:opacity-50"
          >
            {loading === "upcoming" ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Undo2 size={14} aria-hidden="true" />
            )}
            Restore
          </button>
        )}
      </div>

      <div className="pt-2">
        {!confirmDelete ? (
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            aria-label="Delete appointment"
            tabIndex={0}
            className="flex h-10 items-center gap-2 rounded-xl border border-[var(--color-danger)]/20 px-4 text-sm font-medium text-[var(--color-danger)] transition-colors hover:bg-[var(--color-danger)]/5"
          >
            <Trash2 size={14} aria-hidden="true" />
            Delete appointment
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDelete}
              disabled={!!loading}
              aria-label="Confirm delete"
              tabIndex={0}
              className="flex h-10 items-center gap-2 rounded-xl bg-[var(--color-danger)] px-4 text-sm font-medium text-white transition-opacity disabled:opacity-50"
            >
              {loading === "delete" ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Trash2 size={14} aria-hidden="true" />
              )}
              Confirm delete
            </button>
            <button
              type="button"
              onClick={() => setConfirmDelete(false)}
              aria-label="Cancel delete"
              tabIndex={0}
              className="flex h-10 items-center rounded-xl border border-[var(--color-border)] px-4 text-sm font-medium text-[var(--color-muted)] transition-colors hover:bg-zinc-50"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
