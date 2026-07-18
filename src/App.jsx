import { useState } from "react";
import Sidebar from "./components/Sidebar";
import TopBar from "./components/TopBar";
import AuthPage from "./components/AuthPage";
import Dashboard from "./components/Dashboard";
import Onboarding from "./components/Onboarding";
import LanguageSelect from "./components/LanguageSelect";
import PolicyLibrary from "./components/PolicyLibrary";
import SettingsScreen from "./components/SettingsScreen";
import UploadModal from "./components/UploadModal";
import DeleteAccountModal from "./components/DeleteAccountModal";
import HelpScreen from "./components/HelpScreen";
import DemoScreen from "./components/DemoScreen";

function getInitials(name) {
  const parts = name.trim().split(" ").filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function App() {
  const [currentView, setCurrentView] = useState("home");

  const [showOverlay, setShowOverlay] = useState(false);
  const [overlayPos, setOverlayPos] = useState({ x: 0, y: 0 });
  const [cardStatus, setCardStatus] = useState(null);

  const [user, setUser] = useState(null);
  const [authView, setAuthView] = useState(null); // null | "login" | "signup"

  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

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

  const handleAccountDeleted = () => {
    setShowDeleteModal(false);
    setUser(null);
    setCurrentView("home");
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

      {showUploadModal && (
        <UploadModal onClose={() => setShowUploadModal(false)} />
      )}

      {showDeleteModal && (
        <DeleteAccountModal
          onClose={() => setShowDeleteModal(false)}
          onConfirmDelete={handleAccountDeleted}
        />
      )}

      <div style={{ display: "flex" }}>
        <Sidebar
          currentView={currentView}
          onNavigate={setCurrentView}
          onUploadClick={() => setShowUploadModal(true)}
        />

        <div style={{ flex: 1 }}>
          {currentView !== "home" && (
            <TopBar
              eyebrow={
                currentView === "compare" ? "Select policies to compare" :
                currentView === "settings" ? "Preferences" :
                currentView === "help" ? "Support" : "Try it out"
              }
              title={
                currentView === "compare" ? "Policy Library" :
                currentView === "settings" ? "Settings" :
                currentView === "help" ? "Help & Support" : "Demo"
              }
              user={user}
              onLoginClick={() => setAuthView("login")}
              onSignupClick={() => setAuthView("signup")}
              onLogoutClick={handleLogout}
            />
          )}

          {currentView === "home" && (
            <Dashboard
              user={user}
              onDeleteClick={() => setShowDeleteModal(true)}
              onLoginClick={() => setAuthView("login")}
            />
          )}

          {currentView === "compare" && <PolicyLibrary />}

          {currentView === "settings" && <SettingsScreen user={user} />}

          {currentView === "help" && <HelpScreen />}

          {currentView === "demo" && (
            <DemoScreen
              showOverlay={showOverlay}
              overlayPos={overlayPos}
              setShowOverlay={setShowOverlay}
              setOverlayPos={setOverlayPos}
              cardStatus={cardStatus}
              setCardStatus={setCardStatus}
              handleSummarizeClick={handleSummarizeClick}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default App;