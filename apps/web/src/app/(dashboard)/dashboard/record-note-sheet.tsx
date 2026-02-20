"use client";

import { useState, useRef, useEffect } from "react";
import { Mic, Square, Loader2 } from "lucide-react";
import { motion } from "motion/react";
import { useRouter } from "next/navigation";

type RecordNoteSheetProps = {
  onClose: () => void;
};

export const RecordNoteSheet = ({ onClose }: RecordNoteSheetProps) => {
  const [recording, setRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [saving, setSaving] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const router = useRouter();

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const handleStartRecording = async () => {
    try {
      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) {
        alert("Speech recognition is not supported in this browser.");
        return;
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      let finalTranscript = "";

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let interim = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) {
            finalTranscript += result[0].transcript + " ";
          } else {
            interim += result[0].transcript;
          }
        }
        setTranscript(finalTranscript + interim);
      };

      recognition.onerror = () => {
        setRecording(false);
      };

      recognition.start();
      recognitionRef.current = recognition;
      setRecording(true);
    } catch {
      alert("Could not access microphone.");
    }
  };

  const handleStopRecording = async () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setRecording(false);

    if (!transcript.trim()) return;

    setSaving(true);
    try {
      const res = await fetch("/api/extract-note", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rawText: transcript.trim(),
          language: "English",
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
        onClick={!recording && !saving ? onClose : undefined}
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
                {recording
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
          ) : recording ? (
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
