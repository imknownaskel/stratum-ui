import { useEffect, useMemo, useState } from "react";
import { FileText, RefreshCw, Search, Trash2 } from "lucide-react";
import { policyApi } from "../lib/api";
import { useI18n } from "../i18n/context";
import "./PolicyLibrary.css";

const demoPolicies = [
  { id: "github-v1", company: "GitHub", category: "workspace", version: "v1", sortDate: "2026-07-12", summary: "Code and repository data may be used to improve AI code-suggestion features unless disabled in settings." },
  { id: "claude-v1", company: "Claude", category: "ai", version: "v1", sortDate: "2026-06-28", summary: "Conversations may be reviewed to improve models unless the user opts out in privacy controls." },
  { id: "chatgpt-v2", company: "ChatGPT", category: "ai", version: "v2", sortDate: "2026-05-09", summary: "Adds enterprise data-retention controls and clarifies model-training opt-out choices." },
  { id: "discord-v2", company: "Discord", category: "social", version: "v1", sortDate: "2026-04-30", summary: "New arbitration clause and updated US-based account data handling terms." },
  { id: "notion-v2", company: "Notion", category: "workspace", version: "v2", sortDate: "2026-02-06", summary: "Clarifies AI feature data handling and adds workspace-level admin export controls." },
  { id: "facebook-v1", company: "Facebook", category: "social", version: "v1", sortDate: "2026-01-19", summary: "Auto-renewal language and subscription-based ad preference terms were updated." },
  { id: "instagram-v3", company: "Instagram", category: "social", version: "v3", sortDate: "2026-06-14", summary: "Expanded ad-partner data sharing and updated facial recognition opt-out flow." },
  { id: "instagram-v2", company: "Instagram", category: "social", version: "v2", sortDate: "2025-11-11", summary: "Introduced third-party advertising data sharing." },
  { id: "instagram-v1", company: "Instagram", category: "social", version: "v1", sortDate: "2025-02-02", summary: "Original terms of service at account creation." },
  { id: "twitter-v2", company: "Twitter", category: "social", version: "v2", sortDate: "2025-12-01", summary: "Updated data-sharing terms following platform rebrand." },
  { id: "twitter-v1", company: "Twitter", category: "social", version: "v1", sortDate: "2025-04-12", summary: "Standard terms prior to rebrand, including the original arbitration clause." },
  { id: "vscode-v1", company: "VS Code", category: "workspace", version: "v1", sortDate: "2026-02-25", summary: "Telemetry is on by default; extensions may collect additional usage data separately." },
];

function statusDescription(document, t) {
  if (document.status === "ready") return document.summary?.overview || t("AI summary ready.");
  if (document.status === "summarizing") return t("The AI is analyzing clauses, risks, and user rights…");
  if (document.status === "extracted") return t("Text extracted. Waiting for the NVIDIA summarizer.");
  if (document.status === "processing") return t("Stratum is extracting readable policy text…");
  if (document.status === "failed") return document.error_message || t("Policy processing failed.");
  return t("Waiting to begin text extraction.");
}

function SummaryList({ title, items }) {
  if (!items?.length) return null;
  return <section className="policy-summary-section"><h3>{title}</h3><ul>{items.map((item, index) => <li key={`${title}-${index}`}>{item}</li>)}</ul></section>;
}

