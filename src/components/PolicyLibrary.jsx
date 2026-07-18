import { useState, useMemo } from "react";
import { Search } from "lucide-react";
import "./PolicyLibrary.css";

const policies = [
  { id: "github-v1", company: "GitHub", category: "workspace", version: "v1", scannedLabel: "Jul 12, 2026", sortDate: "2026-07-12", summary: "Code and repository data may be used to improve AI code-suggestion features unless disabled in settings." },
  { id: "claude-v1", company: "Claude", category: "ai", version: "v1", scannedLabel: "Jun 28, 2026", sortDate: "2026-06-28", summary: "Conversations may be reviewed to improve models unless the user opts out in privacy controls." },
  { id: "chatgpt-v2", company: "ChatGPT", category: "ai", version: "v2", scannedLabel: "May 9, 2026", sortDate: "2026-05-09", summary: "Adds enterprise data-retention controls and clarifies model-training opt-out choices." },
  { id: "discord-v2", company: "Discord", category: "social", version: "v1", scannedLabel: "Apr 30, 2026", sortDate: "2026-04-30", summary: "New arbitration clause and updated US-based account data handling terms." },
  { id: "notion-v2", company: "Notion", category: "workspace", version: "v2", scannedLabel: "Feb 6, 2026", sortDate: "2026-02-06", summary: "Clarifies AI feature data handling and adds workspace-level admin export controls." },
  { id: "facebook-v1", company: "Facebook", category: "social", version: "v1", scannedLabel: "Jan 19, 2026", sortDate: "2026-01-19", summary: "Auto-renewal language and subscription-based ad preference terms were updated." },
  { id: "instagram-v3", company: "Instagram", category: "social", version: "v3", scannedLabel: "Jun 14, 2026", sortDate: "2026-06-14", summary: "Expanded ad-partner data sharing and updated facial recognition opt-out flow." },
  { id: "instagram-v2", company: "Instagram", category: "social", version: "v2", scannedLabel: "Nov 11, 2025", sortDate: "2025-11-11", summary: "Introduced third-party advertising data sharing." },
  { id: "instagram-v1", company: "Instagram", category: "social", version: "v1", scannedLabel: "Feb 2, 2025", sortDate: "2025-02-02", summary: "Original terms of service at account creation." },
  { id: "twitter-v2", company: "Twitter", category: "social", version: "v2", scannedLabel: "Dec 1, 2025", sortDate: "2025-12-01", summary: "Updated data-sharing terms following platform rebrand." },
  { id: "twitter-v1", company: "Twitter", category: "social", version: "v1", scannedLabel: "Apr 12, 2025", sortDate: "2025-04-12", summary: "Standard terms prior to rebrand, includes original arbitration clause." },
  { id: "vscode-v1", company: "VS Code", category: "workspace", version: "v1", scannedLabel: "Feb 25, 2026", sortDate: "2026-02-25", summary: "Telemetry is on by default; extensions may collect additional usage data separately." },
];

const filters = [
  { id: "all", label: "All" },
  { id: "social", label: "Social" },
  { id: "ai", label: "AI" },
  { id: "workspace", label: "Workspace" },
];

function PolicyLibrary() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [selectedIds, setSelectedIds] = useState([]);
  const [view, setView] = useState("library");

  const sorted = useMemo(() => [...policies].sort((a, b) => (a.sortDate < b.sortDate ? 1 : -1)), []);

  const visible = sorted.filter((p) => {
    const matchesSearch = p.company.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = activeFilter === "all" || p.category === activeFilter;
    return matchesSearch && matchesFilter;
  });

  const toggleSelect = (id) => {
    setSelectedIds((current) =>
      current.includes(id) ? current.filter((sid) => sid !== id) : [...current, id]
    );
  };

  const selectedPolicies = policies.filter((p) => selectedIds.includes(p.id));
  const canCompare = selectedIds.length >= 2;

  if (view === "compare") {
    return (
      <div className="policy-library">
        <button className="policy-compare-back" onClick={() => setView("library")}>
          ← Back to Library
        </button>
        <div className="policy-compare-columns">
          {selectedPolicies.map((p) => (
            <div key={p.id} className="policy-compare-card">
              <div className="policy-compare-card-title">
                {p.company} <span className="policy-card-version">{p.version}</span>
              </div>
              <span className="policy-compare-card-date">Scanned {p.scannedLabel}</span>
              <p className="policy-compare-card-summary">{p.summary}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="policy-library">
      <h1 className="policy-library-title">Policy Library</h1>
      <p className="policy-library-subtitle">
        Search companies and select two or more policies to compare what they collect, share, and retain.
      </p>

      <div className="policy-library-controls">
        <div className="policy-search-wrap">
          <Search size={16} color="var(--color-mute)" />
          <input
            type="text"
            className="policy-search"
            placeholder="Search companies..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="policy-filters">
          {filters.map((f) => (
            <button
              key={f.id}
              className={`policy-filter-button ${activeFilter === f.id ? "active" : ""}`}
              onClick={() => setActiveFilter(f.id)}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <p className="policy-library-hint">Click on a policy to select.</p>

      <div className="policy-grid">
        {visible.map((p) => {
          const isSelected = selectedIds.includes(p.id);
          return (
            <div
              key={p.id}
              className={`policy-card ${isSelected ? "selected" : ""}`}
              onClick={() => toggleSelect(p.id)}
            >
              <div className="policy-card-top">
                <span className="policy-card-company">{p.company}</span>
                <span className="policy-card-version">{p.version}</span>
              </div>
              <span className="policy-card-meta">
                Scanned {p.scannedLabel} <span className="dot">◆</span> {p.category}
              </span>
              <p className="policy-card-summary">{p.summary}</p>
              <span className="policy-card-select">
                {isSelected ? "Selected ✓" : "Select policy"}
              </span>
            </div>
          );
        })}
      </div>

      {selectedIds.length > 0 && (
        <button
          className={`policy-compare-fab ${canCompare ? "enabled" : "disabled"}`}
          disabled={!canCompare}
          onClick={() => canCompare && setView("compare")}
        >
          Compare {selectedIds.length > 1 ? `(${selectedIds.length})` : ""}
        </button>
      )}
    </div>
  );
}

export default PolicyLibrary;