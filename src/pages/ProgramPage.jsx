import { Layout } from "../components/Layout";
import { SiteLink } from "../components/SiteLink";
import { asset } from "../lib";

export function ProgramPage() {
  return <Layout><main className="program-page">
    <section className="page-full-hero program-full-hero"><div><p className="eyebrow">Diabetes Care</p><h1>A focused diabetes nutrition program that adapts to the person.</h1><p>Diabetes care remains a dedicated NutriAll specialty. From assessment to follow-up, the goal is to make blood sugar decisions clearer without flattening your culture, schedule, or preferences.</p></div></section>
    <section className="program-overview-band"><div><p className="eyebrow">What we work on</p><h2>Food, glucose patterns, medication context, and habits are treated as one connected system.</h2></div><p>Instead of giving a generic diet sheet, the program helps clients understand what is happening in daily life: what meals do, what readings mean, what can be repeated, and where insurance or follow-up support fits.</p></section>
    <section className="program-feature-grid">
      <article id="meal-planning" className="program-feature-card program-feature-wide"><img src={asset("mosaic/meal-planning.jpg")} alt="" /><div><p className="tag">Food planning</p><h2>Meals that match culture, schedule, and blood sugar goals.</h2><p>Build repeatable meals around familiar foods, protein, fiber, portions, and prep routines that fit real weeks.</p></div></article>
      <article id="monitoring" className="program-feature-card"><img src={asset("mosaic/blood-sugar-patterns.jpg")} alt="" /><div><p className="tag">Glucose patterns</p><h2>Understand readings.</h2><p>Use glucose numbers as feedback for meals and habits, not as judgment.</p></div></article>
      <article id="carb-management" className="program-feature-card"><img src={asset("mosaic/carb-confidence.jpg")} alt="" /><div><p className="tag">Carb confidence</p><h2>Learn portions and pairings.</h2><p>Understand carbohydrate type, amount, timing, and meal balance.</p></div></article>
      <article id="heart-health" className="program-feature-card program-feature-dark"><p className="tag">Long-term health</p><h2>Support cholesterol, blood pressure, and cardiovascular risk.</h2><p>Diabetes nutrition care is also heart-health care.</p></article>
      <article id="assessment" className="program-feature-card"><img src={asset("mosaic/dietitian-support.jpg")} alt="" /><div><p className="tag">Dietitian support</p><h2>Personalized assessment.</h2><p>Review food habits, labs, medications, goals, barriers, and preferences.</p></div></article>
    </section>
    <section className="info-band"><h2>Ready to start?</h2><p>Request a free call so the team can confirm fit, insurance questions, and next steps.</p><SiteLink className="button button-primary" to="/book?service=diabetes">Book a free consultation</SiteLink></section>
  </main></Layout>;
}
