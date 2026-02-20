import { ListChecks } from "lucide-react";
import { EmptyState } from "@/components/empty-state";

const ActionItemsPage = () => {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold tracking-tight text-[var(--color-foreground)]">
        Action Items
      </h1>
      <EmptyState
        icon={ListChecks}
        title="No action items yet"
        description="When you record a visit or create health notes, follow-up tasks will appear here automatically."
      />
    </div>
  );
};

export default ActionItemsPage;
