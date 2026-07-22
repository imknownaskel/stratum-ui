import { useI18n } from "../i18n/context";
function StratumLogo({ size = 28, showText = true, textSize = 16, showTagline = false }) {
  const { t } = useI18n();
  return (
    <div style={{ display: "flex", alignItems: "center", gap: size * 0.4 }}>
      <div
        style={{
          width: size,
          height: size,
          borderRadius: size * 0.28,
          background: "#2F6FE4",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          boxShadow: "0 4px 14px rgba(47, 111, 228, 0.35)",
        }}
      >
        <svg width={size * 0.62} height={size * 0.62} viewBox="0 0 48 48" fill="none">
          <path d="M24 6 L42 18 L24 30 L6 18 Z" stroke="#FFFFFF" strokeWidth="3.2" strokeLinejoin="round" fill="none" />
          <path d="M8 24 L24 35 L40 24" stroke="#FFFFFF" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </svg>
      </div>

      {showText && (
        <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.15 }}>
          <span style={{ fontFamily: "var(--font-body)", fontSize: textSize, fontWeight: 700, color: "#16233F" }}>
            Stratum
          </span>
          {showTagline && (
            <span style={{ fontFamily: "var(--font-body)", fontSize: 9, fontWeight: 600, letterSpacing: "0.04em", maxWidth: 130, color: "#7C8B9C", textTransform: "uppercase" }}>
              {t("Compliance Intelligence")}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

export default StratumLogo;