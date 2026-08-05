import { Layout } from "../components/Layout";
import { SiteLink } from "../components/SiteLink";
import { asset } from "../lib";

const pillars = [
  ["Medical clarity", "A physician reviews health history, current medications, labs, weight history, and risk factors before recommending a care path."],
  ["Practical nutrition", "A registered dietitian builds food and behavior strategies around your culture, schedule, appetite, and clinical goals."],
  ["Responsive follow-up", "Progress, symptoms, barriers, and treatment response guide the next adjustment instead of a rigid template."],
];

export function MedicalWeightLossPage() {
  return <Layout><main className="service-page">
    <section className="service-hero service-hero-weight"><img src={asset("generated/weight-management-care.png")} alt="Personal medical weight-loss consultation" /><div><p className="eyebrow">Medical Weight Loss</p><h1>More than a diet. More personal than a prescription alone.</h1><p>NutriAll brings obesity medicine and one-to-one nutrition care into a coordinated plan for sustainable fat loss and better metabolic health.</p><div className="hero-actions"><SiteLink className="button button-primary" to="/book">Start your care path</SiteLink><SiteLink className="button button-secondary" to="/medical-director">Meet the Medical Director</SiteLink></div></div></section>
    <section className="service-intro"><p className="eyebrow">Built for the whole picture</p><h2>Weight is influenced by biology, health history, medications, food access, stress, sleep, and daily life.</h2><p>Our job is to understand those factors, identify what can change, and build a treatment plan you can actually use.</p></section>
    <section className="service-feature-grid">{pillars.map(([title, text], index) => <article key={title}><span>0{index + 1}</span><h2>{title}</h2><p>{text}</p></article>)}</section>
    <section className="split-story split-story-dark"><div><p className="eyebrow">Your clinical starting point</p><h2>Is medical weight care a fit?</h2><p>It may be useful if repeated diet attempts have not held, weight is affecting metabolic health, appetite feels difficult to regulate, or you want a physician to evaluate treatment options.</p><p>Medication is not automatic. When it is considered, Dr. Katz evaluates expected benefits, contraindications, interactions, and follow-up needs.</p></div><div className="service-list"><h3>Care may include</h3><ul><li>Medical and weight-history review</li><li>Lab and medication context</li><li>Personalized nutrition assessment</li><li>GLP-1 or other treatment discussion</li><li>Ongoing physician and dietitian follow-up</li></ul></div></section>
    <section className="weight-process compact-process"><div className="weight-section-heading"><p className="eyebrow">The care journey</p><h2>Evaluation first. Treatment second. Follow-up throughout.</h2></div><div className="weight-step-grid"><article><span>01</span><h3>Choose your starting point</h3><p>Share your goals, location, and whether you want medical or nutrition care.</p></article><article><span>02</span><h3>Complete an evaluation</h3><p>Meet the appropriate clinician to review your history, needs, and options.</p></article><article><span>03</span><h3>Begin your plan</h3><p>Start with clear medical, nutrition, movement, and monitoring priorities.</p></article><article><span>04</span><h3>Review and adjust</h3><p>Use real progress and tolerability to guide changes over time.</p></article></div></section>
    <section className="medical-note"><strong>Important:</strong><p>Prescription treatment is offered only when clinically appropriate. Individual results vary, and no medication or amount of weight loss is guaranteed.</p></section>
    <section className="weight-final-cta"><p className="eyebrow">Start with clarity</p><h2>Let us match you to the right first visit.</h2><SiteLink className="button button-primary" to="/book">Get started</SiteLink></section>
  </main></Layout>;
}
