import { useState } from "react";
import { useI18n } from "../i18n/context";
import "./AuthPage.css";

function MfaPage({ mfa, onVerify, onCancel }) {
  const { t } = useI18n();
  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const enrolling = mfa.mode === "enroll";
  const handleSubmit = async (event) => {
    event.preventDefault(); setError("");
    if (!/^\d{6}$/.test(code)) { setError(t("Enter the six-digit code from your authenticator app.")); return; }
    setSubmitting(true);
    try { await onVerify({ factorId: mfa.factorId, code }); }
    catch (requestError) { setError(requestError.message || t("Unable to verify this code.")); }
    finally { setSubmitting(false); }
  };
  return (
    <div className="auth-page">
      <button className="auth-close" onClick={onCancel} aria-label={t("Cancel secure sign-in")}>×</button>
      <div className="auth-card auth-mfa-card">
        <h1 className="auth-title">{enrolling ? t("Secure your account") : t("Verification required")}</h1>
        <p className="auth-subtitle">{enrolling ? t("Set up Stratum in an authenticator app for your first secure sign-in.") : t("Open your authenticator app and enter the current Stratum code.")}</p>
        {enrolling && <div className="auth-mfa-enrollment">
          <ol className="auth-mfa-steps"><li>{t("Open Google Authenticator, Authy, 1Password, or another TOTP app.")}</li><li>{t("Scan this QR code or enter the setup key manually.")}</li><li>{t("Enter the six-digit code it generates.")}</li></ol>
          {mfa.qrCode && <img className="auth-mfa-qr" src={mfa.qrCode} alt={t("Stratum authenticator setup QR code")} />}
          {mfa.secret && <div className="auth-mfa-secret"><span>{t("Manual setup key")}</span><code>{mfa.secret}</code></div>}
        </div>}
        <form className="auth-form" onSubmit={handleSubmit}>
          <input type="text" className="auth-input auth-mfa-code" placeholder="000000" value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))} inputMode="numeric" autoComplete="one-time-code" aria-label={t("Six-digit authenticator code")} autoFocus required />
          {error && <p className="auth-feedback auth-feedback--error" role="alert">{error}</p>}
          <button type="submit" className="auth-submit" disabled={submitting || code.length !== 6}>{submitting ? t("Verifying…") : enrolling ? t("Finish secure setup") : t("Verify and continue")}</button>
          <button type="button" className="auth-mfa-cancel" onClick={onCancel} disabled={submitting}>{t("Cancel sign-in")}</button>
        </form>
      </div>
    </div>
  );
}
export default MfaPage;