"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import { Sidebar } from "@/components/sidebar";
import { usePathname } from "next/navigation";
import { AnimatePresence } from "motion/react";

const ROUTE_TITLES: Record<string, string> = {
  "/action-items": "Action Items",
  "/health-notes": "Health Notes",
  "/appointments": "Appointments",
  "/sessions": "Past Sessions",
  "/conversation": "Record Visit",
  "/documents": "Documents",
  "/scan-documents": "Scan Documents",
  "/translate": "Translate",
};

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

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

      <div className="sticky top-0 z-30 flex h-16 items-center px-5">
        <button
          onClick={() => setSidebarOpen(true)}
          aria-label="Open navigation"
          tabIndex={0}
          className="flex h-12 items-center gap-2.5 rounded-xl px-3 text-[var(--color-foreground)] transition-colors hover:bg-[var(--color-background-muted)] active:bg-[var(--color-border)]"
        >
          <Menu size={24} />
          <span className="text-[15px] font-semibold">Menu</span>
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

export default DashboardLayout;
