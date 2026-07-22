import { useState } from "react";
import { useI18n } from "../i18n/context";
import "./Onboarding.css";

function Onboarding({ onFinish }) {
  const { t } = useI18n();
  const [step, setStep] = useState(0);
  const steps = [
    { icon: "🖱️", title: t("Highlight any text"), description: t("Works anywhere — a website, a PDF, or another app. Not just inside Stratum.") },
    { icon: "💬", title: t("Tap “Summarize with Stratum”"), description: t("It appears next to copy and cut wherever you highlight text.") },
    { icon: "✅", title: t("Get a plain-language summary"), description: t("Quickly understand what you are agreeing to, with risky clauses flagged.") },
  ];
  const isLastStep = step === steps.length - 1;
  const handleNext = () => isLastStep ? onFinish() : setStep((current) => current + 1);
  return (
    <div className="onboarding-overlay">
      <div className="onboarding-card">
        <button className="onboarding-skip" onClick={onFinish}>{t("Skip")}</button>
        <div className="onboarding-icon">{steps[step].icon}</div>
        <h2 className="onboarding-title">{steps[step].title}</h2>
        <p className="onboarding-description">{steps[step].description}</p>
        <div className="onboarding-dots">{steps.map((_, index) => <span key={index} className={`onboarding-dot ${index === step ? "active" : ""}`} />)}</div>
        <button className="onboarding-next" onClick={handleNext}>{isLastStep ? t("Get Started") : t("Next")}</button>
      </div>
    </div>
  );
}
export default Onboarding;