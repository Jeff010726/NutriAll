import { Layout } from "../components/Layout";
import { SiteLink } from "../components/SiteLink";
import { asset } from "../lib";

const topics = [
  ["Injection technique", "Prepare the pen, rotate injection sites, follow storage directions, and dispose of sharps safely."],
  ["Oral medication routine", "Understand timing, missed-dose instructions, and the pharmacy directions that apply to your prescription."],
  ["Food and hydration", "Plan protein, fluids, meal pacing, and portions as appetite changes or doses increase."],
  ["Dose conversations", "Track symptoms and progress, know when to contact the prescriber, and prepare useful questions for follow-up."],
];

export function Glp1CarePage() {
  return <Layout><main className="service-page glp-page">
    <section className="service-hero service-hero-glp"><img src={asset("generated/glp1-training.webp")} alt="Clinician demonstrating a GLP-1 injection pen" /><div><p className="eyebrow">GLP-1 medication + nutrition support</p><h1>Know what to do before, during, and between doses.</h1><p>Starting semaglutide, tirzepatide, liraglutide, or another GLP-1 therapy can raise practical questions. NutriAll connects medical oversight with everyday nutrition and side-effect planning.</p><SiteLink className="button button-primary" to="/book">Explore GLP-1 care</SiteLink></div></section>
    <section className="service-intro"><p className="eyebrow">Support around the medication</p><h2>A prescription is only one part of treatment.</h2><p>Your physician manages clinical suitability and prescribing. Your registered dietitian helps translate appetite changes and treatment goals into meals, hydration, protein, fiber, and routines you can sustain.</p></section>
    <section className="topic-grid">{topics.map(([title, text], index) => <article key={title}><span>0{index + 1}</span><h2>{title}</h2><p>{text}</p></article>)}</section>
    <section className="glp-symptom-band"><div><p className="eyebrow">Side-effect planning</p><h2>Respond early, not after symptoms derail the plan.</h2><p>We can help you prepare for nausea, fullness, appetite changes, vomiting, diarrhea, constipation, gas, and abdominal discomfort. We also discuss low-blood-sugar risk when GLP-1 therapy is combined with insulin or certain diabetes medications.</p></div><div><h3>Know when to escalate</h3><p>Severe or persistent symptoms, dehydration, intense abdominal pain, signs of an allergic reaction, or other urgent concerns need prompt medical evaluation. Nutrition coaching does not replace emergency or prescribing care.</p></div></section>
    <section className="role-clarity"><div><span>Medical Director</span><h2>Evaluates and prescribes</h2><p>Reviews history, contraindications, interactions, response, and whether medication is clinically appropriate.</p></div><div><span>Registered Dietitian</span><h2>Builds the daily plan</h2><p>Supports eating patterns, protein, hydration, fiber, symptom-aware meals, and sustainable weight habits.</p></div></section>
    <section className="medical-note"><strong>Medication note:</strong><p>GLP-1 medications require an individualized clinical evaluation. Prescription, product choice, availability, and insurance coverage are not guaranteed.</p></section>
    <section className="weight-final-cta"><p className="eyebrow">Considering or already taking a GLP-1?</p><h2>Build the support plan around it.</h2><SiteLink className="button button-primary" to="/book">Choose a GLP-1 starting point</SiteLink></section>
  </main></Layout>;
}
