"use client";

import { useState } from "react";
import { Bot, ListChecks, Calendar, Mic } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { RecordNoteSheet } from "./record-note-sheet";

type HomeContentProps = {
  firstName: string;
  actionItemCount: number;
  upcomingAppointments: number;
};

export const HomeContent = ({
  firstName,
  actionItemCount,
  upcomingAppointments,
}: HomeContentProps) => {
  const [recordOpen, setRecordOpen] = useState(false);

  const greeting = firstName ? `Welcome back, ${firstName}!` : "Welcome back!";

  const hasSummary = actionItemCount > 0 || upcomingAppointments > 0;

  return (
    <>
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-5 px-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--color-accent-soft)]">
          <Bot
            size={28}
            className="text-[var(--color-accent)]"
            aria-hidden="true"
          />
        </div>

        <div className="flex flex-col items-center gap-2">
          <h1 className="text-2xl font-semibold tracking-tight text-[var(--color-foreground)]">
            {greeting}
          </h1>
          <p className="max-w-sm text-center text-[15px] leading-relaxed text-[var(--color-muted)]">
            Below is a quick summary of your wellbeing and action items
          </p>
        </div>

        {hasSummary ? (
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            {upcomingAppointments > 0 && (
              <div className="flex items-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2.5">
                <Calendar
                  size={16}
                  className="text-[var(--color-accent)]"
                  aria-hidden="true"
                />
                <span className="text-sm text-[var(--color-foreground)]">
                  {upcomingAppointments} upcoming{" "}
                  {upcomingAppointments === 1 ? "appointment" : "appointments"}
                </span>
              </div>
            )}
            {actionItemCount > 0 && (
              <div className="flex items-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2.5">
                <ListChecks
                  size={16}
                  className="text-[var(--color-accent)]"
                  aria-hidden="true"
                />
                <span className="text-sm text-[var(--color-foreground)]">
                  {actionItemCount} action{" "}
                  {actionItemCount === 1 ? "item" : "items"}
                </span>
              </div>
            )}
          </div>
        ) : (
          <p className="max-w-sm text-center text-sm text-[var(--color-muted)]">
            No upcoming appointments or action items. Check back after your next
            visit.
          </p>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-20 bg-[var(--color-surface)] shadow-[0_-1px_3px_0_rgba(0,0,0,0.05)]">
        <div className="mx-auto max-w-2xl px-4 py-4">
          <button
            type="button"
            onClick={() => setRecordOpen(true)}
            aria-label="Record health note"
            tabIndex={0}
            className="flex h-14 w-full items-center justify-center gap-3 rounded-2xl bg-[var(--color-foreground)] text-[15px] font-medium text-[var(--color-background)] transition-all hover:opacity-90 active:scale-[0.98]"
          >
            <Mic size={18} aria-hidden="true" />
            Start Recording
          </button>
        </div>
      </div>

      <AnimatePresence>
        {recordOpen && (
          <RecordNoteSheet onClose={() => setRecordOpen(false)} />
        )}
      </AnimatePresence>
    </>
  );
};
