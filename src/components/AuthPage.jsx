import { useState } from "react";
import { useI18n } from "../i18n/context";
import "./AuthPage.css";

function AuthPage({ mode, initialError = "", onSwitchMode, onSubmit, onClose }) {
  const { t } = useI18n();
  const isLogin = mode === "login";
  const isSignup = mode === "signup";
  const isForgot = mode === "forgot";
  const isReset = mode === "reset";
  const [contactMethod, setContactMethod] = useState("email");
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(initialError);
  const [notice, setNotice] = useState("");

  const title = isLogin ? t("Welcome back") : isSignup ? t("Create your account") : isForgot ? t("Reset your password") : t("Choose a new password");
  const subtitle = isLogin ? t("Log in to continue to Stratum") : isSignup ? t("Sign up to start summarizing") : isForgot ? t("We will email you a secure reset link") : t("Use at least 8 characters for your new password");
  const submitLabel = isLogin ? t("Log in") : isSignup ? t("Sign up") : isForgot ? t("Send reset link") : t("Update password");

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setNotice("");
    if (isReset && password !== confirmPassword) { setError(t("The passwords do not match.")); return; }
    setSubmitting(true);
    try {
      const result = await onSubmit({ mode, contactMethod, name, contact, password });
      if (result.requiresVerification) setNotice(contactMethod === "email" ? t("Check your email to confirm your account, then log in.") : t("Check your phone for the Supabase verification message."));
      if (isForgot) setNotice(result.message);
    } catch (requestError) {
      setError(requestError.message || t("Authentication failed. Please try again."));
    } finally { setSubmitting(false); }
  };

  const switchMode = (nextMode) => {
    setError(""); setNotice(""); setPassword(""); setConfirmPassword(""); onSwitchMode(nextMode);
  };

  return (
    <div className="auth-page">
      <button className="auth-close" onClick={onClose} aria-label={t("Close authentication")}>×</button>
      <div className="auth-card">
        <h1 className="auth-title">{title}</h1><p className="auth-subtitle">{subtitle}</p>
        {(isLogin || isSignup) && <>
          <div className="auth-social-buttons">
            <button type="button" className="auth-social-button" onClick={() => setError(t("Google login is coming next."))}><span className="auth-social-icon">G</span>{isLogin ? t("Log in with Google") : t("Sign up with Google")}</button>
            <button type="button" className="auth-social-button" onClick={() => setError(t("Apple login is coming next."))}><span className="auth-social-icon">A</span>{isLogin ? t("Log in with Apple") : t("Sign up with Apple")}</button>
          </div>
          <div className="auth-divider"><span>{t("or")}</span></div>
          <div className="auth-contact-toggle">
            <button type="button" className={`auth-contact-tab ${contactMethod === "email" ? "active" : ""}`} onClick={() => setContactMethod("email")}>{t("Email")}</button>
            <button type="button" className={`auth-contact-tab ${contactMethod === "phone" ? "active" : ""}`} onClick={() => setContactMethod("phone")}>{t("Phone")}</button>
          </div>
        </>}
        <form className="auth-form" onSubmit={handleSubmit}>
          {isSignup && <input type="text" className="auth-input" placeholder={t("Full name")} value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" required />}
          {!isReset && <input type={isForgot || contactMethod === "email" ? "email" : "tel"} className="auth-input" placeholder={isForgot || contactMethod === "email" ? t("Email address") : t("Phone number")} value={contact} onChange={(event) => setContact(event.target.value)} autoComplete={isForgot || contactMethod === "email" ? "email" : "tel"} required />}
          {!isForgot && <input type="password" className="auth-input" placeholder={isReset ? t("New password") : t("Password")} value={password} onChange={(event) => setPassword(event.target.value)} autoComplete={isLogin ? "current-password" : "new-password"} minLength={8} required />}
          {isReset && <input type="password" className="auth-input" placeholder={t("Confirm new password")} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} autoComplete="new-password" minLength={8} required />}
          {isLogin && <button type="button" className="auth-forgot" onClick={() => switchMode("forgot")}>{t("Forgot password?")}</button>}
          {error && <p className="auth-feedback auth-feedback--error" role="alert">{error}</p>}
          {notice && <p className="auth-feedback auth-feedback--success" role="status">{notice}</p>}
          <button type="submit" className="auth-submit" disabled={submitting}>{submitting ? t("Please wait…") : submitLabel}</button>
        </form>
        {!isReset && <p className="auth-switch">
          {isForgot ? t("Remembered your password?") : isLogin ? t("Do not have an account?") : t("Already have an account?")} {" "}
          <button type="button" className="auth-switch-link" onClick={() => switchMode(isSignup || isForgot ? "login" : "signup")}>{isLogin ? t("Sign up") : t("Log in")}</button>
        </p>}
      </div>
    </div>
  );
}
export default AuthPage;