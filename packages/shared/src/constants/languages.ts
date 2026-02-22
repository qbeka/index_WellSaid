export const SUPPORTED_LANGUAGES = [
  { code: "ar", label: "عربي" },
  { code: "de", label: "Deutsch" },
  { code: "en", label: "English" },
  { code: "es", label: "Español" },
  { code: "fr", label: "Français" },
  { code: "tl", label: "Filipino" },
  { code: "hi", label: "हिंदी" },
  { code: "ja", label: "日本語" },
  { code: "ko", label: "한국어" },
  { code: "nl", label: "Nederlands" },
  { code: "zh", label: "普通话" },
  { code: "pt", label: "Português" },
  { code: "ru", label: "Русский" },
  { code: "sq", label: "Shqip" },
  { code: "vi", label: "Tiếng Việt" },
  { code: "yue", label: "粵語" },
] as const;

export type LanguageCode = (typeof SUPPORTED_LANGUAGES)[number]["code"];

export const LANG_TO_BCP47: Record<string, string> = {
  de: "de-DE",
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
  nl: "nl-NL",
  ru: "ru-RU",
};
