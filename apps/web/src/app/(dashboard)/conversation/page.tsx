"use client";

import { useState, useRef, useEffect } from "react";
import { useChat } from "@ai-sdk/react";
import {
  Send,
  Loader2,
  Bot,
  User,
  ArrowRight,
  MessageCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

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

const ConversationPage = () => {
  const [input, setInput] = useState("");
  const [promptIndex, setPromptIndex] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { messages, sendMessage, status } = useChat();

  const isLoading = status === "submitted" || status === "streaming";
  const hasMessages = messages.length > 0;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const interval = setInterval(() => {
      setPromptIndex((prev) => (prev + 1) % QUICK_PROMPTS.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;
    setInput("");
    sendMessage({ text: trimmed });
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
    <div className="-mx-4 -my-6 flex min-h-[calc(100vh-3.5rem)] flex-col">
      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          {!hasMessages ? (
            <motion.div
              key="welcome"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.3 }}
              className="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-4"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--color-accent-soft)]">
                <Bot
                  size={28}
                  className="text-[var(--color-accent)]"
                  aria-hidden="true"
                />
              </div>
              <h1 className="text-2xl font-semibold tracking-tight text-[var(--color-foreground)]">
                How can I help you today?
              </h1>
              <p className="max-w-md text-center text-[15px] leading-relaxed text-[var(--color-muted)]">
                I can summarize your health data, review your notes, check
                upcoming appointments, or answer questions about your documents.
              </p>

              <div className="mt-4 grid w-full max-w-lg grid-cols-1 gap-2 px-4 sm:grid-cols-2">
                {QUICK_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => handlePromptClick(prompt)}
                    tabIndex={0}
                    aria-label={prompt}
                    className="rounded-xl border border-[var(--color-border)] px-4 py-3 text-left text-sm text-[var(--color-foreground)] transition-all hover:border-[var(--color-accent)]/30 hover:shadow-sm"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="chat"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.15 }}
              className="mx-auto max-w-2xl space-y-5 px-4 py-6"
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
                    className="flex gap-3"
                  >
                    <div
                      className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                        isUser
                          ? "bg-[var(--color-accent)] text-[var(--color-accent-foreground)]"
                          : "bg-[var(--color-accent-soft)] text-[var(--color-accent)]"
                      }`}
                    >
                      {isUser ? (
                        <User size={14} aria-hidden="true" />
                      ) : (
                        <Bot size={14} aria-hidden="true" />
                      )}
                    </div>
                    <div className="flex-1 pt-1">
                      <p className="mb-1 text-xs font-medium text-[var(--color-muted)]">
                        {isUser ? "You" : "WellSaid"}
                      </p>
                      <div className="whitespace-pre-wrap text-[15px] leading-relaxed text-[var(--color-foreground)]">
                        {text}
                      </div>
                    </div>
                  </motion.div>
                );
              })}

              {status === "submitted" && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex gap-3"
                >
                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--color-accent-soft)] text-[var(--color-accent)]">
                    <Bot size={14} aria-hidden="true" />
                  </div>
                  <div className="flex items-center gap-2 pt-1 text-sm text-[var(--color-muted)]">
                    <Loader2 size={14} className="animate-spin" />
                    Thinking...
                  </div>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="sticky bottom-0 bg-[var(--color-surface)] shadow-[0_-1px_3px_0_rgba(0,0,0,0.05)]">
        <div className="mx-auto max-w-2xl px-4 pb-4 pt-3">
          <button
            type="button"
            onClick={() => handlePromptClick(QUICK_PROMPTS[promptIndex])}
            disabled={isLoading}
            tabIndex={0}
            aria-label={QUICK_PROMPTS[promptIndex]}
            className="mb-2.5 flex w-full items-center gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] px-4 py-3 text-left transition-all hover:border-[var(--color-accent)]/40 hover:shadow-sm disabled:opacity-50"
          >
            <MessageCircle
              size={16}
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
              size={14}
              className="shrink-0 text-[var(--color-muted)]"
              aria-hidden="true"
            />
          </button>

          <div className="flex items-center gap-2">
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask any question..."
              disabled={isLoading}
              aria-label="Chat message input"
              className="h-12 flex-1 rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] px-4 text-[15px] text-[var(--color-foreground)] outline-none placeholder:text-[var(--color-muted)] focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent)]/10 disabled:opacity-50"
            />
            <button
              type="button"
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              aria-label="Send message"
              tabIndex={0}
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[var(--color-accent)] text-[var(--color-accent-foreground)] transition-all hover:opacity-90 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {isLoading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Send size={18} />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConversationPage;
