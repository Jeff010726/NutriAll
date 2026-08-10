import { Layout } from "../components/Layout";
import { InsuranceLogos } from "../components/InsuranceLogos";
import { SiteLink } from "../components/SiteLink";
import { asset } from "../lib";
import { dietitians } from "../teamData";

const paths = [
  ["01", "1:1 Weight Loss", "A dedicated registered dietitian for fat loss, food strategy, and accountability, with insurance verification before care.", "/one-to-one-weight-loss", "Explore 1:1 care"],
  ["02", "GLP-1 Support", "Nutrition and medical support for people considering or already using GLP-1 medication.", "/glp1-care", "Explore GLP-1 support"],
  ["03", "Medical Weight Loss", "Clinical evaluation and physician oversight when medication or a medical treatment plan may be appropriate.", "/medical-weight-loss", "Explore medical care"],
  ["04", "Diabetes Care", "For people working on glucose, A1C, meal planning, and long-term cardiometabolic health.", "/diabetes-care", "Explore diabetes care"],
];

const steps = [
  ["01", "Tell us what you need", "Choose medical weight care, GLP-1 support, 1:1 nutrition, or ask us to help you decide."],
  ["02", "Meet the right clinician", "Your care begins with the physician or registered dietitian best suited to your goals."],
  ["03", "Build one connected plan", "Medical context, food strategy, activity, sleep, and follow-up become one practical roadmap."],
  ["04", "Adjust with real feedback", "Your team uses symptoms, progress, preferences, and clinical data to refine the plan."],
];

