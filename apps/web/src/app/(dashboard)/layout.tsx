"use client";

import { useState } from "react";
import { Menu, Stethoscope } from "lucide-react";
import { Sidebar } from "@/components/sidebar";
import Link from "next/link";
import { AnimatePresence } from "motion/react";

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen flex-col bg-[var(--color-background)]">
      <AnimatePresence>
        {sidebarOpen && (
          <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        )}
      </AnimatePresence>

      <header className="sticky top-0 z-30 flex h-14 items-center justify-between bg-[var(--color-surface)] px-4 shadow-[0_1px_2px_0_rgba(0,0,0,0.04)]">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(true)}
            aria-label="Open navigation"
            tabIndex={0}
            className="flex h-10 w-10 items-center justify-center rounded-xl text-[var(--color-foreground)] transition-colors hover:bg-zinc-100 active:bg-zinc-200"
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
          className="flex h-10 items-center gap-2 rounded-full bg-[var(--color-accent)] px-4 text-sm font-medium text-[var(--color-accent-foreground)] transition-all hover:opacity-90 active:scale-[0.97]"
        >
          <Stethoscope size={16} aria-hidden="true" />
          <span className="hidden sm:inline">I&apos;m at a doctor&apos;s visit</span>
        </Link>
      </header>

      <main className="flex-1">
        <div className="mx-auto max-w-4xl px-4 py-6">
          {children}
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
