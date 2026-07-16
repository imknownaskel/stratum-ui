import "./ResultCard.css";

function ResultCard({ status, summary, flags, onClose }) {
  return (
    <div className="result-card">
      <div className="result-card-header">
        <div className="result-card-header-left">
          <span className="result-card-badge">✨</span>
          <span className="result-card-title">Stratum Summary</span>
        </div>
        <button className="result-card-close" onClick={onClose}>
          ×
        </button>
      </div>

      {status === "loading" && (
        <div className="result-card-loading">Summarizing...</div>
      )}

      {status === "error" && (
        <div className="result-card-error">
          Something went wrong. Please try again.
        </div>
      )}

      {status === "success" && (
        <div className="result-card-body">
          <div className="result-card-summary-block">
            <p className="result-card-summary">{summary}</p>
          </div>

          {flags && flags.length > 0 && (
            <div className="result-card-flags">
              {flags.map((flag, i) => {
                const level = flag.level || "high";
                return (
                  <div key={i} className={`result-card-flag ${level}`}>
                    <span className="result-card-flag-icon">
                      {level === "high" ? "⚠" : level === "moderate" ? "!" : "✓"}
                    </span>
                    {flag.label || flag}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default ResultCard;