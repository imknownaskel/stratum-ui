import "./Overlay.css";

function Overlay({ x, y, onSummarizeClick }) {
  return (
    <div
      className="overlay"
      style={{ top: y, left: x }}
    >
      <button className="overlay-button" onClick={onSummarizeClick}>
        Summarize with Stratum
      </button>
    </div>
  );
}

export default Overlay;