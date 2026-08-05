import { Layout } from "../components/Layout";
import { SiteLink } from "../components/SiteLink";
import { asset } from "../lib";

export function MedicalDirectorPage() {
  return <Layout><main className="director-page">
    <section className="director-hero"><div className="director-image"><img src={asset("team/dr-leon-katz.jpg")} alt="Dr. Leon Katz, Medical Director" /></div><div><p className="eyebrow">NutriAll Medical Director</p><h1>Leon Katz, MD</h1><p className="director-deck">Obesity medicine specialist with more than 20 years of experience helping people navigate medical weight management.</p><div className="director-credentials"><span>Diplomate, American Board of Obesity Medicine</span><span>Virtual medical care in New York and Pennsylvania</span></div><SiteLink className="button button-primary" to="/book">Start medical care</SiteLink></div></section>
    <section className="director-story"><div><p className="eyebrow">Clinical leadership</p><h2>Experienced oversight for decisions that deserve medical context.</h2></div><div><p>Dr. Katz has treated more than 5,000 patients and previously served as Medical Director of one of New York&apos;s largest medical weight-management programs.</p><p>At NutriAll, he leads the medical side of weight care: evaluating health history and risk, reviewing relevant labs and medications, determining whether prescription treatment is appropriate, and following response over time.</p></div></section>
    <section className="director-stats"><article><strong>20+</strong><span>years in medical weight management</span></article><article><strong>5,000+</strong><span>patients treated</span></article><article><strong>ABOM</strong><span>board-certified obesity medicine expertise</span></article></section>
    <section className="role-clarity director-role"><div><span>Before treatment</span><h2>Evaluate the whole picture</h2><p>Weight history, medical conditions, medication list, prior treatment, labs, goals, and potential contraindications.</p></div><div><span>During treatment</span><h2>Monitor and adjust</h2><p>Response, side effects, medication questions, clinical follow-up, and coordination with nutrition support.</p></div></section>
    <section className="director-source"><p>Learn more about Dr. Katz&apos;s background and independent medical practice at <a href="https://drkatzweightloss.com/" target="_blank" rel="noreferrer">drkatzweightloss.com</a>.</p></section>
    <section className="weight-final-cta"><p className="eyebrow">Medical care, connected to daily life</p><h2>Begin with the right evaluation.</h2><SiteLink className="button button-primary" to="/book">Get started</SiteLink></section>
  </main></Layout>;
}
