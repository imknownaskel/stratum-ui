import "./TopBar.css";

function TopBar({ user, onLoginClick, onSignupClick, onLogoutClick }) {
  return (
    <div className="topbar">
      {user ? (
        <div className="topbar-user">
          <div className="topbar-avatar">{user.initials}</div>
          <span className="topbar-username">{user.name}</span>
          <button className="topbar-logout" onClick={onLogoutClick}>
            Log out
          </button>
        </div>
      ) : (
        <div className="topbar-auth-buttons">
          <button className="topbar-login" onClick={onLoginClick}>
            Log in
          </button>
          <button className="topbar-signup" onClick={onSignupClick}>
            Sign up
          </button>
        </div>
      )}
    </div>
  );
}

export default TopBar;