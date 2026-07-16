import { useState } from "react";
import Sidebar from "./components/NavBar";
import TopBar from "./components/TopBar";
import AuthPage from "./components/AuthPage";
import Overlay from "./components/Overlay";
import ResultCard from "./components/ResultCard";
import Dashboard from "./components/Dashboard";
import Onboarding from "./components/Onboarding";
import LanguageSelect from "./components/LanguageSelect";
import PolicyLibrary from "./components/PolicyLibrary";
import SettingsScreen from "./components/SettingsScreen";

function getInitials(name) {
  const parts = name.trim().split(" ").filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function App() {
  const [currentView, setCurrentView] = useState("home");
  const [showOverlay, setShowOverlay] = useState(false);
  const [cardStatus, setCardStatus] = useState(null);

  const [user, setUser] = useState(null);
  const [authView, setAuthView] = useState(null); // null | "login" | "signup"

  const [showLanguageSelect, setShowLanguageSelect] = useState(() => {
    return !localStorage.getItem("stratum_language");
  });

  const [showOnboarding, setShowOnboarding] = useState(() => {
    const languagePicked = localStorage.getItem("stratum_language");
    const onboardingSeen = localStorage.getItem("stratum_onboarding_seen");
    return Boolean(languagePicked) && !onboardingSeen;
  });

  const handleLanguageContinue = (languageCode) => {
    localStorage.setItem("stratum_language", languageCode);
    setShowLanguageSelect(false);

    const onboardingSeen = localStorage.getItem("stratum_onboarding_seen");
    if (!onboardingSeen) {
      setShowOnboarding(true);
    }
  };

  const handleOnboardingFinish = () => {
    localStorage.setItem("stratum_onboarding_seen", "true");
    setShowOnboarding(false);
  };

  const handleSummarizeClick = () => {
    setCardStatus("loading");
    setTimeout(() => {
      setCardStatus("success");
    }, 1500);
  };

  const handleAuthSubmit = ({ name }) => {
    setUser({ name, initials: getInitials(name) });
    setAuthView(null);
  };

  const handleLogout = () => {
    setUser(null);
  };

  if (authView) {
    return (
      <AuthPage
        mode={authView}
        onSwitchMode={setAuthView}
        onSubmit={handleAuthSubmit}
        onClose={() => setAuthView(null)}
      />
    );
  }

  return (
    <div>
      {showLanguageSelect && (
        <LanguageSelect onContinue={handleLanguageContinue} />
      )}

      {showOnboarding && <Onboarding onFinish={handleOnboardingFinish} />}

      <div style={{ display: "flex" }}>
        <Sidebar
          currentView={currentView}
          onNavigate={setCurrentView}
          onUploadClick={() => alert("Upload flow not built yet")}
        />

        <div style={{ flex: 1 }}>
          <TopBar
            user={user}
            onLoginClick={() => setAuthView("login")}
            onSignupClick={() => setAuthView("signup")}
            onLogoutClick={handleLogout}
          />

          {currentView === "home" && <Dashboard user={user} />}

          {currentView === "compare" && <PolicyLibrary />}

          {currentView === "settings" && <SettingsScreen />}

          {currentView === "help" && (
            <div style={{ padding: "var(--space-xl)", color: "var(--color-mute)" }}>
              Help screen not built yet.
            </div>
          )}

          {currentView === "demo" && (
            <div style={{ padding: "var(--space-lg)", position: "relative" }}>
              <button
                onClick={() => setShowOverlay(true)}
                style={{
                  background: "var(--color-card)",
                  color: "var(--color-mute)",
                  border: "none",
                  padding: "var(--space-sm) var(--space-md)",
                  borderRadius: "var(--radius-sm)",
                  fontSize: "var(--font-size-sm)",
                  cursor: "pointer",
                }}
              >
                Simulate text selection
              </button>

              {showOverlay && (
                <Overlay x={150} y={80} onSummarizeClick={handleSummarizeClick} />
              )}

              {cardStatus && (
                <div style={{ position: "absolute", top: 130, left: 150 }}>
                  <ResultCard
                    status={cardStatus}
                    summary="This app can share your data with advertisers, and you're giving up your right to sue in court."
                    flags={[
                      { label: "Auto-renewal clause detected", level: "high" },
                      { label: "Shares data with ad partners", level: "moderate" },
                      { label: "No arbitration clause found", level: "safe" },
                    ]}
                    onClose={() => setCardStatus(null)}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;