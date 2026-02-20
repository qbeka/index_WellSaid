"use client";

import { useState } from "react";
import { Menu, Stethoscope, Mic } from "lucide-react";
import { Sidebar } from "@/components/sidebar";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence } from "motion/react";

const ROUTE_TITLES: Record<string, string> = {
  "/action-items": "Action Items",
  "/health-notes": "Health Notes",
  "/appointments": "Appointments",
  "/sessions": "Past Sessions",
  "/conversation": "Conversation",
  "/documents": "Documents",
  "/scan-documents": "Scan Documents",
  "/translate": "Translate",
};

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  const isHome = pathname === "/dashboard" || pathname === "/dashboard/";
  const matchedRoute = Object.keys(ROUTE_TITLES).find(
    (route) => pathname === route || pathname.startsWith(route + "/")
  );
  const pageTitle = matchedRoute ? ROUTE_TITLES[matchedRoute] : null;

  return (
    <div className="flex min-h-screen flex-col bg-[var(--color-background)]">
      <AnimatePresence>
        {sidebarOpen && (
          <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        )}
      </AnimatePresence>

      <header className="sticky top-0 z-30 flex h-14 items-center bg-[var(--color-surface)] px-4 shadow-[0_1px_2px_0_rgba(0,0,0,0.04)]">
        <button
          onClick={() => setSidebarOpen(true)}
          aria-label="Open navigation"
          tabIndex={0}
          className="flex h-10 w-10 items-center justify-center rounded-xl text-[var(--color-foreground)] transition-colors hover:bg-zinc-100 active:bg-zinc-200"
        >
          <Menu size={22} />
        </button>

        <div className="flex flex-1 items-center justify-center">
          {pageTitle && (
            <span className="text-[15px] font-semibold tracking-tight text-[var(--color-foreground)]">
              {pageTitle}
            </span>
          )}
        </div>

        {isHome ? (
          <Link
            href="/visit-flow"
            aria-label="I'm at a doctor's visit"
            tabIndex={0}
            className="flex h-9 items-center gap-2 rounded-full bg-[var(--color-foreground)] px-3.5 text-xs font-medium text-[var(--color-background)] transition-all hover:opacity-90 active:scale-[0.97]"
          >
            <Stethoscope size={14} aria-hidden="true" />
            <span className="hidden sm:inline">I&apos;m at a doctor&apos;s visit</span>
          </Link>
        ) : (
          <div className="w-10" />
        )}
      </header>

      <main className="flex-1">
        <div className="mx-auto max-w-4xl px-4 py-6">{children}</div>
      </main>

      {!isHome && (
        <Link
          href="/dashboard"
          aria-label="Go to home"
          tabIndex={0}
          className="fixed bottom-6 left-5 z-30 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-foreground)] text-[var(--color-background)] shadow-lg transition-all hover:opacity-90 active:scale-90"
        >
          <Mic size={20} />
        </Link>
      )}
    </div>
  );
};

export default DashboardLayout;
