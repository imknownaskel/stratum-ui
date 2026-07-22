import { useI18n } from "../i18n/context";
import "./Dashboard.css";

function Dashboard({ user, authLoading, onLoginClick }) {
  const { t } = useI18n();
  if (authLoading) return <div className="dashboard"><h1 className="dashboard-title">{t("Dashboard")}</h1><div className="dashboard-signed-out-card"><h2 className="dashboard-signed-out-title">{t("Restoring your session…")}</h2></div></div>;
  if (!user) return (
    <div className="dashboard">
      <h1 className="dashboard-title">{t("Dashboard")}</h1>
      <div className="dashboard-signed-out-card">
        <div className="dashboard-signed-out-icon">🔒</div>
        <h2 className="dashboard-signed-out-title">{t("Not signed in yet")}</h2>
        <p className="dashboard-signed-out-description">{t("Log in or create an account to see your documents, scanned policies, and account details here.")}</p>
        <button className="dashboard-signed-out-button" onClick={onLoginClick}>{t("Log in / Sign up")}</button>
      </div>
    </div>
  );
  const stats = { documents: 0, policiesScanned: 0, joined: t("New account"), plan: t("Free Plan") };
  return (
    <div className="dashboard">
      <h1 className="dashboard-title">{t("Dashboard")}</h1>
      <div className="dashboard-profile-card">
        <div className="dashboard-avatar">{user.initials}</div>
        <div className="dashboard-profile-info"><span className="dashboard-name">{user.name}</span><span className="dashboard-email">{user.email || user.phone || t("Supabase account")}</span></div>
        <div className="dashboard-stats">
          <div className="dashboard-stat"><span className="dashboard-stat-value">{stats.documents}</span><span className="dashboard-stat-label">{t("Documents")}</span></div>
          <div className="dashboard-stat"><span className="dashboard-stat-value">{stats.policiesScanned}</span><span className="dashboard-stat-label">{t("Policies Scanned")}</span></div>
          <div className="dashboard-stat"><span className="dashboard-stat-value">{stats.joined}</span><span className="dashboard-stat-label">{t("Joined")}</span></div>
          <div className="dashboard-stat"><span className="dashboard-stat-value">{stats.plan}</span><span className="dashboard-stat-label">{t("Plan")}</span></div>
        </div>
      </div>
    </div>
  );
}
export default Dashboard;