"use client";

import { useState } from "react";
import { Menu, Stethoscope, MessageCircle } from "lucide-react";
import { Sidebar } from "@/components/sidebar";
import Link from "next/link";

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[var(--color-background)]">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-surface)] px-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(true)}
            aria-label="Open navigation"
            tabIndex={0}
            className="flex h-10 w-10 items-center justify-center rounded-lg text-[var(--color-foreground)] transition-colors hover:bg-zinc-100"
          >
            <Menu size={22} />
          </button>
          <span className="text-lg font-semibold tracking-tight text-[var(--color-foreground)]">
            WellSaid
          </span>
        </div>

        <Link
          href="/visit-flow"
          aria-label="I'm at a doctor's visit"
          tabIndex={0}
          className="flex h-10 items-center gap-2 rounded-full bg-[var(--color-accent)] px-4 text-sm font-medium text-[var(--color-accent-foreground)] transition-opacity hover:opacity-90"
        >
          <Stethoscope size={16} aria-hidden="true" />
          <span className="hidden sm:inline">I&apos;m at a doctor&apos;s visit</span>
        </Link>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-6">{children}</main>

      <button
        aria-label="Open chat assistant"
        tabIndex={0}
        className="fixed bottom-6 right-6 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-accent)] text-[var(--color-accent-foreground)] shadow-lg transition-transform hover:scale-105"
      >
        <MessageCircle size={22} />
      </button>
    </div>
  );
};

export default DashboardLayout;
