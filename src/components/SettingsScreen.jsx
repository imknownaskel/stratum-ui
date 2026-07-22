import { useState, useEffect } from "react";
import { Palette, User, SlidersHorizontal, Sparkles, Check, Languages } from "lucide-react";
import { preferencesApi } from "../lib/api";
import { languages, normalizeLanguage } from "../lib/languages";
import { useI18n } from "../i18n/context";
import "./SettingsScreen.css";

const accentPresets = [
  { id: "blue", label: "Blue", primary: "#2F6FE4", secondary: "#6BA0F0" },
  { id: "teal", label: "Teal", primary: "#0F9D58", secondary: "#4ECB8C" },
  { id: "purple", label: "Purple", primary: "#7C5CFC", secondary: "#A78BFA" },
  { id: "coral", label: "Coral", primary: "#E4573B", secondary: "#F0876F" },
  { id: "rose", label: "Rose", primary: "#DB4D8A", secondary: "#EB84B4" },
];

const fontPresets = [
  { id: "inter", label: "Inter", family: `"Inter", sans-serif`, sample: "Aa" },
  { id: "poppins", label: "Poppins", family: `"Poppins", sans-serif`, sample: "Aa" },
  { id: "grotesk", label: "Space Grotesk", family: `"Space Grotesk", sans-serif`, sample: "Aa" },
];

function responseLabel(value, t) {
  if (value < 34) return t("Concise");
  if (value < 67) return t("Balanced");
  return t("Detailed");
}

