"use client";

import { useState, useRef } from "react";
import { useTranslation } from "@/i18n";
import {
  Phone,
  Loader2,
  CheckCircle,
  Calendar,
  Clock,
  MapPin,
  User,
  AlertCircle,
  RotateCcw,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type StatusEntry = {
  step: string;
  message: string;
  time: string;
};

type AppointmentResult = {
  appointmentDate: string;
  appointmentTime: string;
  providerName: string;
  location: string;
  confirmationNotes: string;
};

const ScheduleAppointmentPage = () => {
  const { t } = useTranslation();
  const [phase, setPhase] = useState<"idle" | "calling" | "done" | "error">(
    "idle"
  );
  const [reason, setReason] = useState("");
  const [doctorName, setDoctorName] = useState("");
  const [preferredDate, setPreferredDate] = useState("");
  const [preferredTime, setPreferredTime] = useState("");
  const [notes, setNotes] = useState("");
  const [statuses, setStatuses] = useState<StatusEntry[]>([]);
  const [result, setResult] = useState<AppointmentResult | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const feedRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const addStatus = (entry: StatusEntry) => {
    setStatuses((prev) => [...prev, entry]);
    setTimeout(() => {
      feedRef.current?.scrollTo({
        top: feedRef.current.scrollHeight,
        behavior: "smooth",
      });
    }, 50);
  };

  const now = () =>
    new Date().toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });

  const handleStartCall = async () => {
    setPhase("calling");
    setStatuses([]);
    setResult(null);
    setErrorMsg("");

    try {
      const res = await fetch("/api/schedule-call", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reason: reason.trim(),
          doctorName: doctorName.trim() || undefined,
          preferredDate: preferredDate || undefined,
          preferredTime: preferredTime || undefined,
          notes: notes.trim() || undefined,
        }),
      });

      if (!res.ok || !res.body) {
        setErrorMsg(t("schedule.failedToStart"));
        setPhase("error");
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        let eventType = "";
        for (const line of lines) {
          if (line.startsWith("event: ")) {
            eventType = line.slice(7);
          } else if (line.startsWith("data: ")) {
            const data = JSON.parse(line.slice(6));
            if (eventType === "status") {
              addStatus({ ...data, time: now() });
            } else if (eventType === "result") {
              setResult(data);
              setPhase("done");
            } else if (eventType === "error") {
              setErrorMsg(data.message);
              setPhase("error");
            }
          }
        }
      }
    } catch {
      setErrorMsg(t("common.somethingWrong"));
      setPhase("error");
    }
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

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-xl font-semibold tracking-tight text-[var(--color-foreground)]">
          {t("schedule.title")}
        </h2>
        <p className="mt-1 text-sm text-[var(--color-muted)]">
          {t("schedule.subtitle")}
        </p>
      </div>

      {phase === "idle" && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="reason"
              className="text-[13px] font-medium text-[var(--color-foreground)]"
            >
              {t("schedule.reason")}
            </label>
            <input
              id="reason"
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={t("schedule.reasonPlaceholder")}
              className="h-12 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 text-[15px] text-[var(--color-foreground)] outline-none placeholder:text-[var(--color-muted)] focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent)]/10"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="doctorName"
              className="text-[13px] font-medium text-[var(--color-foreground)]"
            >
              {t("schedule.doctor")}
            </label>
            <input
              id="doctorName"
              type="text"
              value={doctorName}
              onChange={(e) => setDoctorName(e.target.value)}
              placeholder={t("schedule.doctorPlaceholder")}
              className="h-12 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 text-[15px] text-[var(--color-foreground)] outline-none placeholder:text-[var(--color-muted)] focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent)]/10"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="prefDate"
                className="text-[13px] font-medium text-[var(--color-foreground)]"
              >
                {t("schedule.preferredDate")}
              </label>
              <input
                id="prefDate"
                type="date"
                value={preferredDate}
                onChange={(e) => setPreferredDate(e.target.value)}
                className="h-12 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 text-[15px] text-[var(--color-foreground)] outline-none focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent)]/10"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="prefTime"
                className="text-[13px] font-medium text-[var(--color-foreground)]"
              >
                {t("schedule.preferredTime")}
              </label>
              <input
                id="prefTime"
                type="time"
                value={preferredTime}
                onChange={(e) => setPreferredTime(e.target.value)}
                className="h-12 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 text-[15px] text-[var(--color-foreground)] outline-none focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent)]/10"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="notes"
              className="text-[13px] font-medium text-[var(--color-foreground)]"
            >
              {t("schedule.notes")}
            </label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t("schedule.notesPlaceholder")}
              rows={3}
              className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-[15px] text-[var(--color-foreground)] outline-none placeholder:text-[var(--color-muted)] focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent)]/10"
            />
          </div>
        </div>
      )}

      {phase !== "idle" && (
        <div
          ref={feedRef}
          className="min-h-[200px] max-h-[400px] overflow-y-auto rounded-2xl bg-[var(--color-background-muted)] p-5"
        >
          {statuses.length === 0 && phase === "calling" ? (
            <div className="flex items-center justify-center gap-2 py-16 text-sm text-[var(--color-muted)]">
              <Loader2 size={16} className="animate-spin" />
              {t("schedule.startingCall")}
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {statuses.map((s, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-start gap-3"
                >
                  <div className="mt-0.5">
                    {s.step === "confirmed" ? (
                      <CheckCircle
                        size={16}
                        className="text-[var(--color-success)]"
                      />
                    ) : (
                      <div className="flex h-4 w-4 items-center justify-center">
                        <div className="h-2 w-2 rounded-full bg-[var(--color-accent)]" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-[var(--color-foreground)]">
                      {s.message}
                    </p>
                    <p className="mt-0.5 text-[11px] text-[var(--color-muted)]">
                      {s.time}
                    </p>
                  </div>
                </motion.div>
              ))}

              {phase === "calling" && (
                <div className="flex items-center gap-2 pt-2 text-sm text-[var(--color-muted)]">
                  <Loader2 size={14} className="animate-spin" />
                  {t("schedule.working")}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {phase === "done" && result && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-[var(--color-success)]/30 bg-[var(--color-success)]/5 p-4"
        >
          <div className="mb-3 flex items-center gap-2">
            <CheckCircle size={18} className="text-[var(--color-success)]" />
            <span className="text-sm font-semibold text-[var(--color-foreground)]">
              {t("schedule.appointmentConfirmed")}
            </span>
          </div>

          <div className="flex flex-col gap-2 text-sm text-[var(--color-foreground)]">
            <div className="flex items-center gap-2">
              <Calendar size={14} className="text-[var(--color-muted)]" />
              {formatDate(result.appointmentDate)}
            </div>
            {result.appointmentTime && (
              <div className="flex items-center gap-2">
                <Clock size={14} className="text-[var(--color-muted)]" />
                {formatTime(result.appointmentTime)}
              </div>
            )}
            {result.providerName && (
              <div className="flex items-center gap-2">
                <User size={14} className="text-[var(--color-muted)]" />
                {result.providerName}
              </div>
            )}
            {result.location && (
              <div className="flex items-center gap-2">
                <MapPin size={14} className="text-[var(--color-muted)]" />
                {result.location}
              </div>
            )}
            {result.confirmationNotes && (
              <p className="mt-1 text-sm leading-relaxed text-[var(--color-muted)]">
                {result.confirmationNotes}
              </p>
            )}
          </div>
        </motion.div>
      )}

      {phase === "error" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-start gap-3 rounded-2xl border border-[var(--color-danger)]/30 bg-[var(--color-danger)]/5 p-4"
        >
          <AlertCircle
            size={18}
            className="mt-0.5 shrink-0 text-[var(--color-danger)]"
          />
          <p className="text-sm text-[var(--color-foreground)]">{errorMsg}</p>
        </motion.div>
      )}

      <div className="flex flex-col gap-2">
        {phase === "idle" && (
          <button
            type="button"
            onClick={handleStartCall}
            aria-label="Start scheduling process"
            tabIndex={0}
            className="flex h-14 w-full items-center justify-center gap-3 rounded-2xl bg-[var(--color-accent)] text-[15px] font-medium text-white transition-all hover:opacity-90 active:scale-[0.98]"
          >
            <Phone size={18} aria-hidden="true" />
            {t("schedule.startScheduling")}
          </button>
        )}

        {phase === "done" && (
          <button
            type="button"
            onClick={() => {
              router.push("/appointments");
              router.refresh();
            }}
            aria-label="View all appointments"
            tabIndex={0}
            className="flex h-14 w-full items-center justify-center rounded-2xl bg-[var(--color-accent)] text-[15px] font-medium text-white transition-all hover:opacity-90 active:scale-[0.98]"
          >
            {t("schedule.viewAllAppointments")}
          </button>
        )}

        {phase === "error" && (
          <button
            type="button"
            onClick={() => {
              setPhase("idle");
              setStatuses([]);
            }}
            aria-label="Try again"
            tabIndex={0}
            className="flex h-14 w-full items-center justify-center gap-3 rounded-2xl bg-[var(--color-accent)] text-[15px] font-medium text-white transition-all hover:opacity-90 active:scale-[0.98]"
          >
            <RotateCcw size={16} aria-hidden="true" />
            {t("common.tryAgain")}
          </button>
        )}

        {phase !== "calling" && (
          <Link
            href="/dashboard"
            aria-label="Back to Home"
            tabIndex={0}
            className="flex h-12 w-full items-center justify-center rounded-2xl bg-[var(--color-background-muted)] text-sm font-medium text-[var(--color-foreground)] transition-all hover:bg-[var(--color-border)] active:scale-[0.98]"
          >
            {t("common.backToHome")}
          </Link>
        )}
      </div>
    </div>
  );
};

export default ScheduleAppointmentPage;
