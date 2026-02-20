"use client";

import { useState, useRef, useEffect } from "react";
import {
  Bot,
  ListChecks,
  Calendar,
  Mic,
  Send,
  PenLine,
  CalendarPlus,
  ArrowRight,
  MessageCircle,
  Square,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { RecordNoteSheet } from "./record-note-sheet";
import Link from "next/link";

type HomeContentProps = {
  firstName: string;
  actionItemCount: number;
  upcomingAppointments: number;
};

const QUICK_PROMPTS = [
  "Summarize my overall health.",
  "What action items do I have?",
  "What are my upcoming appointments?",
  "Summarize my recent documents.",
] as const;

export const HomeContent = ({
  firstName,
  actionItemCount,
  upcomingAppointments,
}: HomeContentProps) => {
  const [recordOpen, setRecordOpen] = useState(false);
  const [promptIndex, setPromptIndex] = useState(0);
  const [voiceActive, setVoiceActive] = useState(false);
  const [voiceText, setVoiceText] = useState("");
  const [inputText, setInputText] = useState("");
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const greeting = firstName ? `Welcome back, ${firstName}!` : "Welcome back!";
  const hasSummary = actionItemCount > 0 || upcomingAppointments > 0;

  useEffect(() => {
    const interval = setInterval(() => {
      setPromptIndex((prev) => (prev + 1) % QUICK_PROMPTS.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
    };
  }, []);

  const handleMicToggle = () => {
    if (voiceActive) {
      recognitionRef.current?.stop();
      setVoiceActive(false);
      if (voiceText.trim()) {
        setInputText(voiceText.trim());
        setVoiceText("");
      }
      return;
    }

    try {
      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) return;

      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;

      let finalTranscript = "";

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let interim = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const r = event.results[i];
          if (r.isFinal) {
            finalTranscript += r[0].transcript + " ";
          } else {
            interim += r[0].transcript;
          }
        }
        setVoiceText(finalTranscript + interim);
      };

      recognition.onerror = () => setVoiceActive(false);
      recognition.start();
      recognitionRef.current = recognition;
      setVoiceActive(true);
      setVoiceText("");
    } catch {
      // speech recognition not available
    }
  };

  const handleSend = () => {
    const text = inputText.trim();
    if (!text) return;
    window.location.href = `/conversation?q=${encodeURIComponent(text)}`;
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-5 px-4 pb-48">
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
        <div className="mx-auto max-w-2xl px-4 pb-5 pt-3">
          <div className="mb-3 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setRecordOpen(true)}
              aria-label="Record health note"
              tabIndex={0}
              className="flex h-11 items-center justify-center gap-2.5 rounded-xl bg-[var(--color-accent)] text-[13px] font-semibold text-[var(--color-accent-foreground)] transition-all hover:opacity-90 active:scale-[0.97]"
            >
              <PenLine size={15} aria-hidden="true" />
              Record health note
            </button>
            <Link
              href="/appointments/schedule"
              aria-label="Schedule appointment"
              tabIndex={0}
              className="flex h-11 items-center justify-center gap-2.5 rounded-xl bg-[var(--color-foreground)] text-[13px] font-semibold text-[var(--color-background)] transition-all hover:opacity-90 active:scale-[0.97]"
            >
              <CalendarPlus size={15} aria-hidden="true" />
              Schedule appointment
            </Link>
          </div>

          <button
            type="button"
            onClick={() =>
              (window.location.href = `/conversation?q=${encodeURIComponent(QUICK_PROMPTS[promptIndex])}`)
            }
            tabIndex={0}
            aria-label={QUICK_PROMPTS[promptIndex]}
            className="mb-3 flex w-full items-center gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] px-4 py-2.5 text-left transition-all hover:border-[var(--color-accent)]/40 hover:shadow-sm"
          >
            <MessageCircle
              size={15}
              className="shrink-0 text-[var(--color-accent)]"
              aria-hidden="true"
            />
            <AnimatePresence mode="wait">
              <motion.span
                key={promptIndex}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.15 }}
                className="flex-1 truncate text-sm text-[var(--color-foreground)]"
              >
                {QUICK_PROMPTS[promptIndex]}
              </motion.span>
            </AnimatePresence>
            <ArrowRight
              size={13}
              className="shrink-0 text-[var(--color-muted)]"
              aria-hidden="true"
            />
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleMicToggle}
              aria-label={voiceActive ? "Stop voice input" : "Voice input"}
              tabIndex={0}
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition-all active:scale-90 ${
                voiceActive
                  ? "bg-[var(--color-danger)] text-white"
                  : "bg-[var(--color-foreground)] text-[var(--color-background)]"
              }`}
            >
              {voiceActive ? <Square size={16} /> : <Mic size={16} />}
            </button>

            <input
              ref={inputRef}
              value={voiceActive ? voiceText : inputText}
              onChange={(e) => {
                if (!voiceActive) setInputText(e.target.value);
              }}
              onKeyDown={handleKeyDown}
              placeholder="Ask any question..."
              readOnly={voiceActive}
              aria-label="Chat input"
              className="h-11 flex-1 rounded-full border border-[var(--color-border)] bg-[var(--color-background)] px-4 text-sm text-[var(--color-foreground)] outline-none placeholder:text-[var(--color-muted)] focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent)]/10"
            />

            <button
              type="button"
              onClick={handleSend}
              disabled={!(voiceActive ? voiceText : inputText).trim()}
              aria-label="Send"
              tabIndex={0}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--color-foreground)] text-[var(--color-background)] transition-all hover:opacity-90 active:scale-90 disabled:opacity-30"
            >
              <Send size={16} />
            </button>
          </div>
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
