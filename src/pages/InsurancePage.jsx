import { Layout } from "../components/Layout";
import { SiteLink } from "../components/SiteLink";

const steps = [["01", "Check benefits", "Submit your basic information and the team can review nutrition counseling coverage."], ["02", "Confirm fit", "A coordinator confirms estimated cost before your first dietitian appointment."], ["03", "Start care", "Begin diabetes nutrition sessions with a plan built around your health goals."]];

export function InsurancePage() {
  return <Layout footerProps={{ note: "Coverage varies by plan, diagnosis, referral requirements, deductible, and network status." }}><main className="insurance-page">
    <section className="page-full-hero insurance-full-hero"><div><p className="eyebrow">Insurance</p><h1>Make diabetes nutrition care easier to access.</h1><p>Many clients may pay $0 when nutrition counseling is covered by eligible insurance benefits. Final cost depends on plan details and benefit verification.</p></div></section>
    <section className="about-grid full-about-grid">{steps.map(([number, title, text]) => <article key={number}><span>{number}</span><h2>{title}</h2><p>{text}</p></article>)}</section>
    <section className="info-band"><h2>Need a cost estimate?</h2><p>Use the booking flow and choose insurance benefits as your payment path.</p><SiteLink className="button button-primary" to="/book">Check benefits</SiteLink></section>
  </main></Layout>;
}
