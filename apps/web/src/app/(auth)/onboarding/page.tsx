"use client";

import { useState } from "react";
import { User, Globe, Phone } from "lucide-react";
import { LanguageSelect } from "@/components/language-select";
import { completeOnboarding } from "./actions";

type Step = 1 | 2 | 3;

const OnboardingPage = () => {
  const [step, setStep] = useState<Step>(1);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [preferredLanguage, setPreferredLanguage] = useState("");
  const [hospitalPhone, setHospitalPhone] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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
    1: "What's your name?",
    2: "What language do you prefer?",
    3: "Your hospital's phone number",
  };

  const stepSubtitle = {
    1: "We'll use this to personalize your experience.",
    2: "We'll communicate with you in this language.",
    3: "Optional. We can help you schedule appointments.",
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
              placeholder="First name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              autoFocus
              aria-label="First name"
              className="h-12 w-full rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-5 text-base text-[var(--color-foreground)] outline-none placeholder:text-[var(--color-muted)] focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)]"
            />
            <input
              type="text"
              placeholder="Last name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              aria-label="Last name"
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
          <input
            type="tel"
            placeholder="(555) 555-5555"
            value={hospitalPhone}
            onChange={(e) => setHospitalPhone(e.target.value)}
            autoFocus
            aria-label="Hospital phone number"
            className="h-12 w-full rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-5 text-base text-[var(--color-foreground)] outline-none placeholder:text-[var(--color-muted)] focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)]"
          />
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
          aria-label={step === 3 ? "Finish onboarding" : "Continue"}
          className="h-12 w-full rounded-full bg-[var(--color-accent)] text-base font-medium text-[var(--color-accent-foreground)] transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Saving..." : step === 3 ? "Get started" : "Continue"}
        </button>

        {step > 1 && (
          <button
            type="button"
            onClick={handleBack}
            aria-label="Go back"
            className="h-12 w-full rounded-full border border-[var(--color-border)] bg-transparent text-base font-medium text-[var(--color-muted)] transition-colors hover:bg-[var(--color-background-muted)]"
          >
            Back
          </button>
        )}
      </div>
    </div>
  );
};

export default OnboardingPage;
