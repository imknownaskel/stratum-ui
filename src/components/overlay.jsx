import { useI18n } from "../i18n/context";
import "./overlay.css";
function Overlay({ x, y, onSummarizeClick }) { const { t } = useI18n(); return <div className="overlay" style={{ top: y, left: x }}><button className="overlay-button" onClick={onSummarizeClick}>{t("Summarize with Stratum")}</button></div>; }
export default Overlay;