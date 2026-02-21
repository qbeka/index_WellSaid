"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  Home,
  ListChecks,
  FileText,
  Calendar,
  MessageSquare,
  ClipboardPen,
  FolderOpen,
  ScanLine,
  Languages,
  LogOut,
  X,
  ChevronDown,
  Check,
  Phone,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { useTranslation } from "@/i18n";
import { SUPPORTED_LANGUAGES } from "@wellsaid/shared";

type SidebarProps = {
  open: boolean;
  onClose: () => void;
};

const NAV_ITEMS = [
  { href: "/dashboard", labelKey: "nav.home", icon: Home },
  { href: "/conversation", labelKey: "nav.recordVisit", icon: ClipboardPen },
  { href: "/translate", labelKey: "nav.translate", icon: Languages },
  { href: "/health-notes", labelKey: "nav.healthNotes", icon: FileText },
  { href: "/appointments", labelKey: "nav.appointments", icon: Calendar },
  { href: "/sessions", labelKey: "nav.pastSessions", icon: MessageSquare },
  { href: "/documents", labelKey: "nav.documents", icon: FolderOpen },
  { href: "/scan-documents", labelKey: "nav.scanDocuments", icon: ScanLine },
  { href: "/action-items", labelKey: "nav.actionItems", icon: ListChecks },
] as const;

