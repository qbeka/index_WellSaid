import { FolderOpen } from "lucide-react";
import { EmptyState } from "@/components/empty-state";

const DocumentsPage = () => {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold tracking-tight text-[var(--color-foreground)]">
        Documents
      </h1>
      <EmptyState
        icon={FolderOpen}
        title="No documents yet"
        description="Upload or photograph labs, prescriptions, or summaries and we'll create searchable summaries for you."
      />
    </div>
  );
};

export default DocumentsPage;
