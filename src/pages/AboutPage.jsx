import { Layout } from "../components/Layout";
import { DietitianCard } from "../components/DietitianCard";
import { SiteLink } from "../components/SiteLink";
import { asset } from "../lib";
import { dietitians } from "../teamData";

const values = [
  ["01", "Medical accountability", "Weight-loss treatment decisions are grounded in medical history, risk review, and appropriate physician follow-up."],
  ["02", "Nutrition that travels", "Registered dietitians build plans around culture, family meals, schedules, access, and the situations that make consistency hard."],
  ["03", "Care without shame", "Progress and setbacks are treated as information. The plan changes with the person instead of blaming the person."],
];

export function AboutPage() {
  return <Layout footerProps={{ note: "NutriAll combines physician-led medical weight care with registered dietitian nutrition support." }}><main className="about-page">
    <section className="about-hero about-full-hero"><div><p className="eyebrow">About NutriAll</p><h1>Medical weight care with nutrition at its center.</h1><p>NutriAll connects a Medical Director and registered dietitians so clinical decisions, food strategy, and ongoing behavior support can work as one plan.</p></div><img src={asset("nutriall-team.jpg")} alt="Three NutriAll dietitians together" /></section>
    <section className="about-grid full-about-grid">{values.map(([number, title, text]) => <article key={number}><span>{number}</span><h2>{title}</h2><p>{text}</p></article>)}</section>
    <section className="role-clarity"><div><span>Medical care</span><h2>Physician scope</h2><p>Clinical evaluation, risk review, prescribing when appropriate, medication monitoring, and medical follow-up.</p></div><div><span>Nutrition care</span><h2>Dietitian scope</h2><p>Nutrition assessment, meal strategy, behavior support, symptom-aware eating, and sustainable follow-through.</p></div></section>
    <section className="dietitian-team-section all-dietitians" aria-labelledby="dietitian-team-title">
      <div className="dietitian-team-heading"><p className="eyebrow">Our dietitians</p><h2 id="dietitian-team-title">Meet the team behind your care.</h2><p>Our dietitian team brings complementary experience across weight management, diabetes, intuitive eating, digestive health, eating disorders, sports nutrition, oncology, and culturally responsive care. Your clinician is matched to your needs and availability.</p></div>
      <div className="dietitian-profile-grid">{dietitians.map((dietitian) => <DietitianCard key={dietitian.name} dietitian={dietitian} />)}</div>
    </section>
    <section className="medical-director-note"><img src={asset("team/dr-leon-katz.jpg")} alt="Dr. Leon Katz" /><div><p className="eyebrow">Medical oversight</p><h2>Supported by an obesity medicine Medical Director.</h2><p>Dr. Leon Katz provides medical leadership for clinical evaluation, prescribing when appropriate, and treatment monitoring. NutriAll&apos;s identity and day-to-day support remain centered on its registered dietitian team.</p><SiteLink to="/medical-director">Meet Dr. Katz <span aria-hidden="true">-&gt;</span></SiteLink></div></section>
    <section className="weight-final-cta"><p className="eyebrow">One team, a clearer plan</p><h2>Start with the care you need.</h2><SiteLink className="button button-primary" to="/book">Get started</SiteLink></section>
  </main></Layout>;
}
