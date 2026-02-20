"use client";

import { useState, useRef, useEffect } from "react";
import { Mic, Square, Loader2, RotateCcw } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Phase = "ready" | "recording" | "processing";

const ConversationPage = () => {
  const [phase, setPhase] = useState<Phase>("ready");
  const [transcript, setTranscript] = useState("");
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState("");
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const router = useRouter();

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
      recognitionRef.current?.stop();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const handleStart = () => {
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
  };

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
        router.push(`/sessions/${data.session.id}`);
      } else {
        setError(data.error || "Failed to process recording.");
        setPhase("ready");
      }
    } catch {
      setError("Something went wrong. Please try again.");
      setPhase("ready");
    }
  };

  return (
    <div className="-mx-4 -my-6 flex min-h-[calc(100vh-3.5rem)] flex-col">
      <div className="flex flex-1 flex-col px-4">
        <p className="py-4 text-sm text-[var(--color-foreground)]">
          This conversation is about a doctor&apos;s visit on {today}
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
                <p className="text-sm text-[var(--color-muted)]">
                  Processing your visit...
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
                    Recording {formatTime(elapsed)}
                  </span>
                  <motion.div
                    animate={{ opacity: [1, 0.3, 1] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                    className="h-2.5 w-2.5 rounded-full bg-[var(--color-danger)]"
                  />
                </div>
                <div className="flex-1 overflow-y-auto">
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
              </motion.div>
            ) : (
              <motion.div
                key="ready"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-1 flex-col items-center justify-center gap-4"
              >
                <button
                  type="button"
                  onClick={handleStart}
                  aria-label="Start recording"
                  tabIndex={0}
                  className="flex h-20 w-20 items-center justify-center rounded-full bg-[var(--color-foreground)] text-[var(--color-background)] transition-all hover:opacity-90 active:scale-90"
                >
                  <Mic size={32} />
                </button>
                <p className="text-sm text-[var(--color-muted)]">
                  Press the button above to start recording
                </p>
                {error && (
                  <p className="text-center text-sm text-[var(--color-danger)]">
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
              End Visit Recording
            </button>
          ) : phase === "ready" ? (
            <Link
              href="/dashboard"
              aria-label="Go back"
              tabIndex={0}
              className="flex h-14 w-full items-center justify-center gap-3 rounded-2xl bg-[var(--color-danger)] text-[15px] font-medium text-white transition-all hover:opacity-90 active:scale-[0.98]"
            >
              <RotateCcw size={16} aria-hidden="true" />
              I don&apos;t want to record, go back
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default ConversationPage;
