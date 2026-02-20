import { z } from "zod";

export const onboardingStep1Schema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
});

export const onboardingStep2Schema = z.object({
  preferredLanguage: z.string().min(1, "Please select a language"),
});

export const onboardingStep3Schema = z.object({
  hospitalPhone: z.string().min(7, "Please enter a valid phone number"),
});

export type OnboardingStep1 = z.infer<typeof onboardingStep1Schema>;
export type OnboardingStep2 = z.infer<typeof onboardingStep2Schema>;
export type OnboardingStep3 = z.infer<typeof onboardingStep3Schema>;
