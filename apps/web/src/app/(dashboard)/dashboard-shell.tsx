"use client";

import { useEffect, useState } from "react";
import { Menu } from "lucide-react";
import { Sidebar } from "@/components/sidebar";
import { usePathname } from "next/navigation";
import { AnimatePresence } from "motion/react";
import { useTranslation } from "@/i18n";

const ROUTE_TITLE_KEYS: Record<string, string> = {
  "/action-items": "nav.actionItems",
  "/health-notes": "nav.healthNotes",
  "/appointments": "nav.appointments",
  "/sessions": "nav.pastSessions",
  "/conversation": "nav.recordVisit",
  "/documents": "nav.documents",
  "/scan-documents": "nav.scanDocuments",
  "/translate": "nav.translate",
  "/travel": "nav.travel",
};

type DashboardShellProps = {
  children: React.ReactNode;
  highLegibility?: boolean;
};

export const DashboardShell = ({ children, highLegibility = false }: DashboardShellProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const { t } = useTranslation();

  useEffect(() => {
    if (highLegibility) {
      document.documentElement.classList.add("high-legibility");
    } else {
      document.documentElement.classList.remove("high-legibility");
    }
  }, [highLegibility]);

  const matchedRoute = Object.keys(ROUTE_TITLE_KEYS).find(
    (route) => pathname === route || pathname.startsWith(route + "/")
  );
  const pageTitle = matchedRoute ? t(ROUTE_TITLE_KEYS[matchedRoute]) : null;

  return (
    <div className="flex min-h-screen flex-col bg-[var(--color-background)]">
      <AnimatePresence>
        {sidebarOpen && (
          <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        )}
      </AnimatePresence>

      <div className="sticky top-0 z-30 flex h-16 items-center px-5">
        <button
          onClick={() => setSidebarOpen(true)}
          aria-label={t("common.menu")}
          tabIndex={0}
          className="flex h-12 items-center gap-2.5 rounded-xl px-3 text-[var(--color-foreground)] transition-colors hover:bg-[var(--color-background-muted)] active:bg-[var(--color-border)]"
        >
          <Menu size={24} />
          <span className="text-[15px] font-semibold">{t("common.menu")}</span>
        </button>

        <div className="flex flex-1 items-center justify-center">
          {pageTitle && (
            <span className="text-[15px] font-semibold tracking-tight text-[var(--color-foreground)]">
              {pageTitle}
            </span>
          )}
        </div>

        <div className="w-20" />
      </div>

      <main className="flex-1">
        <div className="mx-auto max-w-4xl px-5 pb-6">{children}</div>
      </main>
    </div>
  );
};
