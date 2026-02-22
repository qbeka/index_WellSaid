"use client";

import { useState, useMemo } from "react";
import { User, Globe, Phone, Users } from "lucide-react";
import { LanguageSelect } from "@/components/language-select";
import { completeOnboarding } from "./actions";
import { t as translate } from "@/i18n";

import Image from "next/image";
import backgroundImage from "@/images/background.png";

type Step = 1 | 2 | 3 | 4;

const OnboardingPage = () => {
  const [step, setStep] = useState<Step>(1);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [preferredLanguage, setPreferredLanguage] = useState("");
  const [genderIdentity, setGenderIdentity] = useState("");
  const [pronouns, setPronouns] = useState("");
  const [hospitalPhone, setHospitalPhone] = useState("");
  const [phoneExtension, setPhoneExtension] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const lang = preferredLanguage || "en";
  const t = useMemo(
    () => (key: string, vars?: Record<string, string>) => translate(lang, key, vars),
    [lang]
  );

  const step1Valid = preferredLanguage.length > 0;
  const step2Valid = firstName.trim().length > 0 && lastName.trim().length > 0; 
  const step3Valid = true;
  const step4Valid = true;

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
      setStep(4);
      return;
    }

    if (step === 4) {
      setLoading(true);
      setError("");

      const result = await completeOnboarding({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        preferredLanguage,
        genderIdentity: genderIdentity.trim(),
        pronouns: pronouns.trim(),
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
    if (step === 4) setStep(3);
  };

  const isCurrentStepValid =
    (step === 1 && step1Valid) ||
    (step === 2 && step2Valid) ||
    (step === 3 && step3Valid) ||
    (step === 4 && step4Valid);

  const stepIcon = {
    1: <Globe size={50} className="text-[var(--color-white)]" />,
    2: <User size={50} className="text-[var(--color-white)]" />,
    3: <Users size={50} className="text-[var(--color-white)]" />,
    4: <Phone size={50} className="text-[var(--color-white)]" />,
  };

  const stepTitle = {
    1: t("onboarding.langTitle"),
    2: t("onboarding.nameTitle"),
    3: t("onboarding.genderTitle"),
    4: t("onboarding.phoneTitle"),
  };

  const stepSubtitle = {
    1: t("onboarding.langSubtitle"),
    2: t("onboarding.nameSubtitle"),
    3: t("onboarding.genderSubtitle"),
    4: t("onboarding.phoneSubtitle"),
  };

 return (
     <>
       <style>{`
         .glass-input {
          background: rgba(255, 255, 255, 0.15);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.25);
          color: white;
         }
         .glass-input::placeholder {
           color: rgba(255, 255, 255, 0.55);
         }
         .glass-input:focus {
          outline: none;
          border-color: rgba(255, 255, 255, 0.5);
          background: rgba(255, 255, 255, 0.2);
         }
         .glass-button {
          background: rgba(255, 255, 255, 0.15);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.25);
          color: white;
          transition: background 0.2s;
         }
         .glass-button:hover:not(:disabled) {
          background: rgba(255, 255, 255, 0.25);
         }
         .glass-button:disabled {
          opacity: 0.4;
          cursor: not-allowed;
         }
       `}</style>
 
       <div className="fixed inset-0">
        <Image
          src={backgroundImage}
          alt="Background Image"
          fill
          priority
          className="object-cover scale-111 blur-[1rem]"
        />
       </div>
 
       <div className="flex min-h-screen flex-col items-center justify-center px-6">
         <div className="flex w-full max-w-sm flex-col items-center gap-8">
 
           <div className="flex items-center gap-2">
             {[1, 2, 3, 4].map((s) => (
               <div
                 key={s}
                 className="h-1.5 w-8 rounded-full transition-all duration-300"
                 style={{
                   background: s <= step
                     ? "rgba(255,255,255,0.9)"
                     : "rgba(255,255,255,0.3)",
                 }}
               />
             ))}
           </div>
 
           <div className="flex flex-col items-center gap-2 text-center">
              <h2 className="text-[2rem] font-bold tracking-tight text-white drop-shadow font-montserrat">
                {stepIcon[step]}
             </h2>

             <h1 className="text-[2rem] font-bold tracking-tight text-white drop-shadow font-montserrat">
                {stepTitle[step]}
             </h1>
         
             <p className="text-[1rem] tracking-tight text-white drop-shadow font-montserrat">
               {stepSubtitle[step]}
             </p>
           </div>
 
           <div className="flex w-full flex-col gap-3">
             {step === 2 && (
               <>
                 <input
                   type="text"
                   placeholder={t("onboarding.firstName")}
                   value={firstName}
                   onChange={(e) => setFirstName(e.target.value)}
                   autoFocus
                   aria-label={t("onboarding.firstName")}
                   className="glass-input h-12 w-full rounded-full px-5 text-base font-montserrat"
                   style={{ fontWeight: 500 }}
                 />
                 <input
                  type="text"
                  placeholder={t("onboarding.lastName")}
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  aria-label={t("onboarding.lastName")}
                  className="glass-input h-12 w-full rounded-full px-5 text-base font-montserrat"
                  style={{ fontWeight: 500 }}
                 />
               </>
             )}
 
             {step === 1 && (
               <LanguageSelect
                 value={preferredLanguage}
                 onChange={setPreferredLanguage}
               />
             )}
 
            {step === 3 && (
              <>
                <input
                  type="text"
                  placeholder={t("onboarding.genderPlaceholder")}
                  value={genderIdentity}
                  onChange={(e) => setGenderIdentity(e.target.value)}
                  autoFocus
                  aria-label={t("onboarding.genderIdentity")}
                  className="glass-input h-12 w-full rounded-full px-5 text-base font-montserrat"
                  style={{ fontWeight: 500 }}
                />
                <input
                  type="text"
                  placeholder={t("onboarding.pronounsPlaceholder")}
                  value={pronouns}
                  onChange={(e) => setPronouns(e.target.value)}
                  aria-label={t("onboarding.pronouns")}
                  className="glass-input h-12 w-full rounded-full px-5 text-base font-montserrat"
                  style={{ fontWeight: 500 }}
                />
              </>
            )}

            {step === 4 && (
              <>
                <input
                  type="tel"
                  placeholder="(555) 555-5555"
                  value={hospitalPhone}
                  onChange={(e) => setHospitalPhone(e.target.value)}
                  autoFocus
                  aria-label={t("profile.hospitalPhone")}
                  className="glass-input h-12 w-full rounded-full px-5 text-base font-montserrat"
                />
                <input
                  type="text"
                  placeholder="Ext. (optional)"
                  value={phoneExtension}
                  onChange={(e) => setPhoneExtension(e.target.value)}
                  aria-label="Phone extension"
                  className="glass-input h-12 w-full rounded-full px-5 text-base font-montserrat"
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
              aria-label={step === 4 ? t("onboarding.getStarted") : t("onboarding.continue")}
              className="glass-button h-12 w-full rounded-full text-base font-montserrat"
            >
              {loading ? t("common.saving") : step === 4 ? t("onboarding.getStarted") : t("onboarding.continue")}
             
            </button>
              {step > 1 && (
                <button
                  type="button"
                  onClick={handleBack}
                  aria-label={t("common.goBack")}
                  className="glass-button color-black h-12 w-full rounded-full text-base font-montserrat"
                >  
                  {t("common.back")}
               </button>
             )}

           </div>
         </div>
       </div>
     </>
   );
 };

export default OnboardingPage;
