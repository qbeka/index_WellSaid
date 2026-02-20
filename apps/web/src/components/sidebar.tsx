"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  Home,
  ListChecks,
  FileText,
  Calendar,
  MessageSquare,
  MessageCircle,
  FolderOpen,
  ScanLine,
  Languages,
  LogOut,
  X,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";

type SidebarProps = {
  open: boolean;
  onClose: () => void;
};

const NAV_ITEMS = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/conversation", label: "Conversation", icon: MessageCircle },
  { href: "/translate", label: "Translate", icon: Languages },
  { href: "/health-notes", label: "Health Notes", icon: FileText },
  { href: "/appointments", label: "Appointments", icon: Calendar },
  { href: "/sessions", label: "Past Sessions", icon: MessageSquare },
  { href: "/documents", label: "Documents", icon: FolderOpen },
  { href: "/scan-documents", label: "Scan Documents", icon: ScanLine },
  { href: "/action-items", label: "Action Items", icon: ListChecks },
] as const;

export const Sidebar = ({ open, onClose }: SidebarProps) => {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden="true"
      />

      <motion.aside
        initial={{ x: "-100%" }}
        animate={{ x: 0 }}
        exit={{ x: "-100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        role="dialog"
        aria-modal={open}
        aria-label="Navigation menu"
        className="fixed left-0 top-0 z-50 flex h-full w-72 flex-col bg-[var(--color-surface)] shadow-xl"
      >
        <div className="flex h-14 items-center justify-between border-b border-[var(--color-border)] px-5">
          <span className="text-lg font-semibold tracking-tight text-[var(--color-foreground)]">
            WellSaid
          </span>
          <button
            onClick={onClose}
            aria-label="Close navigation"
            tabIndex={0}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-[var(--color-muted)] transition-colors hover:bg-zinc-100"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <ul className="flex flex-col gap-1">
            {NAV_ITEMS.map(({ href, label, icon: Icon }, i) => {
              const isActive = pathname === href;
              return (
                <motion.li
                  key={href}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03, duration: 0.2 }}
                >
                  <Link
                    href={href}
                    onClick={onClose}
                    aria-label={label}
                    aria-current={isActive ? "page" : undefined}
                    tabIndex={0}
                    className={`flex h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-[var(--color-accent)]/10 text-[var(--color-accent)]"
                        : "text-[var(--color-foreground)] hover:bg-zinc-50"
                    }`}
                  >
                    <Icon size={18} aria-hidden="true" />
                    {label}
                  </Link>
                </motion.li>
              );
            })}
          </ul>
        </nav>

        <div className="border-t border-[var(--color-border)] px-3 py-4">
          <button
            onClick={handleSignOut}
            aria-label="Sign out"
            tabIndex={0}
            className="flex h-11 w-full items-center gap-3 rounded-lg px-3 text-sm font-medium text-[var(--color-muted)] transition-colors hover:bg-zinc-50 hover:text-[var(--color-danger)]"
          >
            <LogOut size={18} aria-hidden="true" />
            Sign out
          </button>
        </div>
      </motion.aside>
    </>
  );
};
