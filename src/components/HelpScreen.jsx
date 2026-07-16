import { useState } from "react";
import "./HelpScreen.css";

const faqs = [
  {
    q: "How does Stratum summarize a policy?",
    a: "Highlight any policy or terms & conditions text — on a website or in another app — and select \"Summarize with Stratum\" to get a plain-language summary instantly.",
  },
  {
    q: "Does Stratum work outside the app?",
    a: "Yes. Once installed, Stratum works on highlighted text anywhere on your computer, not just inside the Stratum app itself.",
  },
  {
    q: "What do the colored flags mean?",
    a: "Red flags highlight high-risk clauses like auto-renewals or arbitration. Amber flags are worth noting but lower risk. Teal flags confirm something safe or reassuring.",
  },
  {
    q: "Can I compare two policies?",
    a: "Yes — open Policy Library, select two or more saved policies, then click Compare to see them side by side.",
  },
  {
    q: "How do I delete my account?",
    a: "Go to Dashboard and select Delete Account. You'll be asked to confirm before anything is permanently removed.",
  },
];

function HelpScreen() {
  const [openIndex, setOpenIndex] = useState(null);

  return (
    <div className="help-screen">
      <h1 className="help-title">Help & Support</h1>
      <p className="help-subtitle">
        Find answers to common questions, or reach out if you need more help.
      </p>

      <div className="help-faq-list">
        {faqs.map((item, i) => (
          <div key={i} className="help-faq-item">
            <button
              className="help-faq-question"
              onClick={() => setOpenIndex(openIndex === i ? null : i)}
            >
              {item.q}
              <span className={`help-faq-icon ${openIndex === i ? "open" : ""}`}>
                ⌄
              </span>
            </button>
            {openIndex === i && (
              <p className="help-faq-answer">{item.a}</p>
            )}
          </div>
        ))}
      </div>

      <div className="help-contact-card">
        <h2 className="help-contact-title">Still need help?</h2>
        <p className="help-contact-description">
          Reach out to our support team and we'll get back to you shortly.
        </p>
        <button
          className="help-contact-button"
          onClick={() => alert("Contact support flow not built yet")}
        >
          Contact Support
        </button>
      </div>
    </div>
  );
}

export default HelpScreen;