export function HomePage() {
  return <Layout><main className="weight-home">
    <section className="hero weight-hero" aria-labelledby="hero-title">
      <div className="hero-media" role="img" aria-label="A one-to-one medical weight care consultation"></div>
      <div className="hero-content">
        <p className="eyebrow">1:1 weight loss care + insurance support</p>
        <h1 id="hero-title">Lose weight with a plan made for your life.</h1>
        <p>Work one-to-one with a registered dietitian on sustainable fat loss, with GLP-1 nutrition support and Medical Director oversight available when needed. Many insurance plans may cover eligible visits.</p>
        <div className="hero-actions"><SiteLink className="button button-primary" to="/book?service=one-to-one">Book a free consultation</SiteLink><SiteLink className="button button-secondary" to="/insurance">Check insurance</SiteLink></div>
      </div>
    </section>

    <InsuranceLogos />

    <section className="weight-paths" aria-labelledby="paths-title">
      <div className="weight-section-heading"><p className="eyebrow">Choose your starting point</p><h2 id="paths-title">Weight care that meets you where you are.</h2><p>Start with one-to-one nutrition, build support around a GLP-1 medication, or request a medical evaluation. One short consultation helps us route you correctly.</p></div>
      <div className="weight-path-grid">{paths.map(([number, title, text, to, label]) => <article className="weight-path-card" key={title}><span>{number}</span><h3>{title}</h3><p>{text}</p><SiteLink to={to}>{label} <b>-&gt;</b></SiteLink></article>)}</div>
    </section>

    <section className="care-model-band" aria-labelledby="care-model-title">
      <div className="care-model-intro"><p className="eyebrow">One coordinated model</p><h2 id="care-model-title">Clinical decisions and daily habits belong in the same conversation.</h2><p>Weight care works better when the prescription, the plate, and the follow-up plan are not handled in isolation.</p></div>
      <div className="care-model-grid">
        <article><span>MD</span><h3>Medical assessment</h3><p>Review health history, medications, labs, risks, and whether treatment options are clinically appropriate.</p></article>
        <article><span>RD</span><h3>Nutrition strategy</h3><p>Turn the medical plan into realistic food, protein, fiber, hydration, and behavior routines.</p></article>
        <article><span>1:1</span><h3>Ongoing adjustment</h3><p>Track progress and tolerability, solve barriers, and adjust support as your needs change.</p></article>
      </div>
    </section>

    <section className="doctor-feature doctor-feature-compact" aria-labelledby="doctor-title">
      <div className="doctor-feature-image"><img src={asset("team/dr-leon-katz.jpg")} alt="Dr. Leon Katz, NutriAll Medical Director" /></div>
      <div className="doctor-feature-copy"><p className="eyebrow">Medical oversight when needed</p><h2 id="doctor-title">Care supported by an experienced Medical Director.</h2><p className="doctor-credential">Leon Katz, MD · Diplomate, American Board of Obesity Medicine</p><p>Dr. Katz supports NutriAll&apos;s medical weight-care pathway with clinical evaluation and oversight. Your day-to-day NutriAll experience remains centered on your goals and your care team.</p><SiteLink className="text-link" to="/medical-director">About our Medical Director -&gt;</SiteLink></div>
    </section>

    <section className="glp-home-feature" aria-labelledby="glp-home-title">
      <div className="glp-home-copy"><p className="eyebrow">GLP-1 medication care</p><h2 id="glp-home-title">Medication is one tool. The plan around it matters.</h2><p>Whether you are exploring semaglutide, tirzepatide, liraglutide, or another GLP-1 therapy, our team helps connect medical oversight with the everyday details that determine how treatment feels.</p><ul className="weight-check-list"><li>Injection or oral medication routines</li><li>Food, protein, hydration, and portion planning</li><li>Side-effect preparation and symptom tracking</li><li>Dose-change questions for your prescriber</li></ul><SiteLink className="button button-primary" to="/glp1-care">See GLP-1 support</SiteLink></div>
      <img src={asset("generated/glp1-training.webp")} alt="Clinician explaining a GLP-1 injection pen during a consultation" />
    </section>

    <section className="nutrition-feature" aria-labelledby="nutrition-title">
      <img src={asset("generated/weight-habits-lifestyle.png")} alt="Walking shoes, water, and balanced snacks for a sustainable weight-loss routine" />
      <div><p className="eyebrow">1:1 fat-loss nutrition</p><h2 id="nutrition-title">A dedicated dietitian for the parts that happen between visits.</h2><p>Build meals you can repeat, protect lean mass with protein, increase fiber without forcing unfamiliar foods, and create routines that work through travel, work, family meals, plateaus, and appetite changes.</p><SiteLink className="button button-secondary" to="/one-to-one-weight-loss">Explore 1:1 care</SiteLink></div>
    </section>

    <section className="home-dietitian-team" aria-labelledby="home-dietitian-title">
      <div className="home-dietitian-heading"><div><p className="eyebrow">Your nutrition care team</p><h2 id="home-dietitian-title">Meet our dietitians.</h2></div><SiteLink to="/about">Read full profiles <span aria-hidden="true">-&gt;</span></SiteLink></div>
      <div className="home-dietitian-grid">{dietitians.map((dietitian) => <article className="home-dietitian-member" key={dietitian.name}><img src={asset(dietitian.image)} alt={dietitian.imageAlt} style={{ objectPosition: dietitian.imagePosition }} /><h3>{dietitian.name}</h3><p>{dietitian.role}</p></article>)}</div>
    </section>

    <section className="weight-process" aria-labelledby="process-title">
      <div className="weight-section-heading"><p className="eyebrow">How it works</p><h2 id="process-title">A clear start, then care that adapts.</h2></div>
      <div className="weight-step-grid">{steps.map(([number, title, text]) => <article key={number}><span>{number}</span><h3>{title}</h3><p>{text}</p></article>)}</div>
    </section>

    <section className="resource-band" aria-labelledby="resource-title">
      <div><p className="eyebrow">Keep learning</p><h2 id="resource-title">Useful guidance, beyond the appointment.</h2><p>Explore practical recipes, plain-English research, and focused diabetes nutrition care from the same clinical team.</p></div>
      <div className="resource-band-links"><SiteLink to="/recipes">Browse recipes <span>-&gt;</span></SiteLink><SiteLink to="/research">Read research <span>-&gt;</span></SiteLink><SiteLink to="/diabetes-care">Diabetes care <span>-&gt;</span></SiteLink></div>
    </section>

    <section className="weight-final-cta"><p className="eyebrow">A lower-friction first step</p><h2>See whether your insurance may cover care.</h2><p>Request a free 15-minute consultation. We will check benefits and help identify the right next step.</p><SiteLink className="button button-primary" to="/book?service=insurance">Check my benefits</SiteLink></section>
  </main></Layout>;
}
