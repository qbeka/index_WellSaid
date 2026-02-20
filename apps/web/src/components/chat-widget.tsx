"use client";

import { useState, useRef, useEffect } from "react";
import { useChat } from "@ai-sdk/react";
import { MessageCircle, X, Send, Loader2 } from "lucide-react";

const QUICK_PROMPTS = [
  "Summarize my overall health",
  "What action items do I have?",
  "What are my upcoming appointments?",
  "Summarize my recent documents",
] as const;

const getMessageText = (message: { parts: Array<{ type: string; text?: string }> }) =>
  message.parts
    .filter((p): p is { type: "text"; text: string } => p.type === "text")
    .map((p) => p.text)
    .join("");

export const ChatWidget = () => {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { messages, sendMessage, status } = useChat();

  const isLoading = status === "submitted" || status === "streaming";

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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
    <>
      <button
        onClick={() => setOpen(!open)}
        aria-label={open ? "Close chat assistant" : "Open chat assistant"}
        tabIndex={0}
        className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-accent)] text-[var(--color-accent-foreground)] shadow-lg transition-transform hover:scale-105"
      >
        {open ? <X size={22} /> : <MessageCircle size={22} />}
      </button>

      {open && (
        <div className="fixed bottom-24 right-6 z-40 flex h-[32rem] w-[22rem] flex-col overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-xl">
          <div className="flex h-14 shrink-0 items-center border-b border-[var(--color-border)] px-4">
            <h2 className="text-sm font-semibold text-[var(--color-foreground)]">
              Chat Assistant
            </h2>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-4">
            {messages.length === 0 && (
              <div className="flex flex-col gap-3">
                <p className="text-center text-xs text-[var(--color-muted)]">
                  Ask me anything about your health data.
                </p>
                <div className="flex flex-col gap-2">
                  {QUICK_PROMPTS.map((prompt) => (
                    <button
                      key={prompt}
                      type="button"
                      onClick={() => handlePromptClick(prompt)}
                      tabIndex={0}
                      aria-label={prompt}
                      className="rounded-xl border border-[var(--color-border)] px-3 py-2 text-left text-xs text-[var(--color-foreground)] transition-colors hover:border-[var(--color-accent)]/30 hover:bg-zinc-50"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((message) => {
              const text = getMessageText(message);
              if (!text) return null;

              return (
                <div
                  key={message.id}
                  className={`mb-3 flex ${
                    message.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                      message.role === "user"
                        ? "bg-[var(--color-accent)] text-[var(--color-accent-foreground)]"
                        : "bg-zinc-100 text-[var(--color-foreground)]"
                    }`}
                  >
                    {text}
                  </div>
                </div>
              );
            })}

            {status === "submitted" && (
              <div className="mb-3 flex justify-start">
                <div className="flex items-center gap-2 rounded-2xl bg-zinc-100 px-3.5 py-2.5 text-sm text-[var(--color-muted)]">
                  <Loader2 size={14} className="animate-spin" />
                  Thinking...
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          <div className="flex shrink-0 items-center gap-2 border-t border-[var(--color-border)] px-3 py-3">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask a question..."
              disabled={isLoading}
              aria-label="Chat message input"
              className="h-10 flex-1 rounded-full border border-[var(--color-border)] bg-[var(--color-background)] px-4 text-sm text-[var(--color-foreground)] outline-none placeholder:text-[var(--color-muted)] focus:border-[var(--color-accent)] disabled:opacity-50"
            />
            <button
              type="button"
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              aria-label="Send message"
              tabIndex={0}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--color-accent)] text-[var(--color-accent-foreground)] transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      )}
    </>
  );
};