export const Sidebar = ({ open, onClose }: SidebarProps) => {
  const pathname = usePathname();
  const router = useRouter();
  const { t, lang } = useTranslation();
  const [userInfo, setUserInfo] = useState<{
    name: string;
    avatarUrl: string | null;
  }>({ name: "", avatarUrl: null });

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [hospitalPhone, setHospitalPhone] = useState("");
  const [selectedLang, setSelectedLang] = useState(lang);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const fullName =
          user.user_metadata?.full_name || user.user_metadata?.name || "";
        const avatar =
          user.user_metadata?.avatar_url ||
          user.user_metadata?.picture ||
          null;
        setUserInfo({ name: fullName, avatarUrl: avatar });

        const { data: profile } = await supabase
          .from("profiles")
          .select("hospital_phone, preferred_language")
          .eq("id", user.id)
          .single();

        if (profile) {
          setHospitalPhone(profile.hospital_phone || "");
          setSelectedLang(profile.preferred_language || "en");
        }
      }
    };

    if (open) fetchUser();
  }, [open]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      await supabase
        .from("profiles")
        .update({
          hospital_phone: hospitalPhone.trim() || null,
          preferred_language: selectedLang,
        })
        .eq("id", user.id);
    }

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);

    if (selectedLang !== lang) {
      router.refresh();
    }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden="true"
      />

      <motion.aside
        initial={{ x: "-100%" }}
        animate={{ x: 0 }}
        exit={{ x: "-100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        role="dialog"
        aria-modal={open}
        aria-label={t("common.menu")}
        className="fixed left-0 top-0 z-50 flex h-full w-80 flex-col bg-[var(--color-surface)] shadow-xl"
      >
        <div className="border-b border-[var(--color-border)] px-5 py-4">
          <button
            type="button"
            onClick={() => setSettingsOpen(!settingsOpen)}
            aria-label={t("profile.settings")}
            tabIndex={0}
            className="flex w-full items-center justify-between"
          >
            <div className="flex items-center gap-3 overflow-hidden">
              {userInfo.avatarUrl ? (
                <Image
                  src={userInfo.avatarUrl}
                  alt=""
                  width={40}
                  height={40}
                  className="h-10 w-10 shrink-0 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--color-accent)] text-sm font-semibold text-[var(--color-accent-foreground)]">
                  {userInfo.name
                    ? userInfo.name
                        .split(" ")
                        .map((w) => w[0])
                        .join("")
                        .slice(0, 2)
                        .toUpperCase()
                    : "?"}
                </div>
              )}
              <span className="truncate text-[15px] font-semibold text-[var(--color-foreground)]">
                {userInfo.name || t("common.loading")}
              </span>
            </div>
            <ChevronDown
              size={18}
              className={`shrink-0 text-[var(--color-muted)] transition-transform ${settingsOpen ? "rotate-180" : ""}`}
            />
          </button>

          <AnimatePresence>
            {settingsOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="flex flex-col gap-3 pt-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="flex items-center gap-1.5 text-[12px] font-medium text-[var(--color-muted)]">
                      <Phone size={12} />
                      {t("profile.hospitalPhone")}
                    </label>
                    <input
                      type="tel"
                      value={hospitalPhone}
                      onChange={(e) => setHospitalPhone(e.target.value)}
                      placeholder="(555) 555-5555"
                      aria-label={t("profile.hospitalPhone")}
                      className="h-10 rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] px-3 text-[13px] text-[var(--color-foreground)] outline-none placeholder:text-[var(--color-muted)] focus:border-[var(--color-accent)]"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="flex items-center gap-1.5 text-[12px] font-medium text-[var(--color-muted)]">
                      <Languages size={12} />
                      {t("profile.language")}
                    </label>
                    <div className="grid grid-cols-2 gap-1.5">
                      {SUPPORTED_LANGUAGES.map(({ code, label }) => (
                        <button
                          key={code}
                          type="button"
                          onClick={() => setSelectedLang(code)}
                          className={`flex h-9 items-center justify-between rounded-lg border px-3 text-[12px] font-medium transition-colors ${
                            selectedLang === code
                              ? "border-[var(--color-accent)] bg-[var(--color-accent)]/10 text-[var(--color-accent)]"
                              : "border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-foreground)] hover:bg-[var(--color-background-muted)]"
                          }`}
                        >
                          {label}
                          {selectedLang === code && (
                            <Check size={12} className="shrink-0" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleSaveSettings}
                    disabled={saving}
                    className="flex h-10 items-center justify-center gap-2 rounded-lg bg-[var(--color-accent)] text-[13px] font-medium text-white transition-opacity disabled:opacity-50"
                  >
                    {saving
                      ? t("common.saving")
                      : saved
                        ? t("profile.saved")
                        : t("common.save")}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="flex items-center justify-end border-b border-[var(--color-border)] px-5 py-2">
          <button
            onClick={onClose}
            aria-label={t("common.close")}
            tabIndex={0}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-[var(--color-muted)] transition-colors hover:bg-[var(--color-background-muted)]"
          >
            <X size={22} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <ul className="flex flex-col gap-1.5">
            {NAV_ITEMS.map(({ href, labelKey, icon: Icon }, i) => {
              const isActive = pathname === href;
              const label = t(labelKey);
              return (
                <motion.li
                  key={href}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03, duration: 0.2 }}
                >
                  <Link
                    href={href}
                    onClick={onClose}
                    aria-label={label}
                    aria-current={isActive ? "page" : undefined}
                    tabIndex={0}
                    className={`flex h-12 items-center gap-3.5 rounded-xl px-4 text-[15px] font-medium transition-colors ${
                      isActive
                        ? "bg-[var(--color-accent)]/10 text-[var(--color-accent)]"
                        : "text-[var(--color-foreground)] hover:bg-[var(--color-background-muted)]"
                    }`}
                  >
                    <Icon size={20} aria-hidden="true" />
                    {label}
                  </Link>
                </motion.li>
              );
            })}
          </ul>
        </nav>

        <div className="border-t border-[var(--color-border)] px-3 py-4">
          <button
            onClick={handleSignOut}
            aria-label={t("common.signOut")}
            tabIndex={0}
            className="flex h-12 w-full items-center gap-3.5 rounded-xl px-4 text-[15px] font-medium text-[var(--color-muted)] transition-colors hover:bg-[var(--color-background-muted)] hover:text-[var(--color-danger)]"
          >
            <LogOut size={20} aria-hidden="true" />
            {t("common.signOut")}
          </button>
        </div>
      </motion.aside>
    </>
  );
};
