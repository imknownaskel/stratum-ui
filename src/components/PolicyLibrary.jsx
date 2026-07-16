import { useState, useMemo } from "react";
import "./PolicyLibrary.css";

// Mock data — flattened so each version is its own card.
// sortDate controls "most recently scanned first" ordering.
const policies = [
  { id: "github-v1", company: "GitHub", category: "workspace", version: "v1", scannedLabel: "Jul 12, 2026", sortDate: "2026-07-12", summary: "Code and repo data may be used to improve AI code-suggestion features unless disabled in settings." },
  { id: "claude-v1", company: "Claude", category: "ai", version: "v1", scannedLabel: "Jun 28, 2026", sortDate: "2026-06-28", summary: "Conversations may be used to improve models unless the user opts out in privacy settings." },
  { id: "instagram-v3", company: "Instagram", category: "social", version: "v3", scannedLabel: "Jun 14, 2026", sortDate: "2026-06-14", summary: "Expanded ad-partner data sharing and updated facial recognition opt-out flow." },
  { id: "tiktok-v1", company: "TikTok", category: "social", version: "v1", scannedLabel: "May 22, 2026", sortDate: "2026-05-22", summary: "Behavioral data may be shared with the parent company's global ad network." },
  { id: "chatgpt-v2", company: "ChatGPT", category: "ai", version: "v2", scannedLabel: "May 9, 2026", sortDate: "2026-05-09", summary: "Adds enterprise data-retention controls and clarifies model-training opt-out." },
  { id: "discord-v2", company: "Discord", category: "social", version: "v2", scannedLabel: "Apr 30, 2026", sortDate: "2026-04-30", summary: "New arbitration clause added for US-based accounts." },
  { id: "gemini-v1", company: "Gemini", category: "ai", version: "v1", scannedLabel: "Mar 18, 2026", sortDate: "2026-03-18", summary: "Usage data linked across Google products unless activity controls are adjusted." },
  { id: "vscode-v1", company: "VS Code", category: "workspace", version: "v1", scannedLabel: "Feb 25, 2026", sortDate: "2026-02-25", summary: "Telemetry is on by default; extensions may collect additional usage data separately." },
  { id: "notion-v2", company: "Notion", category: "workspace", version: "v2", scannedLabel: "Feb 6, 2026", sortDate: "2026-02-06", summary: "Clarifies AI feature data handling and adds workspace-level admin export controls." },
  { id: "facebook-v2", company: "Facebook", category: "social", version: "v2", scannedLabel: "Jan 19, 2026", sortDate: "2026-01-19", summary: "Auto-renewal language added for subscription-based features." },
  { id: "chatgpt-v1", company: "ChatGPT", category: "ai", version: "v1", scannedLabel: "Jan 4, 2026", sortDate: "2026-01-04", summary: "Original data-usage and retention terms for free-tier accounts." },
  { id: "instagram-v2", company: "Instagram", category: "social", version: "v2", scannedLabel: "Nov 11, 2025", sortDate: "2025-11-11", summary: "Introduced third-party advertising data sharing." },
  { id: "googledrive-v1", company: "Google Drive", category: "workspace", version: "v1", scannedLabel: "Nov 2, 2025", sortDate: "2025-11-02", summary: "Files may be scanned automatically for malware and policy-violating content." },
  { id: "notion-v1", company: "Notion", category: "workspace", version: "v1", scannedLabel: "Oct 15, 2025", sortDate: "2025-10-15", summary: "Standard workspace data terms, no AI training clause present." },
  { id: "discord-v1", company: "Discord", category: "social", version: "v1", scannedLabel: "Sep 20, 2025", sortDate: "2025-09-20", summary: "Original community-server data handling and moderation terms." },
  { id: "zoom-v1", company: "Zoom", category: "workspace", version: "v1", scannedLabel: "Dec 3, 2025", sortDate: "2025-12-03", summary: "Meeting recordings may be retained by the host account's organization admin." },
  { id: "linkedin-v1", company: "LinkedIn", category: "social", version: "v1", scannedLabel: "Jul 8, 2025", sortDate: "2025-07-08", summary: "Profile data used for third-party recruiter tools unless visibility is restricted." },
  { id: "slack-v1", company: "Slack", category: "workspace", version: "v1", scannedLabel: "Aug 14, 2025", sortDate: "2025-08-14", summary: "Messages may be retained indefinitely unless workspace admin sets a retention limit." },
  { id: "twitter-v2", company: "Twitter", category: "social", version: "v2", scannedLabel: "Dec 1, 2025", sortDate: "2025-12-01", summary: "Updated data-sharing terms following platform rebrand." },
  { id: "facebook-v1", company: "Facebook", category: "social", version: "v1", scannedLabel: "Mar 5, 2025", sortDate: "2025-03-05", summary: "Original terms covering ad targeting and data retention." },
  { id: "twitter-v1", company: "Twitter", category: "social", version: "v1", scannedLabel: "Apr 12, 2025", sortDate: "2025-04-12", summary: "Standard terms prior to rebrand, includes original arbitration clause." },
  { id: "instagram-v1", company: "Instagram", category: "social", version: "v1", scannedLabel: "Feb 2, 2025", sortDate: "2025-02-02", summary: "Original terms of service at account creation." },
];

const filters = [
  { id: "social", label: "Social" },
  { id: "ai", label: "AI" },
  { id: "workspace", label: "Workspace" },
];

function PolicyLibrary() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [view, setView] = useState("library"); // "library" | "compare"

  const sorted = useMemo(
    () => [...policies].sort((a, b) => (a.sortDate < b.sortDate ? 1 : -1)),
    []
  );

  const visible = sorted.filter((p) => {
    const matchesSearch = p.company.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = !activeFilter || p.category === activeFilter;
    return matchesSearch && matchesFilter;
  });

  const toggleFilter = (id) => {
    setActiveFilter((current) => (current === id ? null : id));
  };

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
        <div className="policy-library-header">
          <button className="policy-compare-back" onClick={() => setView("library")}>
            ← Back to Library
          </button>
        </div>

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
      <div className="policy-library-header">
        <h1 className="policy-library-title">Policy Library</h1>

        <div className="policy-library-controls">
          <input
            type="text"
            className="policy-search"
            placeholder="Search companies..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />

          <div className="policy-filters">
            {filters.map((f) => (
              <button
                key={f.id}
                className={`policy-filter-button ${activeFilter === f.id ? "active" : ""}`}
                onClick={() => toggleFilter(f.id)}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <p className="policy-library-hint">Click on a policy to select.</p>

      <div className="policy-grid">
        {visible.map((p) => {
          const isSelected = selectedIds.includes(p.id);
          return (
            <button
              key={p.id}
              className={`policy-card ${isSelected ? "selected" : ""}`}
              onClick={() => toggleSelect(p.id)}
            >
              {isSelected && <span className="policy-card-check">✓</span>}
              <div className="policy-card-top">
                <span className="policy-card-company">{p.company}</span>
                <span className="policy-card-version">{p.version}</span>
              </div>
              <span className="policy-card-date">Scanned {p.scannedLabel}</span>
              <p className="policy-card-summary">{p.summary}</p>
            </button>
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