export const SUPPORTED_LANGUAGES = [
  { code: "en", label: "English" },
  { code: "es", label: "Spanish" },
  { code: "zh", label: "Mandarin" },
  { code: "yue", label: "Cantonese" },
  { code: "ko", label: "Korean" },
  { code: "ja", label: "Japanese" },
  { code: "vi", label: "Vietnamese" },
  { code: "tl", label: "Tagalog" },
  { code: "ar", label: "Arabic" },
  { code: "pt", label: "Portuguese" },
  { code: "sq", label: "Albanian" },
  { code: "fr", label: "French" },
  { code: "hi", label: "Hindi" },
  { code: "ru", label: "Russian" },
] as const;

export type LanguageCode = (typeof SUPPORTED_LANGUAGES)[number]["code"];

export const LANG_TO_BCP47: Record<string, string> = {
  en: "en-US",
  es: "es-ES",
  zh: "zh-CN",
  yue: "zh-HK",
  ko: "ko-KR",
  ja: "ja-JP",
  vi: "vi-VN",
  tl: "fil-PH",
  ar: "ar-SA",
  pt: "pt-BR",
  sq: "sq-AL",
  fr: "fr-FR",
  hi: "hi-IN",
  ru: "ru-RU",
};
