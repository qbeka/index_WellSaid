"use client";

import { useState, useRef } from "react";
import {
  Mic,
  Square,
  Loader2,
  ArrowRightLeft,
  Volume2,
  Copy,
  Check,
  ChevronDown,
} from "lucide-react";
import { SUPPORTED_LANGUAGES } from "@wellsaid/shared";
import { motion, AnimatePresence } from "motion/react";

type TranslateContentProps = {
  defaultLanguage: string;
};

const LANG_TO_BCP47: Record<string, string> = {
  en: "en-US",
  es: "es-ES",
  zh: "zh-CN",
  yue: "zh-HK",
  ko: "ko-KR",
  ja: "ja-JP",
  vi: "vi-VN",
  tl: "fil-PH",
  ar: "ar-SA",
  pt: "pt-BR",
  sq: "sq-AL",
  fr: "fr-FR",
  hi: "hi-IN",
  ru: "ru-RU",
};

export const TranslateContent = ({ defaultLanguage }: TranslateContentProps) => {
  const [sourceText, setSourceText] = useState("");
  const [translatedText, setTranslatedText] = useState("");
  const [detectedLang, setDetectedLang] = useState("");
  const [sourceLang, setSourceLang] = useState("en");
  const [sourceDropdownOpen, setSourceDropdownOpen] = useState(false);
  const [targetLang, setTargetLang] = useState(defaultLanguage);
  const [targetDropdownOpen, setTargetDropdownOpen] = useState(false);
  const [recording, setRecording] = useState(false);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const sourceDropdownRef = useRef<HTMLDivElement>(null);

  const sourceLabel =
    SUPPORTED_LANGUAGES.find((l) => l.code === sourceLang)?.label ?? "English";
  const targetLabel =
    SUPPORTED_LANGUAGES.find((l) => l.code === targetLang)?.label ?? "English";

  const handleStartRecording = () => {
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
      recognition.maxAlternatives = 3;
      recognition.lang = LANG_TO_BCP47[sourceLang] || "en-US";

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
        setSourceText(finalTranscript + interim);
      };

      recognition.onerror = () => setRecording(false);
      recognition.start();
      recognitionRef.current = recognition;
      setRecording(true);
      setTranslatedText("");
      setDetectedLang("");
    } catch {
      alert("Could not access microphone.");
    }
  };

  const handleStopRecording = () => {
    recognitionRef.current?.stop();
    setRecording(false);
    if (sourceText.trim()) handleTranslate(sourceText.trim());
  };

  const handleTranslate = async (text?: string) => {
    const input = text || sourceText.trim();
    if (!input || loading) return;

    setLoading(true);
    setTranslatedText("");
    setDetectedLang("");

    try {
      const res = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: input, targetLanguage: targetLabel }),
      });

      const data = await res.json();
      if (res.ok) {
        setTranslatedText(data.translatedText);
        setDetectedLang(data.detectedSourceLanguage);
      }
    } catch {
      setTranslatedText("Translation failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSpeak = (text: string) => {
    if (!text || speaking) return;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    setSpeaking(true);
    speechSynthesis.speak(utterance);
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSwap = () => {
    if (!translatedText) return;
    setSourceText(translatedText);
    setTranslatedText("");
    setDetectedLang("");
  };

  return (
    <div className="flex flex-col gap-5">
      <p className="text-sm text-[var(--color-muted)]">
        Speak or type in any language. We&apos;ll translate it for you.
      </p>

      <div className="flex flex-col gap-4">
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <div className="mb-2 flex items-center justify-between">
            <div ref={sourceDropdownRef} className="relative">
              <button
                type="button"
                onClick={() => setSourceDropdownOpen(!sourceDropdownOpen)}
                aria-label="Select source language"
                aria-expanded={sourceDropdownOpen}
                tabIndex={0}
                className="flex h-8 items-center gap-1.5 rounded-lg px-2 text-xs font-medium text-[var(--color-foreground)] transition-all hover:bg-[var(--color-background-muted)]"
              >
                Speaking: {sourceLabel}
                <ChevronDown size={12} className="text-[var(--color-muted)]" />
              </button>

              <AnimatePresence>
                {sourceDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.15 }}
                    className="absolute left-0 top-10 z-50 max-h-64 w-56 overflow-y-auto rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] py-1 shadow-lg"
                  >
                    {SUPPORTED_LANGUAGES.map((lang) => (
                      <button
                        key={lang.code}
                        type="button"
                        onClick={() => {
                          setSourceLang(lang.code);
                          setSourceDropdownOpen(false);
                        }}
                        tabIndex={0}
                        className={`flex w-full items-center px-4 py-2.5 text-left text-sm transition-colors hover:bg-[var(--color-background-muted)] ${
                          sourceLang === lang.code
                            ? "font-medium text-[var(--color-accent)]"
                            : "text-[var(--color-foreground)]"
                        }`}
                      >
                        {lang.label}
                        {sourceLang === lang.code && (
                          <Check
                            size={14}
                            className="ml-auto text-[var(--color-accent)]"
                          />
                        )}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            {detectedLang && (
              <span className="text-xs text-[var(--color-muted)]">
                Detected: {detectedLang}
              </span>
            )}
          </div>

          <textarea
            value={sourceText}
            onChange={(e) => setSourceText(e.target.value)}
            placeholder="Tap the microphone below to speak, or type here..."
            rows={4}
            disabled={recording}
            aria-label="Source text"
            className="w-full resize-none bg-transparent text-[15px] leading-relaxed text-[var(--color-foreground)] outline-none placeholder:text-[var(--color-muted)] disabled:opacity-60"
          />

          {sourceText && !recording && (
            <div className="mt-2 flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleSpeak(sourceText)}
                disabled={speaking}
                aria-label="Listen to source text"
                tabIndex={0}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--color-muted)] transition-colors hover:bg-[var(--color-border)]"
              >
                <Volume2 size={15} />
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={handleSwap}
            disabled={!translatedText}
            aria-label="Swap languages"
            tabIndex={0}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-muted)] transition-all hover:border-[var(--color-accent)]/30 hover:text-[var(--color-accent)] disabled:opacity-30"
          >
            <ArrowRightLeft size={16} />
          </button>

          <div ref={dropdownRef} className="relative">
            <button
              type="button"
              onClick={() => setTargetDropdownOpen(!targetDropdownOpen)}
              aria-label="Select target language"
              aria-expanded={targetDropdownOpen}
              tabIndex={0}
              className="flex h-10 items-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 text-sm font-medium text-[var(--color-foreground)] transition-all hover:border-[var(--color-accent)]/30"
            >
              Translate to: {targetLabel}
              <ChevronDown size={14} className="text-[var(--color-muted)]" />
            </button>

            <AnimatePresence>
              {targetDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.15 }}
                  className="absolute left-0 top-12 z-50 max-h-64 w-56 overflow-y-auto rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] py-1 shadow-lg"
                >
                  {SUPPORTED_LANGUAGES.map((lang) => (
                    <button
                      key={lang.code}
                      type="button"
                      onClick={() => {
                        setTargetLang(lang.code);
                        setTargetDropdownOpen(false);
                      }}
                      tabIndex={0}
                      className={`flex w-full items-center px-4 py-2.5 text-left text-sm transition-colors hover:bg-[var(--color-background-muted)] ${
                        targetLang === lang.code
                          ? "font-medium text-[var(--color-accent)]"
                          : "text-[var(--color-foreground)]"
                      }`}
                    >
                      {lang.label}
                      {targetLang === lang.code && (
                        <Check
                          size={14}
                          className="ml-auto text-[var(--color-accent)]"
                        />
                      )}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <div className="mb-2">
            <span className="text-xs font-medium text-[var(--color-muted)]">
              {targetLabel}
            </span>
          </div>

          {loading ? (
            <div className="flex items-center gap-2 py-6 text-sm text-[var(--color-muted)]">
              <Loader2 size={14} className="animate-spin" />
              Translating...
            </div>
          ) : translatedText ? (
            <>
              <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-[var(--color-foreground)]">
                {translatedText}
              </p>
              <div className="mt-3 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleSpeak(translatedText)}
                  disabled={speaking}
                  aria-label="Listen to translation"
                  tabIndex={0}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--color-muted)] transition-colors hover:bg-[var(--color-border)]"
                >
                  <Volume2 size={15} />
                </button>
                <button
                  type="button"
                  onClick={() => handleCopy(translatedText)}
                  aria-label="Copy translation"
                  tabIndex={0}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--color-muted)] transition-colors hover:bg-[var(--color-border)]"
                >
                  {copied ? <Check size={15} /> : <Copy size={15} />}
                </button>
              </div>
            </>
          ) : (
            <p className="py-6 text-sm text-[var(--color-muted)]">
              Translation will appear here
            </p>
          )}
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-20 bg-[var(--color-surface)] shadow-[0_-1px_3px_0_rgba(0,0,0,0.05)]">
        <div className="mx-auto flex max-w-2xl items-center justify-center gap-4 px-4 py-4">
          {recording ? (
            <button
              type="button"
              onClick={handleStopRecording}
              aria-label="Stop recording"
              tabIndex={0}
              className="flex h-14 w-full max-w-sm items-center justify-center gap-3 rounded-2xl bg-[var(--color-danger)] text-[15px] font-medium text-white transition-all hover:opacity-90 active:scale-[0.98]"
            >
              <Square size={18} aria-hidden="true" />
              Stop and Translate
            </button>
          ) : (
            <div className="flex w-full max-w-sm flex-col gap-2">
              <button
                type="button"
                onClick={handleStartRecording}
                aria-label="Start speaking"
                tabIndex={0}
                className="flex h-14 w-full items-center justify-center gap-3 rounded-2xl bg-[var(--color-accent)] text-[15px] font-medium text-white transition-all hover:opacity-90 active:scale-[0.98]"
              >
                <Mic size={18} aria-hidden="true" />
                Speak to Translate
              </button>
              {sourceText.trim() && !loading && (
                <button
                  type="button"
                  onClick={() => handleTranslate()}
                  aria-label="Translate text"
                  tabIndex={0}
                  className="flex h-11 w-full items-center justify-center rounded-xl border border-[var(--color-border)] text-sm font-medium text-[var(--color-foreground)] transition-all hover:bg-[var(--color-background-muted)] active:scale-[0.98]"
                >
                  Translate typed text
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
