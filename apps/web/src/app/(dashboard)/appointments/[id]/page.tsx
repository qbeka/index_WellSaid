import { notFound } from "next/navigation";
import { getAppointment } from "../actions";
import {
  ArrowLeft,
  Calendar,
  Clock,
  User,
  MapPin,
  FileText,
} from "lucide-react";
import Link from "next/link";
import { AppointmentActions } from "./appointment-actions";
import { EditAppointment } from "./edit-appointment";

type PageProps = {
  params: Promise<{ id: string }>;
};

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr + "T00:00:00");
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
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
    className: "bg-[var(--color-success)]/10 text-[var(--color-success)]",
  },
  cancelled: {
    label: "Cancelled",
    className: "bg-[var(--color-border)] text-[var(--color-muted)]",
  },
} as const;

const AppointmentDetailPage = async ({ params }: PageProps) => {
  const { id } = await params;
  const appointment = await getAppointment(id);

  if (!appointment) notFound();

  const statusInfo =
    statusConfig[appointment.status as keyof typeof statusConfig];

  const details = [
    {
      icon: Calendar,
      label: "Date",
      value: formatDate(appointment.date),
    },
    appointment.time
      ? { icon: Clock, label: "Time", value: formatTime(appointment.time) }
      : null,
    appointment.provider_name
      ? { icon: User, label: "Provider", value: appointment.provider_name }
      : null,
    appointment.location
      ? { icon: MapPin, label: "Location", value: appointment.location }
      : null,
  ].filter(Boolean) as { icon: typeof Calendar; label: string; value: string }[];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Link
          href="/appointments"
          aria-label="Back to appointments"
          tabIndex={0}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-[var(--color-muted)] transition-colors hover:bg-[var(--color-border)]"
        >
          <ArrowLeft size={18} />
        </Link>
        <h1 className="flex-1 text-xl font-semibold tracking-tight text-[var(--color-foreground)]">
          {appointment.title}
        </h1>
        <span
          className={`rounded-full px-3 py-1 text-xs font-medium ${statusInfo.className}`}
        >
          {statusInfo.label}
        </span>
      </div>

      <div className="rounded-2xl border-2 border-dashed border-[var(--color-border)] bg-[var(--color-surface)] p-5">
        <div className="flex flex-col gap-4">
          {details.map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--color-accent-soft)]">
                <Icon
                  size={16}
                  className="text-[var(--color-accent)]"
                  aria-hidden="true"
                />
              </div>
              <div>
                <p className="text-xs text-[var(--color-muted)]">{label}</p>
                <p className="text-[15px] font-medium text-[var(--color-foreground)]">
                  {value}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {appointment.notes && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-sm font-semibold text-[var(--color-foreground)]">
            <FileText size={14} aria-hidden="true" />
            Notes
          </div>
          <div className="rounded-2xl border-2 border-dashed border-[var(--color-border)] bg-[var(--color-surface)] p-5">
            <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-[var(--color-foreground)]">
              {appointment.notes}
            </p>
          </div>
        </div>
      )}

      <EditAppointment
        id={appointment.id}
        title={appointment.title}
        providerName={appointment.provider_name}
        location={appointment.location}
        date={appointment.date}
        time={appointment.time}
        notes={appointment.notes}
      />

      <AppointmentActions
        id={appointment.id}
        currentStatus={appointment.status}
      />
    </div>
  );
};

export default AppointmentDetailPage;
