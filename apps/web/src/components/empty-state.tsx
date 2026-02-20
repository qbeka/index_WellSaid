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
    <div className="rounded-2xl border-2 border-dashed border-[var(--color-border)] px-6 py-16">
      <div className="flex flex-col items-center justify-center gap-3 text-center">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--color-background-muted)]">
          <Icon size={20} className="text-[var(--color-muted)]" aria-hidden="true" />
        </div>
        <h2 className="text-[15px] font-medium text-[var(--color-foreground)]">
          {title}
        </h2>
        <p className="max-w-xs text-sm leading-relaxed text-[var(--color-muted)]">
          {description}
        </p>
      </div>
    </div>
  );
};
