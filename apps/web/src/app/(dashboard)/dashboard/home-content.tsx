"use client";

import { useState, useRef, useEffect } from "react";
import { useChat } from "@ai-sdk/react";
import {
  ListChecks,
  Calendar,
  Mic,
  SendHorizonal,
  NotebookPen,
  CalendarPlus,
  ArrowRight,
  Square,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { RecordNoteSheet } from "./record-note-sheet";
import Link from "next/link";
import { useTranscription } from "@/hooks/use-transcription";

type ActionItem = {
  text: string;
  source: string;
  date: string;
};

type HomeContentProps = {
  firstName: string;
  actionItems: ActionItem[];
  upcomingAppointments: number;
  preferredLanguage: string;
};

const QUICK_PROMPTS = [
  "Summarize my overall health.",
  "What action items do I have?",
  "What are my upcoming appointments?",
  "Summarize my recent documents.",
] as const;

const getMessageText = (message: {
  parts: Array<{ type: string; text?: string }>;
}) =>
  message.parts
    .filter((p): p is { type: "text"; text: string } => p.type === "text")
    .map((p) => p.text)
    .join("");

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
};

export const HomeContent = ({
  firstName,
  actionItems,
  upcomingAppointments,
  preferredLanguage,
}: HomeContentProps) => {
  const [recordOpen, setRecordOpen] = useState(false);
  const [promptIndex, setPromptIndex] = useState(0);
  const [inputText, setInputText] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { transcript, isListening, start, stop } = useTranscription({
    language: preferredLanguage,
  });
  const { messages, sendMessage, status } = useChat();
  const isLoading = status === "submitted" || status === "streaming";
  const hasMessages = messages.length > 0;

  const greeting = firstName ? `Welcome back, ${firstName}!` : "Welcome back!";
  const hasSummary = actionItems.length > 0 || upcomingAppointments > 0;

  useEffect(() => {
    const interval = setInterval(() => {
      setPromptIndex((prev) => (prev + 1) % QUICK_PROMPTS.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    return () => {
      stop();
    };
  }, [stop]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleMicToggle = async () => {
    if (isListening) {
      stop();
      if (transcript.trim()) {
        setInputText(transcript.trim());
      }
      return;
    }
    await start();
  };

  const handleSend = () => {
    const text = inputText.trim();
    if (!text || isLoading) return;
    setInputText("");
    sendMessage({ text });
  };

  const handlePromptClick = (prompt: string) => {
    if (isLoading) return;
    sendMessage({ text: prompt });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      <div className="flex flex-1 flex-col pb-56">
        <AnimatePresence mode="wait">
          {!hasMessages ? (
            <motion.div
              key="welcome"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col gap-6 px-4 pt-4"
            >
              <div className="flex flex-col items-center gap-2 pt-8">
                <h1 className="text-2xl font-semibold tracking-tight text-[var(--color-foreground)]">
                  {greeting}
                </h1>
                <p className="max-w-sm text-center text-[15px] leading-relaxed text-[var(--color-muted)]">
                  Here&apos;s a summary of your health and action items
                </p>
              </div>

              {hasSummary ? (
                <div className="flex flex-col gap-4">
                  {upcomingAppointments > 0 && (
                    <Link
                      href="/appointments"
                      className="flex items-center gap-3 rounded-xl border-2 border-dashed border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 transition-colors hover:bg-[var(--color-background-muted)]"
                    >
                      <Calendar
                        size={18}
                        className="shrink-0 text-[var(--color-accent)]"
                        aria-hidden="true"
                      />
                      <span className="text-[15px] text-[var(--color-foreground)]">
                        {upcomingAppointments} upcoming{" "}
                        {upcomingAppointments === 1
                          ? "appointment"
                          : "appointments"}
                      </span>
                    </Link>
                  )}

                  {actionItems.length > 0 && (
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center justify-between px-1">
                        <h2 className="flex items-center gap-2 text-[14px] font-semibold text-[var(--color-foreground)]">
                          <ListChecks size={16} className="text-[var(--color-accent)]" aria-hidden="true" />
                          Action Items
                        </h2>
                        <Link
                          href="/action-items"
                          className="text-[13px] font-medium text-[var(--color-accent)] transition-colors hover:underline"
                        >
                          View all
                        </Link>
                      </div>
                      <div className="flex flex-col gap-1.5">
                        {actionItems.slice(0, 8).map((item, i) => (
                          <div
                            key={`${item.source}-${i}`}
                            className="flex items-start gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3"
                          >
                            <CheckCircle2
                              size={16}
                              className="mt-0.5 shrink-0 text-[var(--color-accent)]"
                              aria-hidden="true"
                            />
                            <div className="flex flex-1 flex-col gap-0.5">
                              <span className="text-[14px] leading-relaxed text-[var(--color-foreground)]">
                                {item.text}
                              </span>
                              <span className="text-[12px] text-[var(--color-muted)]">
                                {item.source} &mdash; {formatDate(item.date)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="max-w-sm self-center text-center text-[15px] text-[var(--color-muted)]">
                  No upcoming appointments or action items. Check back after
                  your next visit.
                </p>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="chat"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.15 }}
              className="mx-auto w-full max-w-2xl space-y-5 px-4 py-6"
            >
              {messages.map((message, i) => {
                const text = getMessageText(message);
                if (!text) return null;
                const isUser = message.role === "user";

                return (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.25,
                      delay: i === messages.length - 1 ? 0.05 : 0,
                    }}
                    className={`rounded-2xl px-4 py-3 ${
                      isUser
                        ? "ml-8 bg-[var(--color-accent)] text-white"
                        : "mr-8 bg-[var(--color-background-muted)] text-[var(--color-foreground)]"
                    }`}
                  >
                    <p className="mb-1 text-xs font-medium opacity-70">
                      {isUser ? "You" : "WellSaid"}
                    </p>
                    <div className="whitespace-pre-wrap text-[15px] leading-relaxed">
                      {text}
                    </div>
                  </motion.div>
                );
              })}

              {status === "submitted" && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mr-8 rounded-2xl bg-[var(--color-background-muted)] px-4 py-3"
                >
                  <div className="flex items-center gap-2 text-[15px] text-[var(--color-muted)]">
                    <Loader2 size={16} className="animate-spin" />
                    Thinking...
                  </div>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-20 border-t border-[var(--color-border)] bg-[var(--color-surface)]">
        <div className="mx-auto max-w-2xl px-4 pb-6 pt-3">
          <div className="mb-3 grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setRecordOpen(true)}
              aria-label="Record health note"
              tabIndex={0}
              className="btn-glass flex h-12 items-center justify-center gap-2.5 rounded-2xl text-[14px] font-medium transition-all"
            >
              <NotebookPen
                size={18}
                className="text-[var(--color-accent)]"
                aria-hidden="true"
              />
              Record note
            </button>
            <Link
              href="/appointments/schedule"
              aria-label="Schedule appointment"
              tabIndex={0}
              className="btn-glass flex h-12 items-center justify-center gap-2.5 rounded-2xl text-[14px] font-medium transition-all"
            >
              <CalendarPlus
                size={18}
                className="text-[var(--color-accent)]"
                aria-hidden="true"
              />
              Schedule visit
            </Link>
          </div>

          <button
            type="button"
            onClick={() => handlePromptClick(QUICK_PROMPTS[promptIndex])}
            disabled={isLoading}
            tabIndex={0}
            aria-label={QUICK_PROMPTS[promptIndex]}
            className="mb-3 flex h-11 w-full items-center gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-background-muted)] px-4 text-left transition-all hover:bg-[var(--color-accent-soft)] disabled:opacity-50"
          >
            <AnimatePresence mode="wait">
              <motion.span
                key={promptIndex}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.15 }}
                className="flex-1 truncate text-[14px] text-[var(--color-foreground)]"
              >
                {QUICK_PROMPTS[promptIndex]}
              </motion.span>
            </AnimatePresence>
            <ArrowRight
              size={14}
              className="shrink-0 text-[var(--color-muted)]"
              aria-hidden="true"
            />
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleMicToggle}
              aria-label={isListening ? "Stop listening" : "Speak"}
              tabIndex={0}
              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl transition-all active:scale-95 ${
                isListening
                  ? "bg-[var(--color-danger)] text-white shadow-md"
                  : "bg-[var(--color-accent)] text-white"
              }`}
            >
              {isListening ? <Square size={18} /> : <Mic size={20} />}
            </button>

            <input
              ref={inputRef}
              value={isListening ? transcript : inputText}
              onChange={(e) => {
                if (!isListening) setInputText(e.target.value);
              }}
              onKeyDown={handleKeyDown}
              placeholder="Ask any question..."
              readOnly={isListening}
              disabled={isLoading}
              aria-label="Type your question here"
              className="h-12 flex-1 rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)] px-4 text-[15px] text-[var(--color-foreground)] outline-none placeholder:text-[var(--color-muted)] focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent)]/10 disabled:opacity-50"
            />

            <button
              type="button"
              onClick={handleSend}
              disabled={
                !(isListening ? transcript : inputText).trim() || isLoading
              }
              aria-label="Send message"
              tabIndex={0}
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--color-accent)] text-white transition-all active:scale-95 disabled:opacity-30"
            >
              {isLoading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <SendHorizonal size={20} />
              )}
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {recordOpen && (
          <RecordNoteSheet
            onClose={() => setRecordOpen(false)}
            language={preferredLanguage}
          />
        )}
      </AnimatePresence>
    </>
  );
};
