import { useCallback, useEffect, useMemo, useState } from "react";
import { I18nContext } from "./context";
import { normalizeLanguage } from "../lib/languages";
import fr from "./locales/fr.json";
import es from "./locales/es.json";
import pt from "./locales/pt.json";
import ha from "./locales/ha.json";
import yo from "./locales/yo.json";
import ig from "./locales/ig.json";

const catalogs = { fr, es, pt, ha, yo, ig };
const localeCodes = {
  en: "en-GB",
  fr: "fr-FR",
  es: "es-ES",
  pt: "pt-PT",
  ha: "ha-NG",
  yo: "yo-NG",
  ig: "ig-NG",
};


function interpolate(message, values) {
  return Object.entries(values).reduce(
    (result, [key, value]) => result.replaceAll(`{{${key}}}`, String(value)),
    message
  );
}

export function I18nProvider({ children }) {
  const [language, setLanguageState] = useState(() =>
    normalizeLanguage(localStorage.getItem("stratum_language"))
  );

  const setLanguage = useCallback((value) => {
    const normalized = normalizeLanguage(value);
    localStorage.setItem("stratum_language", normalized);
    setLanguageState(normalized);
  }, []);

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const t = useCallback((message, values = {}) => {
    const translated = catalogs[language]?.[message] || message;
    return interpolate(translated, values);
  }, [language]);

  const value = useMemo(() => ({
    language,
    locale: localeCodes[language],
    setLanguage,
    t,
  }), [language, setLanguage, t]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}
