import { useEffect, useState } from "react";
import Sidebar from "./components/Sidebar";
import TopBar from "./components/TopBar";
import AuthPage from "./components/AuthPage";
import MfaPage from "./components/MfaPage";
import Dashboard from "./components/Dashboard";
import Onboarding from "./components/Onboarding";
import LanguageSelect from "./components/LanguageSelect";
import PolicyLibrary from "./components/PolicyLibrary";
import SettingsScreen from "./components/SettingsScreen";
import UploadModal from "./components/UploadModal";
import HelpScreen from "./components/HelpScreen";
import DemoScreen from "./components/DemoScreen";
import { authApi, preferencesApi } from "./lib/api";
import { useI18n } from "./i18n/context";

function getEmailLinkPayload() {
  const query = new URLSearchParams(window.location.search);
  const fragment = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  const accessToken = fragment.get("access_token");
  const refreshToken = fragment.get("refresh_token");
  const action = query.get("auth_action") || fragment.get("type");
  const error = fragment.get("error_description") || query.get("error_description");

  if (accessToken || refreshToken || action || error) {
    window.history.replaceState({}, document.title, window.location.pathname);
  }

  return { accessToken, refreshToken, action, error };
}

function App() {
  const { setLanguage, t } = useI18n();
  const [currentView, setCurrentView] = useState("home");
  const [showOverlay, setShowOverlay] = useState(false);
  const [overlayPos, setOverlayPos] = useState({ x: 0, y: 0 });
  const [cardStatus, setCardStatus] = useState(null);
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authView, setAuthView] = useState(null);
  const [authEntryError, setAuthEntryError] = useState("");
  const [mfaState, setMfaState] = useState(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadRefreshKey, setUploadRefreshKey] = useState(0);

  const [showLanguageSelect, setShowLanguageSelect] = useState(() => {
    return !localStorage.getItem("stratum_language");
  });

  const [showOnboarding, setShowOnboarding] = useState(() => {
    const languagePicked = localStorage.getItem("stratum_language");
    const onboardingSeen = localStorage.getItem("stratum_onboarding_seen");
    return Boolean(languagePicked) && !onboardingSeen;
  });

  useEffect(() => {
    let active = true;

    const restoreAuth = async () => {
      const link = getEmailLinkPayload();
      try {
        if (link.error) throw new Error(link.error);

        if (link.accessToken && link.refreshToken) {
          const data = await authApi.consumeSession({
            accessToken: link.accessToken,
            refreshToken: link.refreshToken,
            action: link.action === "recovery" ? "recovery" : "confirmed",
          });
          if (!active) return;
          if (data.requiresMfa) {
            setUser(null);
            setMfaState(data.mfa);
            return;
          }
          setUser(data.user);
          if (link.action === "recovery") setAuthView("reset");
          return;
        }

        const data = await authApi.session();
        if (active) {
          if (data.requiresMfa) {
            const mfa = data.mfa.mode === "start-enroll"
              ? (await authApi.startMfa()).mfa
              : data.mfa;
            setUser(null);
            setMfaState(mfa);
          } else {
            setUser(data.user);
          }
        }
      } catch (error) {
        if (!active) return;
        setUser(null);
        setAuthEntryError(error.message || "This email link is invalid or has expired.");
        setAuthView("login");
      } finally {
        if (active) setAuthLoading(false);
      }
    };

    restoreAuth();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!user) return undefined;
    let active = true;
    const syncLanguage = async () => {
      try {
        const pending = localStorage.getItem("stratum_language_pending_sync") === "true";
        if (pending) {
          await preferencesApi.update({ language: localStorage.getItem("stratum_language") || "en" });
          localStorage.removeItem("stratum_language_pending_sync");
          return;
        }
        const { preferences } = await preferencesApi.get();
        if (!active) return;
        setLanguage(preferences.language || "en");
        setShowLanguageSelect(false);
      } catch (error) {
        console.warn("Unable to sync language preference:", error.message);
      }
    };
    void syncLanguage();
    return () => { active = false; };
  }, [setLanguage, user]);
  useEffect(() => {
    const handleMfaRequired = async () => {
      try {
        const data = await authApi.session();
        if (data.requiresMfa) {
          const mfa = data.mfa.mode === "start-enroll"
            ? (await authApi.startMfa()).mfa
            : data.mfa;
          setUser(null);
          setMfaState(mfa);
        }
      } catch {
        setUser(null);
        setAuthView("login");
      }
    };
    window.addEventListener("stratum:mfa-required", handleMfaRequired);
    return () => window.removeEventListener("stratum:mfa-required", handleMfaRequired);
  }, []);

  const handleLanguageContinue = (languageCode) => {
    setLanguage(languageCode);
    localStorage.setItem("stratum_language_pending_sync", "true");
    setShowLanguageSelect(false);
    if (!localStorage.getItem("stratum_onboarding_seen")) setShowOnboarding(true);
  };

  const handleOnboardingFinish = () => {
    localStorage.setItem("stratum_onboarding_seen", "true");
    setShowOnboarding(false);
  };

  const handleSummarizeClick = () => {
    setCardStatus("loading");
    setTimeout(() => setCardStatus("success"), 1500);
  };

  const openAuth = (view) => {
    setAuthEntryError("");
    setAuthView(view);
  };

  const handleUploadClick = () => {
    if (!user) {
      openAuth("login");
      return;
    }
    setShowUploadModal(true);
  };

  const handleAuthSubmit = async (values) => {
    if (values.mode === "forgot") {
      return authApi.forgotPassword(values.contact);
    }

    if (values.mode === "reset") {
      const data = await authApi.updatePassword({ password: values.password });
      if (data.requiresMfa) {
        setUser(null);
        setMfaState(data.mfa);
        setAuthView(null);
      } else {
        setUser(data.user);
        setAuthView(null);
      }
      return data;
    }

    const data = values.mode === "login"
      ? await authApi.login(values)
      : await authApi.signup(values);

    if (data.requiresMfa) {
      setUser(null);
      setMfaState(data.mfa);
      setAuthView(null);
    } else if (data.authenticated) {
      setUser(data.user);
      setAuthView(null);
    }
    return data;
  };

  const handleMfaVerify = async (values) => {
    const data = await authApi.verifyMfa(values);
    setUser(data.user);
    setMfaState(null);
    setAuthView(null);
    return data;
  };

  const cancelMfa = async () => {
    try {
      await authApi.logout();
    } finally {
      setMfaState(null);
      setUser(null);
    }
  };

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } finally {
      setUser(null);
      setMfaState(null);
      setCurrentView("home");
    }
  };

  if (mfaState) {
    return <MfaPage mfa={mfaState} onVerify={handleMfaVerify} onCancel={cancelMfa} />;
  }

  if (authView) {
    return (
      <AuthPage
        mode={authView}
        initialError={authEntryError}
        onSwitchMode={openAuth}
        onSubmit={handleAuthSubmit}
        onClose={() => setAuthView(null)}
      />
    );
  }

  return (
    <div>
      {showLanguageSelect && <LanguageSelect onContinue={handleLanguageContinue} />}
      {showOnboarding && <Onboarding onFinish={handleOnboardingFinish} />}
      {showUploadModal && (
        <UploadModal
          onClose={() => setShowUploadModal(false)}
          onUploaded={() => {
            setUploadRefreshKey((current) => current + 1);
            setCurrentView("compare");
            setShowUploadModal(false);
          }}
        />
      )}

      <div style={{ display: "flex" }}>
        <Sidebar
          currentView={currentView}
          onNavigate={setCurrentView}
          onUploadClick={handleUploadClick}
        />

        <div style={{ flex: 1 }}>
          {currentView !== "home" && (
            <TopBar
              eyebrow={
                currentView === "compare" ? t("Select policies to compare") :
                currentView === "settings" ? t("Preferences") :
                currentView === "help" ? t("Support") : t("Try it out")
              }
              title={
                currentView === "compare" ? t("Policy Library") :
                currentView === "settings" ? t("Settings") :
                currentView === "help" ? t("Help & Support") : t("Demo")
              }
              user={user}
              onLoginClick={() => openAuth("login")}
              onSignupClick={() => openAuth("signup")}
              onLogoutClick={handleLogout}
            />
          )}

          {currentView === "home" && (
            <Dashboard
              user={user}
              authLoading={authLoading}
              onLoginClick={() => openAuth("login")}
            />
          )}
          {currentView === "compare" && <PolicyLibrary user={user} refreshKey={uploadRefreshKey} />}
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
