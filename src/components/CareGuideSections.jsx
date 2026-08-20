import { AlertTriangle, ArrowRight, Check, ExternalLink, ShieldCheck } from "lucide-react";
import { SiteLink } from "./SiteLink";
import { guidePaths, getCareGuide } from "../careGuides";

export function CareGuideSections({ guide }) {
  return <div className="care-guide-sections">
    <section className="care-guide-overview">
      <div className="care-guide-section-heading"><p className="eyebrow">{guide.overviewLabel}</p><h2>{guide.shortTitle}</h2></div>
      <div className="care-guide-overview-copy">{guide.overview.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</div>
    </section>

    <section className="care-guide-focus">
      <div className="care-guide-section-heading"><p className="eyebrow">{guide.focusLabel}</p><h2>{guide.focusLabel}</h2></div>
      <div className="care-guide-focus-grid">{guide.focus.map((item, index) => <article key={item}><span>0{index + 1}</span><p>{item}</p></article>)}</div>
    </section>

    <section className="care-guide-visit">
      <div className="care-guide-section-heading"><p className="eyebrow">{guide.visitLabel}</p><h2>{guide.visitLabel}</h2></div>
      <ol>{guide.visit.map((step, index) => <li key={step}><span>{index + 1}</span><p>{step}</p></li>)}</ol>
    </section>

    <section className="care-guide-urgent">
      <div><AlertTriangle size={28} aria-hidden="true" /><h2>{guide.urgentLabel}</h2></div>
      <ul>{guide.urgent.map((item) => <li key={item}><Check size={19} aria-hidden="true" /><span>{item}</span></li>)}</ul>
    </section>

    <section className="care-guide-faq">
      <div className="care-guide-section-heading"><p className="eyebrow">{guide.faqLabel}</p><h2>{guide.faqLabel}</h2></div>
      <div>{guide.faq.map(({ q, a }, index) => <details key={q} open={index === 0}><summary>{q}<span aria-hidden="true">+</span></summary><p>{a}</p></details>)}</div>
    </section>

    <section className="care-guide-sources">
      <div><ShieldCheck size={24} aria-hidden="true" /><div><strong>{guide.sourcesLabel}</strong><p>{guide.disclaimer}</p></div></div>
      <ul>{guide.sources.map(([label, href]) => <li key={href}><a href={href} target="_blank" rel="noreferrer">{label}<ExternalLink size={15} aria-hidden="true" /></a></li>)}</ul>
    </section>

    <RelatedGuides guide={guide} />

    <section className="care-guide-booking">
      <h2>{guide.bookingTitle}</h2>
      <p>{guide.bookingText}</p>
      <SiteLink className="button button-primary" to={`/book?service=${encodeURIComponent(guide.shortTitle)}`}>{guide.bookingButton}<ArrowRight size={18} aria-hidden="true" /></SiteLink>
    </section>
  </div>;
}

function RelatedGuides({ guide }) {
  const related = guide.related.map((slug) => ({ slug, content: getCareGuide(slug, guide.locale) })).filter(({ content }) => content);
  if (!related.length) return null;
  return <section className="care-guide-related">
    <div className="care-guide-section-heading"><p className="eyebrow">{guide.relatedLabel}</p><h2>{guide.relatedLabel}</h2></div>
    <div>{related.map(({ slug, content }) => <SiteLink to={guidePaths[slug]} key={slug}><span>{content.shortTitle}</span><ArrowRight size={18} aria-hidden="true" /></SiteLink>)}</div>
  </section>;
}
