import {
  ListChecks,
  FileText,
  Calendar,
  FolderOpen,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

const QUICK_LINKS = [
  {
    href: "/health-notes",
    label: "Health Notes",
    description: "Record and review your health notes",
    icon: FileText,
  },
  {
    href: "/action-items",
    label: "Action Items",
    description: "Track your follow-up tasks",
    icon: ListChecks,
  },
  {
    href: "/appointments",
    label: "Appointments",
    description: "Manage upcoming visits",
    icon: Calendar,
  },
  {
    href: "/documents",
    label: "Documents",
    description: "Scan and review medical documents",
    icon: FolderOpen,
  },
] as const;

const DashboardPage = async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let firstName = "";
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("first_name")
      .eq("id", user.id)
      .single();
    firstName = profile?.first_name ?? "";
  }

  const greeting = firstName ? `Welcome back, ${firstName}` : "Welcome back";

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--color-foreground)]">
          {greeting}
        </h1>
        <p className="text-sm text-[var(--color-muted)]">
          What would you like to do today?
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {QUICK_LINKS.map(({ href, label, description, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            aria-label={label}
            tabIndex={0}
            className="group flex items-center gap-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 transition-colors hover:border-[var(--color-accent)]/30"
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-zinc-100 transition-colors group-hover:bg-[var(--color-accent)]/10">
              <Icon
                size={20}
                className="text-[var(--color-muted)] transition-colors group-hover:text-[var(--color-accent)]"
                aria-hidden="true"
              />
            </div>
            <div className="flex flex-1 flex-col gap-0.5">
              <span className="text-sm font-medium text-[var(--color-foreground)]">
                {label}
              </span>
              <span className="text-xs text-[var(--color-muted)]">
                {description}
              </span>
            </div>
            <ArrowRight
              size={16}
              className="text-[var(--color-border)] transition-colors group-hover:text-[var(--color-accent)]"
              aria-hidden="true"
            />
          </Link>
        ))}
      </div>
    </div>
  );
};

export default DashboardPage;
