"use client";

import { useState, useRef, useEffect } from "react";
import { Mic, Square, Loader2, RotateCcw, PenLine, SendHorizonal } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/i18n";
import { useTranscription } from "@/hooks/use-transcription";

type Phase = "ready" | "recording" | "typing" | "processing";

type ConversationContentProps = {
  preferredLanguage: string;
};

const ConversationContent = ({ preferredLanguage }: ConversationContentProps) => {
  const { t } = useTranslation();
  const [phase, setPhase] = useState<Phase>("ready");
  const [typedText, setTypedText] = useState("");
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState("");
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const router = useRouter();

  const { transcript, start, stop } = useTranscription({
    language: preferredLanguage,
  });

  const today = new Date().toLocaleDateString("en-US", {
    month: "numeric",
    day: "numeric",
    year: "2-digit",
  });

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  useEffect(() => {
    return () => {
      stop();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [stop]);

  useEffect(() => {
    if (phase === "typing" && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [phase]);

  const handleStart = async () => {
    try {
      await start();
      setPhase("recording");
      setElapsed(0);
      setError("");

      timerRef.current = setInterval(() => {
        setElapsed((prev) => prev + 1);
      }, 1000);
    } catch {
      setError(t("conversation.micError"));
    }
  };

  const handleStop = async () => {
    stop();
    if (timerRef.current) clearInterval(timerRef.current);

    if (!transcript.trim() || transcript.trim().length < 10) {
      setPhase("ready");
      setError(t("conversation.tooShort"));
      return;
    }

    await submitVisit(transcript.trim());
  };

  const handleSubmitText = async () => {
    if (!typedText.trim() || typedText.trim().length < 10) {
      setError(t("conversation.moreDetail"));
      return;
    }
    await submitVisit(typedText.trim());
  };

  const submitVisit = async (text: string) => {
    setPhase("processing");
    setError("");

    try {
      const res = await fetch("/api/summarize-visit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript: text }),
      });

      const data = await res.json();

      if (res.ok) {
        router.push(`/sessions/${data.session.id}`);
      } else {
        setError(data.error || t("conversation.failedToProcess"));
        setPhase("ready");
      }
    } catch {
      setError(t("common.somethingWrong"));
      setPhase("ready");
    }
  };

  return (
    <div className="-mx-5 flex min-h-[calc(100vh-3.5rem)] flex-col">
      <div className="flex flex-1 flex-col px-4">
        <p className="py-4 text-[15px] text-[var(--color-foreground)]">
          {t("conversation.title")} on {today}
        </p>

        <div className="flex flex-1 flex-col rounded-2xl bg-[var(--color-background-muted)]">
          <AnimatePresence mode="wait">
            {phase === "processing" ? (
              <motion.div
                key="processing"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-1 flex-col items-center justify-center gap-4"
              >
                <Loader2
                  size={36}
                  className="animate-spin text-[var(--color-accent)]"
                />
                <p className="text-[15px] text-[var(--color-muted)]">
                  {t("conversation.processing")}
                </p>
              </motion.div>
            ) : phase === "recording" ? (
              <motion.div
                key="recording"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-1 flex-col p-4"
              >
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-xs font-medium text-[var(--color-muted)]">
                    {t("conversation.recording")} {formatTime(elapsed)}
                  </span>
                  <motion.div
                    animate={{ opacity: [1, 0.3, 1] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                    className="h-2.5 w-2.5 rounded-full bg-[var(--color-danger)]"
                  />
                </div>
                <div className="flex-1 overflow-y-auto">
                  {transcript ? (
                    <p className="text-[15px] leading-relaxed text-[var(--color-foreground)]">
                      {transcript}
                    </p>
                  ) : (
                    <p className="text-[15px] text-[var(--color-muted)]">
                      {t("conversation.listening")}
                    </p>
                  )}
                </div>
              </motion.div>
            ) : phase === "typing" ? (
              <motion.div
                key="typing"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-1 flex-col p-4"
              >
                <span className="mb-3 text-xs font-medium text-[var(--color-muted)]">
                  {t("conversation.writePrompt")}
                </span>
                <textarea
                  ref={textareaRef}
                  value={typedText}
                  onChange={(e) => setTypedText(e.target.value)}
                  placeholder={t("conversation.writePlaceholder")}
                  className="flex-1 resize-none bg-transparent text-[15px] leading-relaxed text-[var(--color-foreground)] outline-none placeholder:text-[var(--color-muted)]"
                />
              </motion.div>
            ) : (
              <motion.div
                key="ready"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-1 flex-col items-center justify-center gap-5 px-6"
              >
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={handleStart}
                    aria-label="Record with voice"
                    tabIndex={0}
                    className="flex h-20 w-20 items-center justify-center rounded-full bg-[var(--color-accent)] text-white shadow-lg transition-all hover:opacity-90 active:scale-90"
                  >
                    <Mic size={32} />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPhase("typing");
                      setError("");
                      setTypedText("");
                    }}
                    aria-label="Write visit notes"
                    tabIndex={0}
                    className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-accent)] shadow transition-all hover:border-[var(--color-accent)]/30 active:scale-90"
                  >
                    <PenLine size={28} />
                  </button>
                </div>
                <p className="text-center text-[15px] text-[var(--color-muted)]">
                  {t("conversation.recordOrWrite")}
                </p>
                {error && (
                  <p className="text-center text-[14px] text-[var(--color-danger)]">
                    {error}
                  </p>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="py-4">
          {phase === "recording" ? (
            <button
              type="button"
              onClick={handleStop}
              aria-label="Stop recording"
              tabIndex={0}
              className="flex h-14 w-full items-center justify-center gap-3 rounded-2xl bg-[var(--color-danger)] text-[15px] font-medium text-white transition-all hover:opacity-90 active:scale-[0.98]"
            >
              <Square size={18} aria-hidden="true" />
              {t("conversation.endRecording")}
            </button>
          ) : phase === "typing" ? (
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={handleSubmitText}
                disabled={!typedText.trim()}
                aria-label="Submit visit notes"
                tabIndex={0}
                className="flex h-14 w-full items-center justify-center gap-3 rounded-2xl bg-[var(--color-accent)] text-[15px] font-medium text-white transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-40"
              >
                <SendHorizonal size={18} aria-hidden="true" />
                {t("conversation.submitNotes")}
              </button>
              {error && (
                <p className="text-center text-[14px] text-[var(--color-danger)]">
                  {error}
                </p>
              )}
              <button
                type="button"
                onClick={() => {
                  setPhase("ready");
                  setTypedText("");
                  setError("");
                }}
                aria-label={t("common.goBack")}
                tabIndex={0}
                className="flex h-11 w-full items-center justify-center rounded-2xl text-[14px] font-medium text-[var(--color-muted)] transition-all hover:bg-[var(--color-background-muted)]"
              >
                {t("common.goBack")}
              </button>
            </div>
          ) : phase === "ready" ? (
            <Link
              href="/dashboard"
              aria-label={t("common.backToHome")}
              tabIndex={0}
              className="flex h-14 w-full items-center justify-center gap-3 rounded-2xl border border-[var(--color-border)] text-[15px] font-medium text-[var(--color-muted)] transition-all hover:bg-[var(--color-background-muted)] active:scale-[0.98]"
            >
              <RotateCcw size={16} aria-hidden="true" />
              {t("common.backToHome")}
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default ConversationContent;
