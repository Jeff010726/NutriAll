import { useState } from "react";
import { Layout } from "../components/Layout";
import { SiteLink } from "../components/SiteLink";

const steps = [
  { eyebrow: "Step 01", title: "What kind of care are you looking for?", key: "goal", options: ["Medical weight-loss evaluation", "I am already using a GLP-1 medication", "1:1 nutrition and fat-loss coaching", "Diabetes nutrition care", "Help me decide"] },
  { eyebrow: "Step 02", title: "Where are you located?", key: "location", options: ["New York", "Pennsylvania", "Another state"] },
  { eyebrow: "Step 03", title: "What should we help clarify?", key: "access", options: ["Medical treatment options", "Nutrition counseling", "Insurance and expected cost", "I am not sure yet"] },
  { eyebrow: "Step 04", title: "Do you have a language preference?", key: "language", options: ["English", "Mandarin", "Cantonese", "Spanish", "No preference"] },
  { eyebrow: "Step 05", title: "Choose the next step that works for you.", key: "next", options: ["Book a medical visit", "Request a nutrition match", "Talk with care navigation"] },
];

export function BookPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const complete = currentStep === steps.length;
  const selectOption = (key, value) => setAnswers((current) => ({ ...current, [key]: value }));

  return <Layout footerProps={{ note: "Care options, professional fees, insurance benefits, and medication coverage are confirmed separately before treatment begins." }}><main className="booking-flow-page">
    <section className="page-full-hero booking-full-hero"><div><p className="eyebrow">Start care</p><h1>Find the right first conversation.</h1><p>Answer a few non-clinical questions to identify whether your next step should be a medical evaluation, registered dietitian visit, or care-navigation conversation.</p></div><aside className="hero-proof-panel"><span>One coordinated entry point</span><strong>Medical weight care, GLP-1 support, and 1:1 nutrition.</strong><small>Medical visits are currently available virtually to eligible patients located in New York and Pennsylvania.</small></aside></section>
    <section className="booking-flow-section">
      <aside className="booking-flow-copy"><p className="eyebrow">How this works</p><h2>Five quick choices. No health details needed here.</h2><div className="booking-flow-points"><p><strong>01</strong> Choose a care goal.</p><p><strong>02</strong> Confirm your location.</p><p><strong>03</strong> Identify what needs clarification.</p><p><strong>04</strong> Share a language preference.</p><p><strong>05</strong> Continue to an appropriate scheduling path.</p></div></aside>
      <form className="booking-shell booking-shell-wide" onSubmit={(event) => { event.preventDefault(); setCurrentStep(steps.length); }}>
        <div className="booking-progress"><span style={{ width: `${(Math.min(currentStep + 1, steps.length) / steps.length) * 100}%` }}></span></div>
        {steps.map((step, index) => <section className={`booking-step${currentStep === index ? " is-active" : ""}`} key={step.key}><p className="eyebrow">{step.eyebrow}</p><h2>{step.title}</h2><div className="booking-options">{step.options.map((option) => <button className={`option-card${answers[step.key] === option ? " is-selected" : ""}`} type="button" key={option} onClick={() => selectOption(step.key, option)}>{option}</button>)}</div><div className="booking-actions">{index > 0 && <button className="button button-secondary" type="button" onClick={() => setCurrentStep(index - 1)}>Back</button>}{index < 4 ? <button className="button button-primary" type="button" disabled={!answers[step.key]} onClick={() => setCurrentStep(index + 1)}>Continue</button> : <button className="button button-primary" type="submit" disabled={!answers[step.key]}>See next steps</button>}</div></section>)}
        <section className={`booking-step booking-complete${complete ? " is-active" : ""}`}><p className="eyebrow">Your next step</p><h2>Choose a secure scheduling path.</h2><p>This website does not collect or transmit health information. Use the medical scheduler for a physician visit, or contact NutriAll through your established secure intake channel for nutrition matching.</p><div className="booking-result-actions"><a className="button button-primary" href="https://www.zocdoc.com/practice/dr-leon-katz-medical-weight-loss-center-116140?lock=true&isNewPatient=false&referrerType=widget" target="_blank" rel="noreferrer">Book medical visit</a><SiteLink className="button button-secondary" to="/about">Review nutrition care</SiteLink></div></section>
      </form>
    </section>
    <section className="booking-info-band"><div><p className="eyebrow">Before you book</p><h2>Different parts of care can have different costs.</h2><p>A physician visit, a registered dietitian visit, laboratory work, and a prescription are separate services. Coverage and out-of-pocket cost should be verified for each.</p></div><div className="booking-mini-grid"><article><span>MD</span><strong>Medical evaluation</strong><small>Eligibility depends on state and clinical fit.</small></article><article><span>RD</span><strong>Nutrition care</strong><small>Benefits vary by plan and diagnosis.</small></article><article><span>Rx</span><strong>Medication</strong><small>Formulary and authorization rules apply.</small></article><article><span>?</span><strong>Not sure</strong><small>Use care navigation to choose a path.</small></article></div></section>
    <section className="booking-note-section"><p>Do not submit urgent symptoms through a website form. Call emergency services for a medical emergency or contact your clinician promptly for serious treatment concerns.</p></section>
  </main></Layout>;
}
