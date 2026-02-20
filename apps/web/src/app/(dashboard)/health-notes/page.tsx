import { FileText } from "lucide-react";
import { EmptyState } from "@/components/empty-state";

const HealthNotesPage = () => {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold tracking-tight text-[var(--color-foreground)]">
        Health Notes
      </h1>
      <EmptyState
        icon={FileText}
        title="No health notes yet"
        description="Record a health concern or visit by voice, and structured notes will be created for you."
      />
    </div>
  );
};

export default HealthNotesPage;
