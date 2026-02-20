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
  FolderOpen,
  LogOut,
  X,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

type SidebarProps = {
  open: boolean;
  onClose: () => void;
};

const NAV_ITEMS = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/action-items", label: "Action Items", icon: ListChecks },
  { href: "/health-notes", label: "Health Notes", icon: FileText },
  { href: "/appointments", label: "Appointments", icon: Calendar },
  { href: "/sessions", label: "Sessions", icon: MessageSquare },
  { href: "/documents", label: "Documents", icon: FolderOpen },
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
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[2px] transition-opacity"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        role="dialog"
        aria-modal={open}
        aria-label="Navigation menu"
        className={`fixed left-0 top-0 z-50 flex h-full w-72 flex-col bg-[var(--color-surface)] shadow-xl transition-transform duration-200 ease-out ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-16 items-center justify-between border-b border-[var(--color-border)] px-5">
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
            {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
              const isActive = pathname === href;
              return (
                <li key={href}>
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
                </li>
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
      </aside>
    </>
  );
};
