import { Calendar, ChevronRight, MapPin, User, Clock, Phone } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { getAppointments } from "./actions";
import Link from "next/link";

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr + "T00:00:00");
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
};

const formatTime = (timeStr: string) => {
  const [hours, minutes] = timeStr.split(":");
  const h = parseInt(hours);
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${minutes} ${ampm}`;
};

const statusConfig = {
  upcoming: {
    label: "Upcoming",
    className: "bg-[var(--color-accent-soft)] text-[var(--color-accent)]",
  },
  completed: {
    label: "Completed",
    className: "bg-emerald-50 text-emerald-600",
  },
  cancelled: {
    label: "Cancelled",
    className: "bg-zinc-100 text-[var(--color-muted)]",
  },
} as const;

const AppointmentsPage = async () => {
  const appointments = await getAppointments();

  const upcoming = appointments.filter((a) => a.status === "upcoming");
  const past = appointments.filter((a) => a.status !== "upcoming");

  return (
    <div className="flex flex-col gap-5">
      <p className="text-sm text-[var(--color-muted)]">
        Your scheduled appointments, updated in real time.
      </p>

      {appointments.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title="No appointments yet"
          description="Your scheduled appointments will show up here. Schedule via the conversation or schedule flow."
        />
      ) : (
        <div className="flex flex-col gap-6">
          {upcoming.length > 0 && (
            <div className="flex flex-col gap-2">
              <h2 className="text-sm font-medium text-[var(--color-muted)]">
                Upcoming
              </h2>
              {upcoming.map((apt) => (
                <AppointmentCard key={apt.id} appointment={apt} />
              ))}
            </div>
          )}

          {past.length > 0 && (
            <div className="flex flex-col gap-2">
              <h2 className="text-sm font-medium text-[var(--color-muted)]">
                Past
              </h2>
              {past.map((apt) => (
                <AppointmentCard key={apt.id} appointment={apt} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

type AppointmentRow = {
  id: string;
  title: string;
  provider_name: string | null;
  location: string | null;
  date: string;
  time: string | null;
  status: "upcoming" | "completed" | "cancelled";
};

const AppointmentCard = ({ appointment }: { appointment: AppointmentRow }) => {
  const statusInfo = statusConfig[appointment.status];

  return (
    <Link
      href={`/appointments/${appointment.id}`}
      aria-label={appointment.title}
      tabIndex={0}
      className="group flex items-center gap-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 transition-all hover:border-[var(--color-accent)]/30 hover:shadow-sm active:scale-[0.995]"
    >
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--color-accent-soft)]">
        <Calendar
          size={18}
          className="text-[var(--color-accent)]"
          aria-hidden="true"
        />
      </div>

      <div className="flex flex-1 flex-col gap-1 overflow-hidden">
        <div className="flex items-center gap-2">
          <span className="truncate text-[15px] font-medium text-[var(--color-foreground)]">
            {appointment.title}
          </span>
          <span
            className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${statusInfo.className}`}
          >
            {statusInfo.label}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-[var(--color-muted)]">
          <span className="flex items-center gap-1">
            <Calendar size={11} aria-hidden="true" />
            {formatDate(appointment.date)}
          </span>
          {appointment.time && (
            <span className="flex items-center gap-1">
              <Clock size={11} aria-hidden="true" />
              {formatTime(appointment.time)}
            </span>
          )}
          {appointment.provider_name && (
            <span className="flex items-center gap-1">
              <User size={11} aria-hidden="true" />
              {appointment.provider_name}
            </span>
          )}
          {appointment.location && (
            <span className="flex items-center gap-1">
              <MapPin size={11} aria-hidden="true" />
              {appointment.location}
            </span>
          )}
        </div>
      </div>

      <ChevronRight
        size={18}
        className="shrink-0 text-[var(--color-muted)]/40 transition-colors group-hover:text-[var(--color-accent)]"
        aria-hidden="true"
      />
    </Link>
  );
};

export default AppointmentsPage;
