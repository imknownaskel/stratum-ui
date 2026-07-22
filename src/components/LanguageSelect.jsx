import { useState } from "react";
import { useI18n } from "../i18n/context";
import { languages } from "../lib/languages";
import "./LanguageSelect.css";

function LanguageSelect({ onContinue }) {
  const { setLanguage, t } = useI18n();
  const [selected, setSelected] = useState(null);
  return (
    <div className="language-select-overlay">
      <div className="language-select-card">
        <h2 className="language-select-title">{t("Choose your language")}</h2>
        <p className="language-select-description">{t("The app and your summaries will use this language. You can change it later in Settings.")}</p>
        <div className="language-select-list">
          {languages.map((lang) => <button key={lang.code} className={`language-select-option ${selected === lang.code ? "active" : ""}`} onClick={() => { setSelected(lang.code); setLanguage(lang.code); }}>{lang.label}</button>)}
        </div>
        {selected && <button className="language-select-continue" onClick={() => onContinue(selected)}>{t("Continue")}</button>}
      </div>
    </div>
  );
}
export default LanguageSelect;