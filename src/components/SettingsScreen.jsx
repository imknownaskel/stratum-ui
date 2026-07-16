import { useState, useEffect } from "react";
import "./SettingsScreen.css";

function SettingsScreen() {
  const [theme, setTheme] = useState(
    () => localStorage.getItem("stratum_theme") || "light"
  );
  const [responseStyle, setResponseStyle] = useState(() => {
    const saved = localStorage.getItem("stratum_response_style");
    return saved ? Number(saved) : 50;
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("stratum_theme", theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem("stratum_response_style", responseStyle);
  }, [responseStyle]);

  const toggleTheme = () => {
    setTheme((t) => (t === "light" ? "dark" : "light"));
  };

  return (
    <div className="settings-screen">
      <h1 className="settings-title">Settings</h1>

      <section className="settings-section">
        <h2 className="settings-section-title">Appearance</h2>
        <div className="settings-row">
          <div>
            <span className="settings-row-label">Theme</span>
            <p className="settings-row-description">
              Switch between light and dark mode.
            </p>
          </div>
          <button
            className={`theme-toggle ${theme === "dark" ? "dark" : ""}`}
            onClick={toggleTheme}
            aria-label="Toggle theme"
          >
            <span className="theme-toggle-knob" />
          </button>
        </div>
      </section>

      <section className="settings-section">
        <h2 className="settings-section-title">Personalization</h2>
        <p className="settings-row-description">
          Personalize how Stratum works for you — adjust the response style
          below, set a default summary language, and choose which risk
          categories get flagged. More personalization options are on the way.
        </p>
      </section>

      <section className="settings-section">
        <h2 className="settings-section-title">Response Style</h2>
        <div className="settings-slider-block">
          <div className="settings-slider-labels">
            <span>Concise</span>
            <span>Detailed</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={responseStyle}
            onChange={(e) => setResponseStyle(Number(e.target.value))}
            className="settings-slider"
          />
        </div>
      </section>
    </div>
  );
}

export default SettingsScreen;