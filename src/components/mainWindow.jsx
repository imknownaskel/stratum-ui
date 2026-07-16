import "./MainWindow.css";

function MainWindow({ history }) {
  return (
    <div className="main-window">
      <header className="main-window-header">
        <h1 className="main-window-title">Stratum</h1>
        <p className="main-window-subtitle">
          Plain-language summaries for policies & terms
        </p>
      </header>

      <section className="main-window-section">
        <h2 className="main-window-section-title">Recent Summaries</h2>

        {(!history || history.length === 0) && (
          <p className="main-window-empty">
            No summaries yet. Highlight any policy text to get started.
          </p>
        )}

        {history && history.length > 0 && (
          <ul className="main-window-history-list">
            {history.map((item, i) => (
              <li key={i} className="main-window-history-item">
                <p className="main-window-history-summary">{item.summary}</p>
                <span className="main-window-history-date">{item.date}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

export default MainWindow;