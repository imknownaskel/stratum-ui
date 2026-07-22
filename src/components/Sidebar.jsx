import { LayoutDashboard, Layers, Upload, PenSquare, HelpCircle, Settings } from "lucide-react";
import StratumLogo from "./StratumLogo";
import { useI18n } from "../i18n/context";
import "./Sidebar.css";

function Sidebar({ currentView, onNavigate, onUploadClick }) {
  const { t } = useI18n();
  const navItems = [
    { id: "home", label: t("Dashboard"), Icon: LayoutDashboard },
    { id: "compare", label: t("Policy Library"), Icon: Layers },
    { id: "upload", label: t("Upload"), Icon: Upload, action: "upload" },
    { id: "demo", label: t("Demo"), Icon: PenSquare },
  ];
  const handleClick = (item) => item.action === "upload" ? onUploadClick() : onNavigate(item.id);
  return (
    <aside className="sidebar">
      <div className="sidebar-logo"><StratumLogo size={30} textSize={17} showTagline /></div>
      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <button key={item.id} className={`sidebar-nav-item ${currentView === item.id ? "active" : ""}`} onClick={() => handleClick(item)}>
            <item.Icon size={18} strokeWidth={2} />{item.label}
          </button>
        ))}
      </nav>
      <div className="sidebar-footer">
        <button className={`sidebar-nav-item ${currentView === "help" ? "active" : ""}`} onClick={() => onNavigate("help")}>
          <HelpCircle size={18} strokeWidth={2} />{t("Help")}
        </button>
        <button className={`sidebar-nav-item ${currentView === "settings" ? "active" : ""}`} onClick={() => onNavigate("settings")}>
          <Settings size={18} strokeWidth={2} />{t("Settings")}
        </button>
      </div>
    </aside>
  );
}
export default Sidebar;