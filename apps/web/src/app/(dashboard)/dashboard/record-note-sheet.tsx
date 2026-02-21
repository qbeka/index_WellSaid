"use client";

import { useState, useEffect } from "react";
import { Mic, Square, Loader2 } from "lucide-react";
import { motion } from "motion/react";
import { useRouter } from "next/navigation";
import { useTranscription } from "@/hooks/use-transcription";
import { SUPPORTED_LANGUAGES } from "@wellsaid/shared";

type RecordNoteSheetProps = {
  onClose: () => void;
  language?: string;
};

export const RecordNoteSheet = ({
  onClose,
  language = "en",
}: RecordNoteSheetProps) => {
  const [saving, setSaving] = useState(false);
  const { transcript, isListening, start, stop } = useTranscription({
    language,
  });
  const router = useRouter();

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
      stop();
    };
  }, [stop]);

  const handleStartRecording = async () => {
    await start();
  };

  const handleStopRecording = async () => {
    stop();

    if (!transcript.trim()) return;

    setSaving(true);
    try {
      const res = await fetch("/api/extract-note", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rawText: transcript.trim(),
          language:
            SUPPORTED_LANGUAGES.find((l) => l.code === language)?.label ||
            "English",
        }),
      });

      if (res.ok) {
        router.push("/health-notes");
        router.refresh();
        onClose();
      }
    } catch {
      setSaving(false);
    }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-40 bg-black/30"
        onClick={!isListening && !saving ? onClose : undefined}
        aria-hidden="true"
      />

      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        className="fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl bg-[var(--color-surface)] shadow-xl"
      >
        <div className="mx-auto max-w-2xl px-6 pb-8 pt-6">
          <div className="mx-auto mb-6 h-1 w-12 rounded-full bg-[var(--color-border)]" />

          <div className="mb-6 flex flex-col items-center gap-2">
            <h2 className="text-lg font-semibold text-[var(--color-foreground)]">
              Record Health Note
            </h2>
            <p className="text-center text-[15px] leading-relaxed text-[var(--color-muted)]">
              Record health incidents you&apos;re experiencing, and we&apos;ll
              use this information to help you.
            </p>
          </div>

          <div className="mb-6 min-h-[120px] rounded-2xl border-2 border-dashed border-[var(--color-border)] bg-[var(--color-background)] p-4">
            {transcript ? (
              <p className="text-[15px] leading-relaxed text-[var(--color-foreground)]">
                {transcript}
              </p>
            ) : (
              <p className="text-center text-[15px] text-[var(--color-muted)]">
                {isListening
                  ? "Listening..."
                  : "Your transcript will appear here"}
              </p>
            )}
          </div>

          {saving ? (
            <div className="flex h-14 w-full items-center justify-center gap-3 rounded-2xl bg-[var(--color-accent)] text-[15px] font-medium text-white">
              <Loader2 size={20} className="animate-spin" />
              Processing...
            </div>
          ) : isListening ? (
            <button
              type="button"
              onClick={handleStopRecording}
              aria-label="Stop recording and save"
              tabIndex={0}
              className="flex h-14 w-full items-center justify-center gap-3 rounded-2xl bg-[var(--color-danger)] text-[15px] font-medium text-white transition-all hover:opacity-90 active:scale-[0.98]"
            >
              <Square size={20} aria-hidden="true" />
              Stop Recording
            </button>
          ) : (
            <button
              type="button"
              onClick={handleStartRecording}
              aria-label="Start recording"
              tabIndex={0}
              className="flex h-14 w-full items-center justify-center gap-3 rounded-2xl bg-[var(--color-accent)] text-[15px] font-medium text-white transition-all hover:opacity-90 active:scale-[0.98]"
            >
              <Mic size={20} aria-hidden="true" />
              Start Recording
            </button>
          )}
        </div>
      </motion.div>
    </>
  );
};
