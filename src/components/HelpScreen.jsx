import { useState } from "react";
import { useI18n } from "../i18n/context";
import "./HelpScreen.css";

function HelpScreen() {
  const { t } = useI18n();
  const [openIndex, setOpenIndex] = useState(null);
  const faqs = [
    ["How does Stratum summarize a policy?", "Upload a policy document and Stratum extracts the text, analyzes its clauses, and creates an evidence-linked plain-language summary."],
    ["Does Stratum work outside the app?", "The current web version handles uploaded policies and includes a selection demo. System-wide text selection is planned for a later desktop or browser integration."],
    ["What do the colored flags mean?", "Red flags indicate high-risk clauses. Amber flags highlight moderate concerns. Teal flags mark lower-risk or reassuring findings."],
    ["Can I compare two policies?", "Yes. Open Policy Library, select two or more featured policies, and choose Compare."],
    ["How do I change the app language?", "Open Settings and choose App and summary language. The interface changes immediately, and new or regenerated summaries use the same language."],
  ];
  return (
    <div className="help-screen">
      <h1 className="help-title">{t("Help & Support")}</h1>
      <p className="help-subtitle">{t("Find answers to common questions, or reach out if you need more help.")}</p>
      <div className="help-faq-list">{faqs.map(([question, answer], index) => <div key={question} className="help-faq-item">
        <button className="help-faq-question" onClick={() => setOpenIndex(openIndex === index ? null : index)}>{t(question)}<span className={`help-faq-icon ${openIndex === index ? "open" : ""}`}>⌄</span></button>
        {openIndex === index && <p className="help-faq-answer">{t(answer)}</p>}
      </div>)}</div>
      <div className="help-contact-card"><h2 className="help-contact-title">{t("Still need help?")}</h2><p className="help-contact-description">{t("Reach out to our support team and we will get back to you shortly.")}</p><button className="help-contact-button" onClick={() => alert(t("Contact support is not available yet."))}>{t("Contact Support")}</button></div>
    </div>
  );
}
export default HelpScreen;