"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Mic, Square, Loader2, ArrowLeft, CheckCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Phase = "ready" | "recording" | "processing" | "done";

type SessionResult = {
  id: string;
  title: string;
  summary: string;
  keyTopics: string[];
  actionItems: string[];
};

const VisitFlowPage = () => {
  const [phase, setPhase] = useState<Phase>("ready");
  const [transcript, setTranscript] = useState("");
  const [elapsed, setElapsed] = useState(0);
  const [result, setResult] = useState<SessionResult | null>(null);
  const [error, setError] = useState("");
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const router = useRouter();

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const handleStart = useCallback(() => {
    try {
      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) {
        setError("Speech recognition is not supported in this browser.");
        return;
      }

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
        setTranscript(finalTranscript + interim);
      };

      recognition.onerror = () => {
        setPhase("ready");
        if (timerRef.current) clearInterval(timerRef.current);
      };

      recognition.onend = () => {
        if (phase === "recording") {
          try {
            recognition.start();
          } catch {
            // already stopped
          }
        }
      };

      recognition.start();
      recognitionRef.current = recognition;
      setPhase("recording");
      setTranscript("");
      setElapsed(0);
      setError("");

      timerRef.current = setInterval(() => {
        setElapsed((prev) => prev + 1);
      }, 1000);
    } catch {
      setError("Could not access microphone.");
    }
  }, [phase]);

  const handleStop = async () => {
    recognitionRef.current?.stop();
    if (timerRef.current) clearInterval(timerRef.current);

    if (!transcript.trim() || transcript.trim().length < 10) {
      setPhase("ready");
      setError("Recording was too short. Please try again.");
      return;
    }

    setPhase("processing");

    try {
      const res = await fetch("/api/summarize-visit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript: transcript.trim() }),
      });

      const data = await res.json();

      if (res.ok) {
        setResult(data.session);
        setPhase("done");
      } else {
        setError(data.error || "Failed to process visit recording.");
        setPhase("ready");
      }
    } catch {
      setError("Something went wrong. Please try again.");
      setPhase("ready");
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-[var(--color-background)]">
      <div className="flex h-14 items-center gap-3 border-b border-[var(--color-border)] px-4">
        {phase !== "recording" && phase !== "processing" && (
          <Link
            href="/dashboard"
            aria-label="Go back"
            tabIndex={0}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-[var(--color-muted)] transition-colors hover:bg-zinc-100"
          >
            <ArrowLeft size={18} />
          </Link>
        )}
        <span className="text-lg font-semibold tracking-tight text-[var(--color-foreground)]">
          {phase === "done" ? "Visit Summary" : "Record Visit"}
        </span>
      </div>

      <div className="flex flex-1 flex-col">
        <AnimatePresence mode="wait">
          {phase === "ready" && (
            <motion.div
              key="ready"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.3 }}
              className="flex flex-1 flex-col items-center justify-center gap-8 px-6"
            >
              <div className="flex flex-col items-center gap-3">
                <button
                  type="button"
                  onClick={handleStart}
                  aria-label="Start recording your visit"
                  tabIndex={0}
                  className="flex h-32 w-32 items-center justify-center rounded-full border-2 border-[var(--color-accent)] bg-[var(--color-accent-soft)] transition-all hover:shadow-lg active:scale-95"
                >
                  <Mic size={48} className="text-[var(--color-accent)]" />
                </button>
                <h2 className="mt-2 text-xl font-semibold text-[var(--color-foreground)]">
                  Ready to Record
                </h2>
                <p className="max-w-xs text-center text-sm leading-relaxed text-[var(--color-muted)]">
                  Tap the microphone to start recording your doctor visit. Place
                  your phone where it can hear the conversation clearly.
                </p>
              </div>

              {error && (
                <p className="text-center text-sm text-[var(--color-danger)]">
                  {error}
                </p>
              )}
            </motion.div>
          )}

          {phase === "recording" && (
            <motion.div
              key="recording"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex flex-1 flex-col"
            >
              <div className="flex flex-col items-center gap-4 px-6 pt-10">
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="flex h-20 w-20 items-center justify-center rounded-full bg-[var(--color-danger)]/10"
                >
                  <div className="h-4 w-4 rounded-full bg-[var(--color-danger)]" />
                </motion.div>

                <p className="text-3xl font-semibold tabular-nums text-[var(--color-foreground)]">
                  {formatTime(elapsed)}
                </p>
                <p className="text-sm text-[var(--color-muted)]">Recording in progress...</p>
              </div>

              <div className="mx-4 mt-6 flex-1 overflow-y-auto rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
                <p className="mb-2 text-xs font-medium text-[var(--color-muted)]">
                  Live Transcript
                </p>
                {transcript ? (
                  <p className="text-sm leading-relaxed text-[var(--color-foreground)]">
                    {transcript}
                  </p>
                ) : (
                  <p className="text-sm text-[var(--color-muted)]">
                    Listening for speech...
                  </p>
                )}
              </div>

              <div className="px-4 py-6">
                <button
                  type="button"
                  onClick={handleStop}
                  aria-label="Stop recording"
                  tabIndex={0}
                  className="flex h-14 w-full items-center justify-center gap-3 rounded-2xl bg-[var(--color-danger)] text-[15px] font-medium text-white transition-all hover:opacity-90 active:scale-[0.98]"
                >
                  <Square size={18} aria-hidden="true" />
                  End Visit Recording
                </button>
              </div>
            </motion.div>
          )}

          {phase === "processing" && (
            <motion.div
              key="processing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-1 flex-col items-center justify-center gap-4"
            >
              <Loader2
                size={40}
                className="animate-spin text-[var(--color-accent)]"
              />
              <h2 className="text-lg font-semibold text-[var(--color-foreground)]">
                Processing your visit
              </h2>
              <p className="max-w-xs text-center text-sm text-[var(--color-muted)]">
                We&apos;re analyzing the conversation and creating a summary with
                key topics and action items.
              </p>
            </motion.div>
          )}

          {phase === "done" && result && (
            <motion.div
              key="done"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="flex-1 overflow-y-auto px-4 py-6"
            >
              <div className="mx-auto flex max-w-2xl flex-col gap-6">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--color-success)]/10">
                    <CheckCircle
                      size={20}
                      className="text-[var(--color-success)]"
                    />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-[var(--color-foreground)]">
                      {result.title}
                    </h2>
                    <p className="mt-0.5 text-xs text-[var(--color-muted)]">
                      Visit recorded and saved
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
                  <h3 className="mb-2 text-sm font-semibold text-[var(--color-foreground)]">
                    Summary
                  </h3>
                  <p className="text-[15px] leading-relaxed text-[var(--color-foreground)]">
                    {result.summary}
                  </p>
                </div>

                {result.keyTopics.length > 0 && (
                  <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
                    <h3 className="mb-3 text-sm font-semibold text-[var(--color-foreground)]">
                      Key Topics
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {result.keyTopics.map((topic) => (
                        <span
                          key={topic}
                          className="rounded-lg bg-[var(--color-accent-soft)] px-3 py-1.5 text-xs font-medium text-[var(--color-accent)]"
                        >
                          {topic}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {result.actionItems.length > 0 && (
                  <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
                    <h3 className="mb-3 text-sm font-semibold text-[var(--color-foreground)]">
                      Action Items
                    </h3>
                    <ul className="flex flex-col gap-2">
                      {result.actionItems.map((item) => (
                        <li
                          key={item}
                          className="flex items-start gap-2 text-[15px] leading-relaxed text-[var(--color-foreground)]"
                        >
                          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--color-accent)]" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="flex flex-col gap-2 pb-6">
                  <button
                    type="button"
                    onClick={() => router.push(`/sessions/${result.id}`)}
                    aria-label="View full session"
                    tabIndex={0}
                    className="flex h-12 w-full items-center justify-center rounded-xl bg-[var(--color-foreground)] text-sm font-medium text-[var(--color-background)] transition-all hover:opacity-90 active:scale-[0.98]"
                  >
                    View Full Session
                  </button>
                  <button
                    type="button"
                    onClick={() => router.push("/sessions")}
                    aria-label="Back to sessions"
                    tabIndex={0}
                    className="flex h-12 w-full items-center justify-center rounded-xl border border-[var(--color-border)] text-sm font-medium text-[var(--color-foreground)] transition-all hover:bg-zinc-50 active:scale-[0.98]"
                  >
                    Back to All Sessions
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default VisitFlowPage;
