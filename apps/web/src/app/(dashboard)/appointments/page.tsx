import { Calendar } from "lucide-react";
import { EmptyState } from "@/components/empty-state";

const AppointmentsPage = () => {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold tracking-tight text-[var(--color-foreground)]">
        Appointments
      </h1>
      <EmptyState
        icon={Calendar}
        title="No appointments yet"
        description="Schedule your doctor visits here. We can even call the clinic for you."
      />
    </div>
  );
};

export default AppointmentsPage;
