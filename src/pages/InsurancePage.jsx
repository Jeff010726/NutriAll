import { Layout } from "../components/Layout";
import { SiteLink } from "../components/SiteLink";

const coverage = [
  ["01", "Medical visits", "Physician coverage depends on the clinician's network status, your location, plan rules, deductible, copay, and any referral requirements."],
  ["02", "Nutrition counseling", "Registered dietitian benefits can vary by diagnosis, visit limit, network, referral rules, and whether preventive nutrition care is included."],
  ["03", "Medication", "Prescription coverage is separate from visit coverage. Formularies, prior authorization, shortages, and pharmacy rules may affect access and price."],
];

export function InsurancePage() {
  return <Layout footerProps={{ note: "Coverage and expected cost are verified separately for medical visits, nutrition counseling, testing, and medication." }}><main className="insurance-page">
    <section className="page-full-hero insurance-full-hero"><div><p className="eyebrow">Cost & insurance</p><h1>Understand the cost before care begins.</h1><p>Medical weight care can include several separate services. We avoid one-price-fits-all claims and help you identify which benefits need to be checked.</p></div></section>
    <section className="service-intro"><p className="eyebrow">Three separate questions</p><h2>Visit coverage does not automatically mean medication coverage.</h2><p>Ask about each part of your plan individually so the estimate reflects how you will actually receive care.</p></section>
    <section className="about-grid full-about-grid insurance-card-grid">{coverage.map(([number, title, text]) => <article key={number}><span>{number}</span><h2>{title}</h2><p>{text}</p></article>)}</section>
    <section className="insurance-checklist"><div><p className="eyebrow">Useful questions</p><h2>What to confirm with your plan</h2></div><ul><li>Is the physician or dietitian in network?</li><li>Is a referral or prior authorization required?</li><li>What deductible, copay, or coinsurance applies?</li><li>Are telehealth visits covered in your location?</li><li>Which anti-obesity medications are on the formulary?</li><li>Are labs billed separately?</li></ul></section>
    <section className="info-band"><h2>Need help choosing a starting point?</h2><p>Use the care-path flow to identify the appropriate service before verifying benefits.</p><SiteLink className="button button-primary" to="/book">Start care</SiteLink></section>
  </main></Layout>;
}
