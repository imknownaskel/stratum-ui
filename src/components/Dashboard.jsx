import "./Dashboard.css";

function Dashboard({ user, onDeleteClick }) {
  const displayUser = user || {
    name: "John Doe",
    initials: "JD",
    email: "john.doe@example.com",
  };

  const stats = {
    documents: 22,
    policiesScanned: 47,
    joined: "Jan 14, 2026",
    plan: "Free Plan",
  };

  return (
    <div className="dashboard">
      <h1 className="dashboard-title">Dashboard</h1>

      <div className="dashboard-profile-card">
        <div className="dashboard-avatar">{displayUser.initials}</div>

        <div className="dashboard-profile-info">
          <span className="dashboard-name">{displayUser.name}</span>
          <span className="dashboard-email">
            {displayUser.email || "No email on file (demo account)"}
          </span>
        </div>

        <div className="dashboard-stats">
          <div className="dashboard-stat">
            <span className="dashboard-stat-value">{stats.documents}</span>
            <span className="dashboard-stat-label">Documents</span>
          </div>
          <div className="dashboard-stat">
            <span className="dashboard-stat-value">{stats.policiesScanned}</span>
            <span className="dashboard-stat-label">Policies Scanned</span>
          </div>
          <div className="dashboard-stat">
            <span className="dashboard-stat-value">{stats.joined}</span>
            <span className="dashboard-stat-label">Joined</span>
          </div>
          <div className="dashboard-stat">
            <span className="dashboard-stat-value">{stats.plan}</span>
            <span className="dashboard-stat-label">Plan</span>
          </div>
        </div>

        <button className="dashboard-delete-button" onClick={onDeleteClick}>
          Delete Account
        </button>
      </div>
    </div>
  );
}

export default Dashboard;