function SettingsScreen({ user }) {
  const { language, setLanguage, t } = useI18n();
  const [theme, setTheme] = useState(
    () => localStorage.getItem("stratum_theme") || "light"
  );
  const [displayName, setDisplayName] = useState(
    () => localStorage.getItem("stratum_display_name") || (user?.name?.split(" ")[0] ?? "")
  );
  const [autoSummaries, setAutoSummaries] = useState(
    () => localStorage.getItem("stratum_auto_summaries") !== "false"
  );
  const [responseStyle, setResponseStyle] = useState(() => {
    const saved = localStorage.getItem("stratum_response_style");
    return saved ? Number(saved) : 50;
  });
  const [accent, setAccent] = useState(
    () => localStorage.getItem("stratum_accent") || "blue"
  );
  const [font, setFont] = useState(
    () => localStorage.getItem("stratum_font") || "inter"
  );

  const [preferencesReady, setPreferencesReady] = useState(false);
  const [saveStatus, setSaveStatus] = useState("");

  useEffect(() => {
    if (!user) return undefined;
    let active = true;
    preferencesApi.get()
      .then(({ preferences }) => {
        if (!active) return;
        setTheme(preferences.theme);
        setDisplayName(preferences.displayName || user.name || "");
        setAutoSummaries(preferences.autoSummaries);
        setResponseStyle(preferences.responseStyle);
        setAccent(preferences.accent);
        setFont(preferences.font);
        setLanguage(normalizeLanguage(preferences.language));
        setPreferencesReady(true);
      })
      .catch((error) => active && setSaveStatus(error.message || "Unable to load saved preferences."));
    return () => { active = false; };
  }, [setLanguage, user]);

  useEffect(() => {
    if (!user || !preferencesReady) return undefined;
    const timer = window.setTimeout(async () => {
      setSaveStatus(t("Saving…"));
      try {
        await preferencesApi.update({ theme, displayName, autoSummaries, responseStyle, accent, font, language });
        setSaveStatus(t("Saved"));
      } catch (error) {
        setSaveStatus(error.message || t("Unable to save preferences."));
      }
    }, 500);
    return () => window.clearTimeout(timer);
  }, [accent, autoSummaries, displayName, font, language, preferencesReady, responseStyle, t, theme, user]);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("stratum_theme", theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem("stratum_display_name", displayName);
  }, [displayName]);

  useEffect(() => {
    localStorage.setItem("stratum_auto_summaries", autoSummaries);
  }, [autoSummaries]);

  useEffect(() => {
    localStorage.setItem("stratum_response_style", responseStyle);
  }, [responseStyle]);


  useEffect(() => {
    const preset = accentPresets.find((a) => a.id === accent) || accentPresets[0];
    document.documentElement.style.setProperty("--color-primary", preset.primary);
    document.documentElement.style.setProperty("--color-secondary", preset.secondary);
    document.documentElement.style.setProperty(
      "--shadow-button",
      `0 4px 14px ${preset.primary}47`
    );
    localStorage.setItem("stratum_accent", accent);
  }, [accent]);

  useEffect(() => {
    const preset = fontPresets.find((f) => f.id === font) || fontPresets[0];
    document.documentElement.style.setProperty("--font-body", preset.family);
    localStorage.setItem("stratum_font", font);
  }, [font]);

  const displayUser = {
    name: user?.name || "Alex Sterling",
    initials: user?.initials || "AS",
    email: user?.email || "alex@acmecorp.com",
    role: t("Workspace administrator"),
  };

  return (
    <div className="settings-screen">
      <div className="settings-profile-card">
        <div className="settings-profile-left">
          <div className="settings-profile-avatar">{displayUser.initials}</div>
          <div>
            <span className="settings-profile-name">{displayUser.name}</span>
            <span className="settings-profile-meta">
              {displayUser.email} <span className="dot">◆</span> {displayUser.role}
            </span>
          </div>
        </div>
        <button
          className="settings-edit-profile"
          onClick={() => alert(t("Edit profile is not available yet."))}
        >
          {t("Edit profile")}
        </button>
      </div>

      <div className="settings-grid">
        <section className="settings-card">
          <div className="settings-card-header">
            <div className="settings-card-icon">
              <Palette size={16} />
            </div>
            <div>
              <h2 className="settings-card-title">{t("Appearance")}</h2>
              <p className="settings-card-description">
                {t("Choose how Stratum looks across every page.")}
              </p>
            </div>
          </div>

          <div className="theme-swatches">
            <button
              className={`theme-swatch ${theme === "light" ? "active" : ""}`}
              onClick={() => setTheme("light")}
            >
              <div className="theme-swatch-preview light-preview">
                <span className="swatch-block swatch-white" />
                <span className="swatch-block swatch-accent" />
              </div>
              <div className="theme-swatch-label">
                <span>☀ Light</span>
                {theme === "light" && <Check size={14} />}
              </div>
            </button>

            <button
              className={`theme-swatch ${theme === "dark" ? "active" : ""}`}
              onClick={() => setTheme("dark")}
            >
              <div className="theme-swatch-preview dark-preview">
                <span className="swatch-block swatch-dark" />
                <span className="swatch-block swatch-dark-accent" />
              </div>
              <div className="theme-swatch-label">
                <span>☾ Dark</span>
                {theme === "dark" && <Check size={14} />}
              </div>
            </button>
          </div>
        </section>

        <section className="settings-card">
          <div className="settings-card-header">
            <div className="settings-card-icon">
              <User size={16} />
            </div>
            <div>
              <h2 className="settings-card-title">{t("Personalization")}</h2>
              <p className="settings-card-description">
                {t("Tell Stratum how to tailor your experience.")}
              </p>
            </div>
          </div>

          <label className="settings-label">{t("What should Stratum call you?")}</label>
          <input
            type="text"
            className="settings-input"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder={t("Your name")}
          />

          <label className="settings-label" htmlFor="settings-language">{t("App and summary language")}</label>
          <div className="settings-language-control">
            <Languages size={17} aria-hidden="true" />
            <select
              id="settings-language"
              className="settings-select"
              value={language}
              onChange={(event) => setLanguage(event.target.value)}
            >
              {languages.map((option) => (
                <option key={option.code} value={option.code}>{option.label}</option>
              ))}
            </select>
          </div>
          <p className="settings-field-help">
            {t("Navigation, screens, and new or regenerated summaries use this language. Source evidence stays unchanged.")}
          </p>
          <div className="settings-toggle-row">
            <div className="settings-toggle-left">
              <div className="settings-card-icon small">
                <Sparkles size={14} />
              </div>
              <div>
                <span className="settings-row-label">{t("Automatic quick summaries")}</span>
                <p className="settings-row-description">
                  {t("Show a short takeaway when you open a policy")}
                </p>
              </div>
            </div>
            <button
              className={`theme-toggle ${autoSummaries ? "dark" : ""}`}
              onClick={() => setAutoSummaries((v) => !v)}
              aria-label={t("Toggle automatic quick summaries")}
            >
              <span className="theme-toggle-knob" />
            </button>
          </div>

          <label className="settings-label">{t("Accent color")}</label>
          <div className="accent-swatch-row">
            {accentPresets.map((preset) => (
              <button
                key={preset.id}
                className={`accent-swatch ${accent === preset.id ? "active" : ""}`}
                style={{ background: preset.primary }}
                onClick={() => setAccent(preset.id)}
                aria-label={t(preset.label)}
              >
                {accent === preset.id && <Check size={13} color="#fff" />}
              </button>
            ))}
          </div>

          <label className="settings-label">{t("Font")}</label>
          <div className="font-option-row">
            {fontPresets.map((preset) => (
              <button
                key={preset.id}
                className={`font-option ${font === preset.id ? "active" : ""}`}
                style={{ fontFamily: preset.family }}
                onClick={() => setFont(preset.id)}
              >
                <span className="font-option-sample">{preset.sample}</span>
                {preset.label}
              </button>
            ))}
          </div>
        </section>
      </div>

      <section className="settings-card settings-response-card">
        <div className="settings-card-header">
          <div className="settings-card-icon">
            <SlidersHorizontal size={16} />
          </div>
          <div>
            <h2 className="settings-card-title">{t("Response style")}</h2>
            <p className="settings-card-description">
              {t("Control how much detail Stratum includes in new and regenerated policy summaries.")}
            </p>
          </div>
          <span className="response-badge">{responseLabel(responseStyle, t)}</span>
          {user && <span className="settings-save-status" role="status">{saveStatus}</span>}
        </div>

        <div className="settings-slider-labels">
          <div>
            <span className="slider-label-main">{t("Concise")}</span>
            <span className="slider-label-sub">{t("Quick takeaways")}</span>
          </div>
          <div className="slider-label-right">
            <span className="slider-label-main">{t("Detailed")}</span>
            <span className="slider-label-sub">{t("More context and explanation")}</span>
          </div>
        </div>

        <input
          type="range"
          min="0"
          max="100"
          value={responseStyle}
          onChange={(e) => setResponseStyle(Number(e.target.value))}
          className="settings-slider"
          aria-valuetext={responseLabel(responseStyle, t)}
        />
      </section>
    </div>
  );
}

export default SettingsScreen;