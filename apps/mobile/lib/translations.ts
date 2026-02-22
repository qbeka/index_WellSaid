export const SUPPORTED_LANGUAGES = [
  { code: "en", label: "English" },
  { code: "sq", label: "Albanian" },
  { code: "es", label: "Spanish" },
  { code: "zh", label: "Mandarin" },
  { code: "yue", label: "Cantonese" },
  { code: "ko", label: "Korean" },
  { code: "ja", label: "Japanese" },
  { code: "vi", label: "Vietnamese" },
  { code: "tl", label: "Tagalog" },
  { code: "ar", label: "Arabic" },
  { code: "pt", label: "Portuguese" },
  { code: "fr", label: "French" },
  { code: "de", label: "German" },
  { code: "it", label: "Italian" },
  { code: "ru", label: "Russian" },
  { code: "hi", label: "Hindi" },
  { code: "bn", label: "Bengali" },
  { code: "pl", label: "Polish" },
  { code: "uk", label: "Ukrainian" },
  { code: "tr", label: "Turkish" },
] as const;

const translations: Record<string, Record<string, string>> = {
  en: { home: "Home", health: "Health", documents: "Documents", translate: "Translate", settings: "Settings", signOut: "Sign Out", save: "Save", cancel: "Cancel" },
};

export const t = (key: string, lang = "en"): string => {
  return translations[lang]?.[key] ?? translations.en?.[key] ?? key;
};
