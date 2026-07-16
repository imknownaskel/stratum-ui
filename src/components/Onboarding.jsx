import { useState } from "react";
import "./Onboarding.css";

const steps = [
  {
    icon: "🖱️",
    title: "Highlight any text",
    description:
      "Works anywhere — a website, a PDF, an app you've downloaded. Not just inside Stratum.",
  },
  {
    icon: "💬",
    title: "Tap \u201CSummarize with Stratum\u201D",
    description:
      "It shows up right next to copy and cut, wherever you highlight.",
  },
  {
    icon: "✅",
    title: "Get a plain-language summary",
    description:
      "Instantly understand what you're agreeing to, with risky clauses flagged.",
  },
];

function Onboarding({ onFinish }) {
  const [step, setStep] = useState(0);
  const isLastStep = step === steps.length - 1;

  const handleNext = () => {
    if (isLastStep) {
      onFinish();
    } else {
      setStep(step + 1);
    }
  };

  return (
    <div className="onboarding-overlay">
      <div className="onboarding-card">
        <button className="onboarding-skip" onClick={onFinish}>
          Skip
        </button>

        <div className="onboarding-icon">{steps[step].icon}</div>
        <h2 className="onboarding-title">{steps[step].title}</h2>
        <p className="onboarding-description">{steps[step].description}</p>

        <div className="onboarding-dots">
          {steps.map((_, i) => (
            <span
              key={i}
              className={`onboarding-dot ${i === step ? "active" : ""}`}
            />
          ))}
        </div>

        <button className="onboarding-next" onClick={handleNext}>
          {isLastStep ? "Get Started" : "Next"}
        </button>
      </div>
    </div>
  );
}

export default Onboarding;