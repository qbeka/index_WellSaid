import type { LucideIcon } from "lucide-react";

type EmptyStateProps = {
  icon: LucideIcon;
  title: string;
  description: string;
};

export const EmptyState = ({
  icon: Icon,
  title,
  description,
}: EmptyStateProps) => {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-24">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-100">
        <Icon size={28} className="text-[var(--color-muted)]" />
      </div>
      <div className="flex flex-col items-center gap-1 text-center">
        <h2 className="text-base font-semibold text-[var(--color-foreground)]">
          {title}
        </h2>
        <p className="max-w-xs text-sm text-[var(--color-muted)]">
          {description}
        </p>
      </div>
    </div>
  );
};
