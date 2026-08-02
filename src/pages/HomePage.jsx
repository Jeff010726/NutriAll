import { useState } from "react";
import { Layout } from "../components/Layout";
import { SiteLink } from "../components/SiteLink";
import { asset } from "../lib";

const careTiles = [
  ["care-tile-circle care-tile-large", "/program#meal-planning", "mosaic/meal-planning.jpg", "Meal planning", "Culturally realistic meals for your schedule."],
  ["care-tile-tall", "/program#monitoring", "mosaic/blood-sugar-patterns.jpg", "Blood sugar patterns", "Understand what your numbers are telling you."],
  ["care-tile-tall", "/program#carb-management", "mosaic/carb-confidence.jpg", "Carb confidence", "Portions, pairing, and timing without fear."],
  ["care-tile-pill", "/insurance", "mosaic/insurance-benefits.jpg", "Insurance benefits", "Check whether care may cost $0."],
  ["care-tile-card", "/research", "mosaic/research-explained.jpg", "Research explained", "Plain-English takeaways from diabetes studies."],
  ["care-tile-tall", "/book", "mosaic/dietitian-support.jpg", "Dietitian support", "Registered guidance for daily decisions."],
  ["care-tile-pill", "/recipes", "mosaic/recipes.jpg", "Diabetes-friendly recipes", "Practical meals, snacks, and planned treats."],
];

export function HomePage() {
  const [submitted, setSubmitted] = useState(false);
  return (
    <Layout>
      <main>
        <section className="hero diabetes-hero" aria-labelledby="hero-title">
          <div className="hero-media" role="img" aria-label="A balanced meal and nutrition tools for diabetes care"></div>
          <div className="hero-content">
            <p className="eyebrow">NutriAll Diabetes Care</p>
            <h1 id="hero-title">Diabetes nutrition care, made personal.</h1>
            <p>Registered dietitians help you understand blood sugar, build culturally realistic meals, and create a diabetes management plan that fits your life.</p>
            <div className="hero-actions"><SiteLink className="button button-primary" to="/book">Book a free call</SiteLink><SiteLink className="button button-secondary" to="/program">See the program</SiteLink></div>
          </div>
        </section>

        <section className="intro-band" aria-label="Program overview">
          <div className="intro-copy"><h2>A dedicated diabetes program from NutriAll Wellness.</h2><p>Diabetes is a chronic metabolic condition marked by elevated blood glucose. Our team focuses on what you can do day to day: meals, monitoring, medication awareness, weight goals, heart health, and sustainable behavior change.</p></div>
          <div className="intro-stat"><span>99%</span><p>of many NutriAll clients pay $0 using eligible insurance benefits</p></div>
        </section>

        <section className="care-mosaic-section" id="program" aria-labelledby="program-title">
          <div className="care-mosaic-heading"><p className="eyebrow">Diabetes care areas</p><h2 id="program-title">Support for the real decisions behind blood sugar.</h2></div>
          <div className="care-mosaic" aria-label="Diabetes care topics">
            {careTiles.slice(0, 6).map(([className, to, image, title, note]) => (
              <SiteLink className={`care-tile ${className}`} to={to} key={title}><img src={asset(image)} alt="" /><span><strong>{title}</strong><small>{note}</small></span></SiteLink>
            ))}
            <SiteLink className="care-tile care-tile-card care-tile-dark" to="/recipes"><strong>Recipes you can repeat</strong><small>High-protein, fiber-forward ideas built from the NutriAll library.</small></SiteLink>
            {careTiles.slice(6).map(([className, to, image, title, note]) => (
              <SiteLink className={`care-tile ${className}`} to={to} key={title}><img src={asset(image)} alt="" /><span><strong>{title}</strong><small>{note}</small></span></SiteLink>
            ))}
          </div>
        </section>

        <section className="bundle-section" id="learn" aria-labelledby="learn-title">
          <div className="bundle-gallery"><img src={asset("generated/diabetes-symptoms-awareness.png")} alt="Diabetes symptom awareness education still life" /><img src={asset("generated/behavior-education-cards.png")} alt="Nutrition education and behavior change cards" /><img src={asset("generated/carb-education-foods.png")} alt="Diabetes carbohydrate education visual" /></div>
          <div className="bundle-copy"><p className="eyebrow">What is diabetes?</p><h2 id="learn-title">Food choices are data, not judgment.</h2><p>Diabetes management is easier when you know how meals, medication, activity, and stress connect with glucose numbers. We translate those patterns into clear next steps you can repeat.</p><SiteLink className="button button-primary" to="/book">Talk to a dietitian</SiteLink></div>
        </section>

        <section className="science-section" id="why" aria-labelledby="why-title">
          <div className="science-visual diabetes-visual team-visual"><img src={asset("nutriall-team.jpg")} alt="NutriAll Wellness team group photo" /><p>Registered Dietitian Nutrition Counseling</p></div>
          <div className="science-copy"><p className="eyebrow">Why choose us</p><h2 id="why-title">Clinical guidance, cultural fluency, and insurance-aware care.</h2><p>NutriAll dietitians conduct in-depth assessments and create customized Diabetes Management Programs. Care is available across multiple languages and cultural backgrounds, and most insurances are accepted.</p><div className="science-points"><div><span>01</span><h3>Personalized</h3><p>Plans are shaped around your food preferences, culture, medications, and health goals.</p></div><div><span>02</span><h3>Holistic</h3><p>Support covers meals, monitoring, weight, cardiovascular risk, and behavior change.</p></div></div></div>
        </section>

        <section className="video-story" id="stories" aria-labelledby="stories-title">
          <div className="story-card"><img src={asset("generated/behavior-education-cards.png")} alt="Nutrition education and behavior change support materials" /><span className="play-button" aria-label="Diabetes care story">Story</span></div>
          <div className="story-copy"><p className="eyebrow">Client outcomes</p><h2 id="stories-title">Support that changes how people live with diabetes.</h2><p>Clients describe clearer nutrition choices, better blood sugar control, and feeling less alone after working with NutriAll registered dietitians.</p></div>
        </section>

        <section className="journal-section" aria-labelledby="testimonial-title">
          <div className="section-heading"><p className="eyebrow">Testimonials</p><h2 id="testimonial-title">Real feedback from diabetes nutrition clients.</h2><SiteLink to="/book">Start care</SiteLink></div>
          <div className="testimonial-grid">
            <article><p>"Cici really knew her stuff when it came to diabetes management and nutrition. Talking to her opened my eyes to a whole new understanding of diabetes and nutrition."</p><strong>Client of RD Cici</strong></article>
            <article><p>"Kristie transformed my approach to nutrition, contributing significantly to my overall well-being and better management of diabetes."</p><strong>Client of RD Kristie</strong></article>
            <article><p>"RD Tan helped me get through it one step at a time. I am now living like a normal person and eating healthy without medication."</p><strong>Client of RD Tan</strong></article>
          </div>
        </section>

        <section className="quiz-section" id="consult" aria-labelledby="consult-title">
          <div><p className="eyebrow">Free intro call</p><h2 id="consult-title">Get a diabetes nutrition consult with NutriAll.</h2></div>
          <form className="quiz-form" onSubmit={(event) => { event.preventDefault(); setSubmitted(true); }}><label>Email<input type="email" name="email" placeholder="you@example.com" required disabled={submitted} /></label><button className="button button-primary" type="submit" disabled={submitted}>{submitted ? "Request received" : "Request consultation"}</button></form>
        </section>
      </main>
    </Layout>
  );
}
