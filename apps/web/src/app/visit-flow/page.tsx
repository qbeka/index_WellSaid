import { Mic, ArrowLeft } from "lucide-react";
import Link from "next/link";

const VisitFlowPage = () => {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-10 bg-[var(--color-background)] px-4">
      <div className="flex flex-col items-center gap-5">
        <button
          aria-label="Start recording"
          tabIndex={0}
          className="flex h-36 w-36 items-center justify-center rounded-full border-2 border-[var(--color-accent)] bg-[var(--color-accent)]/5 transition-all hover:bg-[var(--color-accent)]/10 hover:shadow-lg active:scale-95"
        >
          <Mic size={56} className="text-[var(--color-accent)]" />
        </button>
        <div className="flex flex-col items-center gap-1">
          <p className="text-lg font-medium text-[var(--color-foreground)]">
            Ready to record
          </p>
          <p className="text-sm text-[var(--color-muted)]">
            Tap the microphone to start recording your visit
          </p>
        </div>
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
