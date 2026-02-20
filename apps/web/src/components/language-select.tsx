"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";
import { SUPPORTED_LANGUAGES } from "@wellsaid/shared";

type LanguageSelectProps = {
  value: string;
  onChange: (value: string) => void;
};

export const LanguageSelect = ({ value, onChange }: LanguageSelectProps) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const selected = SUPPORTED_LANGUAGES.find((l) => l.code === value);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (code: string) => {
    onChange(code);
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative w-full">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-label="Select language"
        aria-expanded={open}
        className="flex h-12 w-full items-center justify-between rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-5 text-left text-base text-[var(--color-foreground)] outline-none focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)]"
      >
        <span className={selected ? "" : "text-[var(--color-muted)]"}>
          {selected ? selected.label : "Select your language"}
        </span>
        <ChevronDown
          size={18}
          className="text-[var(--color-muted)]"
          aria-hidden="true"
        />
      </button>

      {open && (
        <div className="absolute top-14 z-50 max-h-64 w-full overflow-y-auto rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] py-1 shadow-lg">
          {SUPPORTED_LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              type="button"
              onClick={() => handleSelect(lang.code)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSelect(lang.code);
              }}
              tabIndex={0}
              aria-label={lang.label}
              className={`flex w-full items-center justify-between px-5 py-3 text-left text-base transition-colors hover:bg-zinc-50 ${
                value === lang.code
                  ? "bg-zinc-50 font-medium text-[var(--color-accent)]"
                  : "text-[var(--color-foreground)]"
              }`}
            >
              {lang.label}
              {value === lang.code && (
                <Check size={16} className="text-[var(--color-accent)]" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
