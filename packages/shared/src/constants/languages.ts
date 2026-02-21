export const SUPPORTED_LANGUAGES = [
  { code: "en", label: "English" },
  { code: "fr", label: "Français" },
  { code: "es", label: "Español" },
  { code: "zh", label: "普通话" },
  { code: "ar", label: "عربي" },
  { code: "tl", label: "Filipino" },
  { code: "hi", label: "हिंदी" },
  { code: "ja", label: "日本語" },
  { code: "ko", label: "한국어" },
  { code: "pt", label: "Português" },
  { code: "ru", label: "Русский" },
  { code: "sq", label: "Shqip" },
  { code: "vi", label: "Tiếng Việt" },
  { code: "yue", label: "粵語" },
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
  tl: "tl-PH",
  ar: "ar-SA",
  pt: "pt-BR",
  sq: "sq-AL",
  fr: "fr-FR",
  hi: "hi-IN",
  ru: "ru-RU",
};
