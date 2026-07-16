import "./NavBar.css";

function Sidebar({ currentView, onNavigate, onUploadClick }) {
  const navItems = [
    { id: "home", label: "Dashboard", icon: "🏠" },
    { id: "compare", label: "Policy Library", icon: "📁" },
    { id: "upload", label: "Upload", icon: "⬆️", action: "upload" },
    { id: "demo", label: "Demo", icon: "✏️" },
  ];

  const handleClick = (item) => {
    if (item.action === "upload") {
      onUploadClick();
    } else {
      onNavigate(item.id);
    }
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">Stratum</div>

      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <button
            key={item.id}
            className={`sidebar-nav-item ${currentView === item.id ? "active" : ""}`}
            onClick={() => handleClick(item)}
          >
            <span className="sidebar-nav-icon">{item.icon}</span>
            {item.label}
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
        <button
          className={`sidebar-nav-item ${currentView === "help" ? "active" : ""}`}
          onClick={() => onNavigate("help")}
        >
          <span className="sidebar-nav-icon">❓</span>
          Help
        </button>
        <button
          className={`sidebar-nav-item ${currentView === "settings" ? "active" : ""}`}
          onClick={() => onNavigate("settings")}
        >
          <span className="sidebar-nav-icon">⚙️</span>
          Settings
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;