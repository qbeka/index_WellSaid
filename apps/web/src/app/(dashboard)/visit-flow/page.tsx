import { Mic, ArrowLeft } from "lucide-react";
import Link from "next/link";

const VisitFlowPage = () => {
  return (
    <div className="flex min-h-[calc(100vh-10rem)] flex-col items-center justify-center gap-8">
      <div className="flex flex-col items-center gap-4">
        <button
          aria-label="Start recording"
          tabIndex={0}
          className="flex h-32 w-32 items-center justify-center rounded-full border-2 border-[var(--color-accent)] bg-[var(--color-accent)]/5 transition-colors hover:bg-[var(--color-accent)]/10"
        >
          <Mic size={48} className="text-[var(--color-accent)]" />
        </button>
        <p className="text-sm text-[var(--color-muted)]">
          Tap to start recording your visit
        </p>
      </div>

      <Link
        href="/dashboard"
        aria-label="Go back to dashboard"
        tabIndex={0}
        className="flex h-12 w-full max-w-sm items-center justify-center gap-2 rounded-full border border-[var(--color-danger)]/30 text-sm font-medium text-[var(--color-danger)] transition-colors hover:bg-[var(--color-danger)]/5"
      >
        <ArrowLeft size={16} aria-hidden="true" />
        I don&apos;t want to record, go back
      </Link>
    </div>
  );
};

export default VisitFlowPage;
