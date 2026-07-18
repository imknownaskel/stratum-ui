import { Search, Bell } from "lucide-react";
import "./TopBar.css";

function TopBar({ eyebrow, title, user, onLoginClick, onSignupClick, onLogoutClick }) {
  return (
    <div className="topbar">
      <div className="topbar-heading">
        {eyebrow && <span className="topbar-eyebrow">{eyebrow}</span>}
        {title && <span className="topbar-title">{title}</span>}
      </div>

      <div className="topbar-actions">
        <div className="topbar-search">
          <Search size={16} color="var(--color-mute)" />
          <input type="text" placeholder="Search Stratum" />
        </div>

        <button className="topbar-icon-button" aria-label="Notifications">
          <Bell size={17} />
        </button>

        {user ? (
          <div className="topbar-user">
            <div className="topbar-avatar">{user.initials}</div>
            <button className="topbar-logout" onClick={onLogoutClick}>Log out</button>
          </div>
        ) : (
          <>
            <button className="topbar-login" onClick={onLoginClick}>Log in</button>
            <button className="topbar-signup" onClick={onSignupClick}>Sign up</button>
          </>
        )}
      </div>
    </div>
  );
}

export default TopBar;