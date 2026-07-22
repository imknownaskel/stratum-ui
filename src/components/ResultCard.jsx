import { useI18n } from "../i18n/context";
import "./ResultCard.css";
function ResultCard({ status, summary, flags, onClose }) { const { t } = useI18n(); return (
  <div className="result-card"><div className="result-card-header"><div className="result-card-header-left"><span className="result-card-badge">✨</span><span className="result-card-title">{t("Stratum Summary")}</span></div><button className="result-card-close" onClick={onClose}>×</button></div>
  {status === "loading" && <div className="result-card-loading">{t("Summarizing…")}</div>}
  {status === "error" && <div className="result-card-error">{t("Something went wrong. Please try again.")}</div>}
  {status === "success" && <div className="result-card-body"><div className="result-card-summary-block"><p className="result-card-summary">{summary}</p></div>{flags?.length > 0 && <div className="result-card-flags">{flags.map((flag, index) => { const level = flag.level || "high"; return <div key={index} className={`result-card-flag ${level}`}><span className="result-card-flag-icon">{level === "high" ? "⚠" : level === "moderate" ? "!" : "✓"}</span>{flag.label || flag}</div>; })}</div>}</div>}
  </div>
); }
export default ResultCard;