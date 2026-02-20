"use client";

import { useState } from "react";
import { Plus, X, Loader2, CalendarPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { createAppointment } from "./actions";

export const CreateAppointment = () => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [title, setTitle] = useState("");
  const [providerName, setProviderName] = useState("");
  const [location, setLocation] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [notes, setNotes] = useState("");
  const router = useRouter();

  const handleReset = () => {
    setTitle("");
    setProviderName("");
    setLocation("");
    setDate("");
    setTime("");
    setNotes("");
    setError("");
    setOpen(false);
  };

  const handleSubmit = async () => {
    if (!title.trim() || !date || loading) return;
    setLoading(true);
    setError("");

    const result = await createAppointment({
      title,
      providerName,
      location,
      date,
      time,
      notes,
    });

    if (result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    handleReset();
    setLoading(false);
    router.refresh();
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Schedule new appointment"
        tabIndex={0}
        className="flex h-11 items-center gap-2 rounded-full bg-[var(--color-accent)] px-4 text-sm font-medium text-[var(--color-accent-foreground)] transition-all hover:opacity-90 active:scale-[0.97]"
      >
        <Plus size={16} aria-hidden="true" />
        New appointment
      </button>
    );
  }

  const inputClass =
    "h-12 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] px-4 text-[15px] text-[var(--color-foreground)] outline-none placeholder:text-[var(--color-muted)] focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent)]/10 disabled:opacity-50";

  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarPlus
            size={18}
            className="text-[var(--color-accent)]"
            aria-hidden="true"
          />
          <h3 className="text-[15px] font-semibold text-[var(--color-foreground)]">
            New appointment
          </h3>
        </div>
        <button
          type="button"
          onClick={handleReset}
          aria-label="Cancel"
          tabIndex={0}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--color-muted)] transition-colors hover:bg-[var(--color-border)]"
        >
          <X size={16} />
        </button>
      </div>

      <div className="flex flex-col gap-3">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="What is this appointment for?"
          autoFocus
          disabled={loading}
          aria-label="Appointment title"
          className={inputClass}
        />

        <input
          type="text"
          value={providerName}
          onChange={(e) => setProviderName(e.target.value)}
          placeholder="Doctor or provider name (optional)"
          disabled={loading}
          aria-label="Provider name"
          className={inputClass}
        />

        <input
          type="text"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="Location (optional)"
          disabled={loading}
          aria-label="Location"
          className={inputClass}
        />

        <div className="grid grid-cols-2 gap-3">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            disabled={loading}
            aria-label="Date"
            className={inputClass}
          />
          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            disabled={loading}
            aria-label="Time"
            className={inputClass}
          />
        </div>

        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Any notes or questions for this visit? (optional)"
          rows={2}
          disabled={loading}
          aria-label="Notes"
          className="w-full resize-none rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] px-4 py-3 text-[15px] leading-relaxed text-[var(--color-foreground)] outline-none placeholder:text-[var(--color-muted)] focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent)]/10 disabled:opacity-50"
        />

        {error && (
          <p className="text-sm text-[var(--color-danger)]">{error}</p>
        )}

        <button
          type="button"
          onClick={handleSubmit}
          disabled={!title.trim() || !date || loading}
          aria-label="Save appointment"
          tabIndex={0}
          className="flex h-12 items-center justify-center gap-2 rounded-xl bg-[var(--color-accent)] text-[15px] font-medium text-[var(--color-accent-foreground)] transition-all hover:opacity-90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
        >
          {loading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Saving...
            </>
          ) : (
            "Schedule appointment"
          )}
        </button>
      </div>
    </div>
  );
};
