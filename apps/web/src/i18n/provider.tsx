"use client";

import { createContext, useContext, useCallback, useMemo } from "react";
import { t as translate } from "./translations";

type TranslationContextValue = {
  lang: string;
  t: (key: string, vars?: Record<string, string>) => string;
};

const TranslationContext = createContext<TranslationContextValue>({
  lang: "en",
  t: (key) => key,
});

export const TranslationProvider = ({
  lang,
  children,
}: {
  lang: string;
  children: React.ReactNode;
}) => {
  const t = useCallback(
    (key: string, vars?: Record<string, string>) => translate(lang, key, vars),
    [lang]
  );

  const value = useMemo(() => ({ lang, t }), [lang, t]);

  return (
    <TranslationContext.Provider value={value}>
      {children}
    </TranslationContext.Provider>
  );
};

export const useTranslation = () => useContext(TranslationContext);
