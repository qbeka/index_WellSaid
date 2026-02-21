"use client";

import { useState, useMemo } from "react";
import { User, Globe, Phone } from "lucide-react";
import { LanguageSelect } from "@/components/language-select";
import { completeOnboarding } from "./actions";
import { t as translate } from "@/i18n";

type Step = 1 | 2 | 3;

const OnboardingPage = () => {
  const [step, setStep] = useState<Step>(1);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [preferredLanguage, setPreferredLanguage] = useState("");
  const [hospitalPhone, setHospitalPhone] = useState("");
  const [phoneExtension, setPhoneExtension] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const lang = preferredLanguage || "en";
  const t = useMemo(
    () => (key: string, vars?: Record<string, string>) => translate(lang, key, vars),
    [lang]
  );

  const step1Valid = firstName.trim().length > 0 && lastName.trim().length > 0;
  const step2Valid = preferredLanguage.length > 0;
  const step3Valid = true;

  const handleContinue = async () => {
    if (step === 1 && step1Valid) {
      setStep(2);
      return;
    }

    if (step === 2 && step2Valid) {
      setStep(3);
      return;
    }

    if (step === 3) {
      setLoading(true);
      setError("");

      const result = await completeOnboarding({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        preferredLanguage,
        hospitalPhone: hospitalPhone.trim(),
        phoneExtension: phoneExtension.trim(),
      });

      if (result?.error) {
        setError(result.error);
        setLoading(false);
      }
    }
  };

  const handleBack = () => {
    if (step === 2) setStep(1);
    if (step === 3) setStep(2);
  };

  const isCurrentStepValid =
    (step === 1 && step1Valid) ||
    (step === 2 && step2Valid) ||
    (step === 3 && step3Valid);

  const stepIcon = {
    1: <User size={32} className="text-[var(--color-accent)]" />,
    2: <Globe size={32} className="text-[var(--color-accent)]" />,
    3: <Phone size={32} className="text-[var(--color-accent)]" />,
  };

  const stepTitle = {
    1: t("onboarding.nameTitle"),
    2: t("onboarding.langTitle"),
    3: t("onboarding.phoneTitle"),
  };

  const stepSubtitle = {
    1: t("onboarding.nameSubtitle"),
    2: t("onboarding.langSubtitle"),
    3: t("onboarding.phoneSubtitle"),
  };

  return (
    <div className="flex flex-col items-center gap-8">
      <div className="flex items-center gap-2">
        {[1, 2, 3].map((s) => (
          <div
            key={s}
            className={`h-1.5 w-8 rounded-full transition-colors ${
              s <= step
                ? "bg-[var(--color-accent)]"
                : "bg-[var(--color-border)]"
            }`}
          />
        ))}
      </div>

      <div className="flex flex-col items-center gap-2">
        {stepIcon[step]}
        <h1 className="mt-2 text-xl font-semibold tracking-tight text-[var(--color-foreground)]">
          {stepTitle[step]}
        </h1>
        <p className="text-sm text-[var(--color-muted)]">
          {stepSubtitle[step]}
        </p>
      </div>

      <div className="flex w-full flex-col gap-4">
        {step === 1 && (
          <>
            <input
              type="text"
              placeholder={t("onboarding.firstName")}
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              autoFocus
              aria-label={t("onboarding.firstName")}
              className="h-12 w-full rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-5 text-base text-[var(--color-foreground)] outline-none placeholder:text-[var(--color-muted)] focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)]"
            />
            <input
              type="text"
              placeholder={t("onboarding.lastName")}
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              aria-label={t("onboarding.lastName")}
              className="h-12 w-full rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-5 text-base text-[var(--color-foreground)] outline-none placeholder:text-[var(--color-muted)] focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)]"
            />
          </>
        )}

        {step === 2 && (
          <LanguageSelect
            value={preferredLanguage}
            onChange={setPreferredLanguage}
          />
        )}

        {step === 3 && (
          <>
            <input
              type="tel"
              placeholder="(555) 555-5555"
              value={hospitalPhone}
              onChange={(e) => setHospitalPhone(e.target.value)}
              autoFocus
              aria-label={t("profile.hospitalPhone")}
              className="h-12 w-full rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-5 text-base text-[var(--color-foreground)] outline-none placeholder:text-[var(--color-muted)] focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)]"
            />
            <input
              type="text"
              placeholder="Ext. (optional)"
              value={phoneExtension}
              onChange={(e) => setPhoneExtension(e.target.value)}
              aria-label="Phone extension"
              className="h-12 w-full rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-5 text-base text-[var(--color-foreground)] outline-none placeholder:text-[var(--color-muted)] focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)]"
            />
          </>
        )}

        {error && (
          <p className="text-center text-sm text-[var(--color-danger)]">
            {error}
          </p>
        )}

        <button
          type="button"
          onClick={handleContinue}
          disabled={!isCurrentStepValid || loading}
          aria-label={step === 3 ? t("onboarding.getStarted") : t("onboarding.continue")}
          className="h-12 w-full rounded-full bg-[var(--color-accent)] text-base font-medium text-[var(--color-accent-foreground)] transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? t("common.saving") : step === 3 ? t("onboarding.getStarted") : t("onboarding.continue")}
        </button>

        {step > 1 && (
          <button
            type="button"
            onClick={handleBack}
            aria-label={t("common.goBack")}
            className="h-12 w-full rounded-full border border-[var(--color-border)] bg-transparent text-base font-medium text-[var(--color-muted)] transition-colors hover:bg-[var(--color-background-muted)]"
          >
            {t("common.back")}
          </button>
        )}
      </div>
    </div>
  );
};

export default OnboardingPage;
