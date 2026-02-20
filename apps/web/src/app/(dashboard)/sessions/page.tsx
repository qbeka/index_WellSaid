import { MessageSquare } from "lucide-react";
import { EmptyState } from "@/components/empty-state";

const SessionsPage = () => {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold tracking-tight text-[var(--color-foreground)]">
        Sessions
      </h1>
      <EmptyState
        icon={MessageSquare}
        title="No sessions yet"
        description="After a doctor's visit, your recorded conversations and summaries will show up here."
      />
    </div>
  );
};

export default SessionsPage;
