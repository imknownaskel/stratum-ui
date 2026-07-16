import { useState } from "react";
import "./LanguageSelect.css";

const languages = [
  { code: "en", label: "English" },
  { code: "fr", label: "Français" },
  { code: "es", label: "Español" },
  { code: "pt", label: "Português" },
  { code: "ha", label: "Hausa" },
  { code: "yo", label: "Yorùbá" },
  { code: "ig", label: "Igbo" },
];

function LanguageSelect({ onContinue }) {
  const [selected, setSelected] = useState(null);

  return (
    <div className="language-select-overlay">
      <div className="language-select-card">
        <h2 className="language-select-title">Choose your language</h2>
        <p className="language-select-description">
          Summaries will be shown in this language. You can change this later in settings.
        </p>

        <div className="language-select-list">
          {languages.map((lang) => (
            <button
              key={lang.code}
              className={`language-select-option ${selected === lang.code ? "active" : ""}`}
              onClick={() => setSelected(lang.code)}
            >
              {lang.label}
            </button>
          ))}
        </div>

        {selected && (
          <button
            className="language-select-continue"
            onClick={() => onContinue(selected)}
          >
            Continue
          </button>
        )}
      </div>
    </div>
  );
}

export default LanguageSelect;