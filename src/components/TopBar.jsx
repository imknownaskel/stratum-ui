import { Search, Bell } from "lucide-react";
import { useI18n } from "../i18n/context";
import "./TopBar.css";

function TopBar({ eyebrow, title, user, onLoginClick, onSignupClick, onLogoutClick }) {
  const { t } = useI18n();
  return (
    <div className="topbar">
      <div className="topbar-heading">
        {eyebrow && <span className="topbar-eyebrow">{eyebrow}</span>}
        {title && <span className="topbar-title">{title}</span>}
      </div>
      <div className="topbar-actions">
        <div className="topbar-search"><Search size={16} color="var(--color-mute)" /><input type="text" placeholder={t("Search Stratum")} /></div>
        <button className="topbar-icon-button" aria-label={t("Notifications")}><Bell size={17} /></button>
        {user ? (
          <div className="topbar-user"><div className="topbar-avatar">{user.initials}</div><button className="topbar-logout" onClick={onLogoutClick}>{t("Log out")}</button></div>
        ) : (
          <><button className="topbar-login" onClick={onLoginClick}>{t("Log in")}</button><button className="topbar-signup" onClick={onSignupClick}>{t("Sign up")}</button></>
        )}
      </div>
    </div>
  );
}
export default TopBar;