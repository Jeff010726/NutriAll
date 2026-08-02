import { useState } from "react";
import { Layout } from "../components/Layout";
import { SiteLink } from "../components/SiteLink";

const steps = [
  { eyebrow: "Step 01", title: "What is your main goal?", key: "goal", options: ["Lower A1C with food habits", "Build a diabetes meal plan", "Understand glucose readings", "Prediabetes prevention", "Gestational diabetes support", "Not sure yet"] },
  { eyebrow: "Step 02", title: "How would you like to meet?", key: "format", options: ["Virtual visit", "In-person visit", "Free discovery call"] },
  { eyebrow: "Step 03", title: "How should we handle payment?", key: "payment", options: ["Check insurance benefits", "Self-pay", "Not sure yet"] },
  { eyebrow: "Step 04", title: "Any care preference?", key: "language", options: ["English", "Mandarin", "Cantonese", "Spanish", "No preference"] },
  { eyebrow: "Step 05", title: "Share contact details and a call window.", key: "window", options: ["Morning", "Afternoon", "Evening"] },
];

export function BookPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const complete = currentStep === steps.length;
  const selectOption = (key, value) => setAnswers((current) => ({ ...current, [key]: value }));

  return <Layout footerProps={{ note: "Start with a free call and confirm insurance or self-pay options before care begins." }}><main className="booking-flow-page">
    <section className="page-full-hero booking-full-hero"><div><p className="eyebrow">Book care</p><h1>Start with a free diabetes nutrition call.</h1><p>Tell us what kind of support you need. A coordinator can confirm insurance benefits and match you with a registered dietitian.</p></div><aside className="hero-proof-panel"><span>Insurance-aware start</span><strong>Many eligible clients pay $0 after benefits are verified.</strong><small>Coverage varies by plan, diagnosis, referral requirements, deductible, and network status.</small></aside></section>
    <section className="booking-flow-section">
      <aside className="booking-flow-copy"><p className="eyebrow">How booking works</p><h2>Five clear steps, then we confirm the next appointment.</h2><div className="booking-flow-points"><p><strong>01</strong> Choose your diabetes goal.</p><p><strong>02</strong> Choose your visit format.</p><p><strong>03</strong> Tell us whether to check insurance or show self-pay options.</p><p><strong>04</strong> Share language and care preferences.</p><p><strong>05</strong> Add contact details and a preferred call window.</p></div></aside>
      <form className="booking-shell booking-shell-wide" onSubmit={(event) => { event.preventDefault(); setCurrentStep(steps.length); }}>
        <div className="booking-progress"><span style={{ width: `${(Math.min(currentStep + 1, steps.length) / steps.length) * 100}%` }}></span></div>
        {steps.map((step, index) => <section className={`booking-step${currentStep === index ? " is-active" : ""}`} key={step.key}><p className="eyebrow">{step.eyebrow}</p><h2>{step.title}</h2><div className="booking-options">{step.options.map((option) => <button className={`option-card${answers[step.key] === option ? " is-selected" : ""}`} type="button" key={option} onClick={() => selectOption(step.key, option)}>{option}</button>)}</div>{index === 4 && <><label className="field-row">Full name<input type="text" name="name" placeholder="Your name" required /></label><label className="field-row">Email<input type="email" name="email" placeholder="you@example.com" required /></label><label className="field-row">Phone<input type="tel" name="phone" placeholder="(555) 000-0000" /></label><label className="field-row">Insurance carrier, if you want benefits checked<input type="text" name="insurance" placeholder="Aetna, UnitedHealthcare, Medicare..." /></label></>}<div className="booking-actions">{index > 0 && <button className="button button-secondary" type="button" onClick={() => setCurrentStep(index - 1)}>Back</button>}{index < 4 ? <button className="button button-primary" type="button" onClick={() => setCurrentStep(index + 1)}>Continue</button> : <button className="button button-primary" type="submit">Request call</button>}</div></section>)}
        <section className={`booking-step booking-complete${complete ? " is-active" : ""}`}><p className="eyebrow">Request received</p><h2>We will follow up to confirm your diabetes nutrition consult.</h2><p className="booking-note">This prototype stores nothing yet. Connect this form to your scheduling or CRM system before accepting live requests.</p><div className="booking-actions"><SiteLink className="button button-primary" to="/">Back home</SiteLink></div></section>
      </form>
    </section>
    <section className="booking-info-band"><div><p className="eyebrow">Recommended first step</p><h2>Free 15-minute discovery call</h2><p>Confirm your diabetes goal, insurance path, best-fit visit type, and next appointment before committing to ongoing care.</p></div><div className="booking-mini-grid"><article><span>$0</span><strong>Discovery call</strong><small>15 minutes to confirm fit.</small></article><article><span>$185</span><strong>Single consult</strong><small>One 60-minute self-pay visit.</small></article><article><span>$380</span><strong>3-visit package</strong><small>Assessment, plan, early follow-up.</small></article><article><span>$599</span><strong>6-visit package</strong><small>More consistency and accountability.</small></article></div></section>
    <section className="booking-note-section"><p>Many clients may pay $0 with eligible insurance benefits. Final cost depends on plan details, diagnosis, provider network, referral requirements, deductible, copay, and remaining benefits.</p></section>
  </main></Layout>;
}
