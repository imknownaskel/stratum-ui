import { useRef } from "react";
import { useI18n } from "../i18n/context";
import Overlay from "./overlay";
import ResultCard from "./ResultCard";
import "./DemoScreen.css";

function DemoScreen({ showOverlay, overlayPos, setShowOverlay, setOverlayPos, cardStatus, setCardStatus, handleSummarizeClick }) {
  const { t } = useI18n();
  const containerRef = useRef(null);
  const handleMouseUp = () => {
    const selection = window.getSelection(); const text = selection.toString().trim();
    if (!text) { setShowOverlay(false); return; }
    const rect = selection.getRangeAt(0).getBoundingClientRect(); const containerRect = containerRef.current.getBoundingClientRect();
    setOverlayPos({ x: rect.left - containerRect.left + rect.width / 2 - 90, y: rect.top - containerRect.top - 44 }); setShowOverlay(true);
  };
  const policy = t("By using this service, you agree that we may collect, store, and share your usage data with third-party advertising partners. This agreement includes a binding arbitration clause, meaning you waive your right to a jury trial or to join a class-action lawsuit. Your subscription will automatically renew at the end of each billing cycle unless canceled at least 48 hours in advance. We reserve the right to update these terms at any time without direct notice.");
  return (
    <div className="demo-screen" ref={containerRef}>
      <h1 className="demo-title">{t("Try it out")}</h1><p className="demo-hint">{t("Highlight any part of the sample policy below to see Stratum in action.")}</p>
      <div className="demo-policy-card" onMouseUp={handleMouseUp}><span className="demo-policy-source">{t("StreamHub — Terms of Service")}</span><p className="demo-policy-text">{policy}</p></div>
      {showOverlay && <div style={{ position: "absolute", top: overlayPos.y, left: overlayPos.x }}><Overlay x={0} y={0} onSummarizeClick={handleSummarizeClick} /></div>}
      {cardStatus && <div style={{ position: "absolute", top: overlayPos.y + 50, left: overlayPos.x }}><ResultCard status={cardStatus} summary={t("This service can share your data with advertisers, and you are giving up your right to a jury trial or class action.")} flags={[{ label: t("Auto-renewal clause detected"), level: "high" }, { label: t("Arbitration clause detected"), level: "high" }, { label: t("Data shared with advertising partners"), level: "moderate" }]} onClose={() => setCardStatus(null)} /></div>}
    </div>
  );
}
export default DemoScreen;