function PolicyLibrary({ user, refreshKey = 0 }) {
  const { locale, t } = useI18n();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [selectedIds, setSelectedIds] = useState([]);
  const [view, setView] = useState("library");
  const [documents, setDocuments] = useState([]);
  const [documentsLoading, setDocumentsLoading] = useState(Boolean(user));
  const [documentsError, setDocumentsError] = useState("");
  const [activeDocument, setActiveDocument] = useState(null);
  const filters = [{ id: "all", label: t("All") }, { id: "social", label: t("Social") }, { id: "ai", label: t("AI") }, { id: "workspace", label: t("Workspace") }];
  const formatDate = (value) => new Intl.DateTimeFormat(locale, { year: "numeric", month: "short", day: "numeric" }).format(new Date(value));

  useEffect(() => {
    if (!user) return undefined;
    let cancelled = false; let timer;
    const loadAndSchedule = async () => {
      try {
        const result = await policyApi.list();
        if (cancelled) return;
        setDocuments(result.documents); setDocumentsError("");
        if (result.documents.some((document) => ["uploaded", "processing", "summarizing"].includes(document.status) || (document.status === "extracted" && result.aiConfigured))) timer = window.setTimeout(loadAndSchedule, 3000);
      } catch (error) { if (!cancelled) setDocumentsError(error.message || t("Unable to load uploaded policies.")); }
      finally { if (!cancelled) setDocumentsLoading(false); }
    };
    void loadAndSchedule();
    return () => { cancelled = true; window.clearTimeout(timer); };
  }, [refreshKey, t, user]);

  const sorted = useMemo(() => [...demoPolicies].sort((a, b) => b.sortDate.localeCompare(a.sortDate)), []);
  const visible = sorted.filter((policy) => policy.company.toLowerCase().includes(searchQuery.toLowerCase()) && (activeFilter === "all" || policy.category === activeFilter));
  const selectedPolicies = demoPolicies.filter((policy) => selectedIds.includes(policy.id));
  const canCompare = selectedIds.length >= 2;
  const toggleSelect = (id) => setSelectedIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  const openDocument = async (document) => {
    if (document.status !== "ready") return;
    try { const result = await policyApi.get(document.id); setActiveDocument(result.document); setDocumentsError(""); }
    catch (error) { setDocumentsError(error.message || t("Unable to open policy text.")); }
  };
  const retryDocument = async (documentId) => {
    try { const result = await policyApi.retry(documentId); setDocuments((current) => current.map((document) => document.id === documentId ? { ...document, ...result.document } : document)); setDocumentsError(""); }
    catch (error) { setDocumentsError(error.message || t("Unable to retry policy processing.")); }
  };
  const deleteDocument = async (documentId) => {
    if (!window.confirm(t("Delete this uploaded policy?"))) return;
    try { await policyApi.remove(documentId); setDocuments((current) => current.filter((document) => document.id !== documentId)); setDocumentsError(""); }
    catch (error) { setDocumentsError(error.message || t("Unable to delete policy.")); }
  };

  if (activeDocument) return (
    <div className="policy-library">
      <button className="policy-compare-back" onClick={() => setActiveDocument(null)}>← {t("Back to Library")}</button>
      <div className="policy-document-detail">
        <span className="policy-document-status ready">{t("Ready")}</span><h1 className="policy-library-title">{activeDocument.original_name}</h1>
        <p className="policy-library-subtitle">{activeDocument.word_count?.toLocaleString(locale)} {t("words")} · {activeDocument.extraction_method}{activeDocument.page_count ? ` · ${activeDocument.page_count} ${t(activeDocument.page_count === 1 ? "page" : "pages")}` : ""}</p>
        {activeDocument.summary ? <div className="policy-ai-summary">
          <div className="policy-summary-overview"><div><span className="policy-summary-label">{t("Plain-language summary")}</span><p>{activeDocument.summary.overview}</p></div><span className={`policy-risk-level ${activeDocument.summary.risk_level}`}>{t(activeDocument.summary.risk_level)} {t("risk")}</span></div>
          <SummaryList title={t("Key points")} items={activeDocument.summary.key_points} />
          {activeDocument.summary.risk_flags?.length > 0 && <section className="policy-summary-section"><h3>{t("Risk flags")}</h3><div className="policy-risk-grid">{activeDocument.summary.risk_flags.map((flag, index) => <article key={`${flag.title}-${index}`} className={`policy-risk-flag ${flag.severity}`}><div><strong>{flag.title}</strong><span>{t(flag.severity)}</span></div><p>{flag.explanation}</p>{flag.evidence && <blockquote>{flag.evidence}</blockquote>}{flag.evidence_ids?.length > 0 && <small className="policy-evidence-ids">{t("Source")} {flag.evidence_ids.join(" · ")}</small>}</article>)}</div></section>}
          <section className="policy-summary-section"><h3>{t("Data practices")}</h3><div className="policy-data-grid"><SummaryList title={t("Collected")} items={activeDocument.summary.data_practices?.collected} /><SummaryList title={t("Shared with")} items={activeDocument.summary.data_practices?.shared_with} /><SummaryList title={t("Purposes")} items={activeDocument.summary.data_practices?.purposes} /></div><p className="policy-retention"><strong>{t("Retention:")}</strong> {activeDocument.summary.data_practices?.retention}</p></section>
          <SummaryList title={t("User rights")} items={activeDocument.summary.user_rights} /><SummaryList title={t("Financial and cancellation terms")} items={activeDocument.summary.financial_terms} /><SummaryList title={t("Recommended actions")} items={activeDocument.summary.recommended_actions} />
          <p className="policy-ai-model">{activeDocument.summary?._meta?.model || "NVIDIA NIM"}{Number.isFinite(activeDocument.summary?.confidence) ? ` · ${Math.round(activeDocument.summary.confidence * 100)}% ${t("confidence")}` : ""}{activeDocument.summary?._meta?.escalated ? ` · ${t("reasoning verified")}` : ""}{activeDocument.summary?._meta?.cache_hit ? ` · ${t("cached analysis")}` : ""}</p>
        </div> : <p className="policy-library-hint">{t("The text is extracted, but an AI summary has not been generated yet.")}</p>}
        <details className="policy-extracted-details"><summary>{t("View extracted source text")}</summary><pre className="policy-document-text">{activeDocument.extracted_text}</pre></details>
      </div>
    </div>
  );

  if (view === "compare") return <div className="policy-library"><button className="policy-compare-back" onClick={() => setView("library")}>← {t("Back to Library")}</button><div className="policy-compare-columns">{selectedPolicies.map((policy) => <div key={policy.id} className="policy-compare-card"><div className="policy-compare-card-title">{policy.company} <span className="policy-card-version">{policy.version}</span></div><span className="policy-compare-card-date">{t("Scanned")} {formatDate(policy.sortDate)}</span><p className="policy-compare-card-summary">{t(policy.summary)}</p></div>)}</div></div>;

  return (
    <div className="policy-library">
      <h1 className="policy-library-title">{t("Policy Library")}</h1><p className="policy-library-subtitle">{t("Your uploaded policies are processed privately and prepared for plain-language summaries.")}</p>
      {user && <section className="policy-uploaded-section"><div className="policy-section-heading"><h2>{t("Your uploads")}</h2><span>{documents.length}</span></div>{documentsError && <p className="policy-library-error" role="alert">{documentsError}</p>}{documentsLoading ? <p className="policy-library-hint">{t("Loading your policies…")}</p> : documents.length === 0 ? <div className="policy-upload-empty"><FileText size={22} /><span>{t("No uploaded policies yet.")}</span></div> : <div className="policy-grid policy-upload-grid">{documents.map((document) => <article key={document.id} className={`policy-card policy-upload-card ${document.status === "ready" ? "is-openable" : ""}`} onClick={() => openDocument(document)}><div className="policy-card-top"><span className="policy-card-company" title={document.original_name}>{document.original_name}</span><span className={`policy-document-status ${document.status}`}>{document.status === "ready" ? t("Ready") : t(document.status)}</span></div><span className="policy-card-meta">{t("Uploaded")} {formatDate(document.created_at)}</span><p className="policy-card-summary">{statusDescription(document, t)}</p><div className="policy-document-actions">{document.status === "ready" && <><span className="policy-card-select">{t("View summary")}</span><button type="button" onClick={(event) => { event.stopPropagation(); retryDocument(document.id); }}><RefreshCw size={14} /> {t("Regenerate")}</button></>}{document.status === "failed" && <button type="button" onClick={(event) => { event.stopPropagation(); retryDocument(document.id); }}><RefreshCw size={14} /> {t("Retry")}</button>}<button type="button" className="danger" onClick={(event) => { event.stopPropagation(); deleteDocument(document.id); }}><Trash2 size={14} /> {t("Delete")}</button></div></article>)}</div>}</section>}
      <div className="policy-section-heading policy-featured-heading"><h2>{t("Featured policies")}</h2></div>
      <div className="policy-library-controls"><div className="policy-search-wrap"><Search size={16} color="var(--color-mute)" /><input type="text" className="policy-search" placeholder={t("Search companies…")} value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} /></div><div className="policy-filters">{filters.map((filter) => <button key={filter.id} className={`policy-filter-button ${activeFilter === filter.id ? "active" : ""}`} onClick={() => setActiveFilter(filter.id)}>{filter.label}</button>)}</div></div>
      <p className="policy-library-hint">{t("Select two or more featured policies to compare.")}</p>
      <div className="policy-grid">{visible.map((policy) => { const isSelected = selectedIds.includes(policy.id); return <div key={policy.id} className={`policy-card ${isSelected ? "selected" : ""}`} onClick={() => toggleSelect(policy.id)}><div className="policy-card-top"><span className="policy-card-company">{policy.company}</span><span className="policy-card-version">{policy.version}</span></div><span className="policy-card-meta">{t("Scanned")} {formatDate(policy.sortDate)} <span className="dot">·</span> {t(policy.category === "social" ? "Social" : policy.category === "ai" ? "AI" : "Workspace")}</span><p className="policy-card-summary">{t(policy.summary)}</p><span className="policy-card-select">{t(isSelected ? "Selected ✓" : "Select policy")}</span></div>; })}</div>
      {selectedIds.length > 0 && <button className={`policy-compare-fab ${canCompare ? "enabled" : "disabled"}`} disabled={!canCompare} onClick={() => canCompare && setView("compare")}>{t("Compare")}{selectedIds.length > 1 ? ` (${selectedIds.length})` : ""}</button>}
    </div>
  );
}
export default PolicyLibrary;