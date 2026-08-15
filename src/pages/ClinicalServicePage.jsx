import {
  Activity, ArrowRight, BookOpen, Check, ClipboardCheck, Clock, ExternalLink,
  FileText, GraduationCap, HeartPulse, LineChart, Pill, ShieldCheck, Smartphone,
  Syringe, Utensils,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { getClinicalContent } from "../clinicalContent";
import { Layout } from "../components/Layout";
import { SiteLink } from "../components/SiteLink";
import { asset } from "../lib";

const serviceKeys = { classes: "classes", pump: "pumpTraining", cgm: "cgm", glpTraining: "glp1Training", providers: "providers" };
const bookingKeys = { classes: "diabetes-classes", pump: "pump-training", cgm: "cgm-training", glpTraining: "glp1-training", providers: "provider-referral" };

const classTeamImages = {
  Ziying: "team/ziying-studio.jpg",
  "Yirao (Rebecca) Wang, RDN, LDN, MPH": "team/yirao-wang-studio.jpg",
  "Jinhui Zhou, MS, RD, CDN, CDCES": "team/jinhui-zhou-studio.jpg",
};

function BookButton({ service, children }) {
  return <SiteLink className="button button-primary detailed-book-button" to={`/book?service=${bookingKeys[service]}`}>{children}<ArrowRight size={18} aria-hidden="true" /></SiteLink>;
}

function ClassesContent({ content, service }) {
  const credentialImages = ["adces-deap-accreditation.webp", "cdces-badge.webp", "rd-rdn-badge.webp"];
  return <>
    <section className="detailed-hero detailed-hero-classes">
      <div><p className="eyebrow">{content.eyebrow}</p><p className="detailed-badge">{content.chineseFirstBadge}</p><h1>{content.heroTitle}</h1><p>{content.heroSubtitle}</p><div className="detailed-hero-actions"><BookButton service={service}>{content.bookButton}</BookButton><a className="button button-secondary" href="#curriculum">{content.viewCurriculumButton}</a></div></div>
      <aside><BookOpen size={35} aria-hidden="true" /><strong>{content.hours}</strong><p>{content.hoursDescription}</p><ul><li>{content.bilingual}</li><li>{content.delivery}</li><li>{content.coverageNote}</li></ul></aside>
    </section>

    <section className="detailed-credentials">
      <div className="detailed-section-heading"><p className="eyebrow">{content.credentialEyebrow}</p><h2>{content.credentialTitle}</h2><p>{content.credentialIntro}</p></div>
      <div>{content.credentials.map((item, index) => <article key={item.title}><img src={asset(credentialImages[index])} alt="" /><h3>{item.title}</h3><p>{item.desc}</p></article>)}</div>
    </section>

    <section className="detailed-curriculum" id="curriculum">
      <div className="detailed-section-heading"><p className="eyebrow">{content.curriculumEyebrow}</p><h2>{content.curriculumTitle}</h2><p>{content.curriculumIntro}</p></div>
      <div className="curriculum-grid">{content.curriculum.map((session, index) => <article key={session.title}><span>0{index + 1}</span><h3>{session.title}</h3><strong>{session.subtitle}</strong><ul>{session.topics.map((topic) => <li key={topic}><Check size={17} aria-hidden="true" />{topic}</li>)}</ul></article>)}</div>
    </section>

    <section className="detailed-instructors">
      <div className="detailed-section-heading"><p className="eyebrow">{content.instructorsEyebrow}</p><h2>{content.instructorsTitle}</h2><p>{content.instructorsIntro}</p></div>
      <div>{content.instructors.map((instructor) => <article key={instructor.name}><img src={asset(classTeamImages[instructor.name] || "team/ziying-studio.jpg")} alt={instructor.name} /><h3>{instructor.name}</h3><p className="detailed-role">{instructor.role}</p><details><summary>{content.instructorsReadFullBio}</summary>{instructor.bio.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</details></article>)}</div>
    </section>

    <section className="detailed-testimonials"><div className="detailed-section-heading"><p className="eyebrow">{content.testimonialsEyebrow}</p><h2>{content.testimonialsTitle}</h2></div><div>{content.testimonials.map((item) => <article key={item.name}><img src={asset(item.image)} alt="" /><blockquote>“{item.quote}”</blockquote><strong>{item.name}</strong><span>{item.detail}</span></article>)}</div></section>

    <section className="detailed-start"><div className="detailed-section-heading"><p className="eyebrow">{content.startEyebrow}</p><h2>{content.startTitle}</h2><p>{content.startIntro}</p></div><div>{content.startSteps.map((step, index) => <article key={step.title}><span>0{index + 1}</span><h3>{step.title}</h3><p>{step.desc}</p></article>)}</div></section>

    <section className="detailed-disclaimer"><HeartPulse size={21} aria-hidden="true" /><p><strong>{content.disclaimerTitle}: </strong>{content.disclaimerBody.replaceAll("XT Diabetes Care", "NutriAll Wellness")}</p></section>
  </>;
}

function PumpContent({ content, service }) {
  return <>
    <section className="detailed-image-hero"><img src={asset("hero-pump-training.webp")} alt="" /><div><p className="eyebrow">{content.catalogEyebrow}</p><h1>{content.heroTitle}</h1><p>{content.heroSubtitle}</p><div className="hero-chip-row"><span>{content.heroBadges.free}</span><span>{content.heroBadges.noInsurance}</span><span>{content.heroBadges.noReferral}</span></div><BookButton service={service}>{content.scheduleButton}</BookButton></div></section>
    <section className="pump-catalog"><div className="detailed-section-heading"><p className="eyebrow">{content.catalogEyebrow}</p><h2>{content.catalogTitle}</h2><p>{content.catalogSubtitle}</p></div><div className="pump-brand-list">{content.pumpBrands.map((brand) => <section className="pump-brand" key={brand.brand}><div><h3>{brand.brand}</h3><p>{brand.summary}</p></div><div className="pump-product-grid">{brand.products.map((product) => <article key={product.name}><div className="pump-product-image"><img src={asset(product.image)} alt={product.name} /></div><div className="pump-tags">{product.tags.map((tag) => <span key={tag}>{tag}</span>)}</div><h4>{product.name}</h4><p>{product.desc}</p><a href={product.sourceUrl} target="_blank" rel="noreferrer">{content.sourceLink}<ExternalLink size={15} aria-hidden="true" /></a></article>)}</div></section>)}</div></section>
    <section className="detailed-expect"><div><p className="eyebrow">{content.expectTitle}</p><h2>{content.needTitle}</h2><p>{content.needBody}</p><BookButton service={service}>{content.scheduleButton}</BookButton></div><ul>{content.expectations.map((item) => <li key={item}><Check size={19} aria-hidden="true" />{item}</li>)}</ul></section>
  </>;
}

function CgmContent({ content, service }) {
  const featureLabels = Object.values(content.features);
  const featureIcons = [Smartphone, Activity, LineChart, ClipboardCheck, HeartPulse];
  return <>
    <section className="detailed-image-hero"><img src={asset("hero-cgm.webp")} alt="" /><div><p className="eyebrow">CGM</p><h1>{content.heroTitle}</h1><p>{content.heroSubtitle}</p><BookButton service={service}>{content.scheduleButton}</BookButton></div></section>
    <section className="cgm-devices">{content.devices.map((device) => <article key={device.name}><div><img src={asset(device.logo)} alt={`${device.name} logo`} /></div><h3>{device.name}</h3><strong>{device.maker}</strong><p>{device.desc}</p><a href={device.sourceUrl} target="_blank" rel="noreferrer">{content.officialWebsite}<ExternalLink size={15} aria-hidden="true" /></a></article>)}</section>
    <section className="cgm-analysis"><div className="cgm-feature-grid">{featureLabels.map((label, index) => { const Icon = featureIcons[index]; return <article key={label}><Icon size={24} aria-hidden="true" /><strong>{label}</strong></article>; })}</div><div><p className="eyebrow">AGP + TIR</p><h2>{content.beyondTitle}</h2><p>{content.beyondIntro}</p><p dangerouslySetInnerHTML={{ __html: content.beyondBody }} /><BookButton service={service}>{content.scheduleButton}</BookButton></div></section>
  </>;
}

function GlpContent({ content, service }) {
  const icons = [Syringe, Pill, Utensils, ClipboardCheck];
  return <>
    <section className="detailed-image-hero"><img src={asset("hero-glp1-training.webp")} alt={content.imageAlt} /><div><p className="eyebrow">{content.badge}</p><h1>{content.heroTitle}</h1><p>{content.heroSubtitle}</p><BookButton service={service}>{content.scheduleButton}</BookButton></div></section>
    <section className="glp-training-topics"><div className="detailed-section-heading"><h2>{content.trainingTitle}</h2><p>{content.trainingIntro}</p></div><div>{content.topics.map((topic, index) => { const Icon = icons[index]; return <article key={topic.title}><Icon size={25} aria-hidden="true" /><h3>{topic.title}</h3><p>{topic.desc}</p></article>; })}</div></section>
    <section className="glp-side-effects"><div><p className="eyebrow">GLP-1</p><h2>{content.sideEffectTitle}</h2><p>{content.sideEffectIntro}</p></div><ul>{content.sideEffects.map((effect) => <li key={effect}><Check size={18} aria-hidden="true" />{effect}</li>)}</ul></section>
  </>;
}

function ProvidersContent({ content, service, insuranceCopy, contactLabel }) {
  const icons = [Clock, GraduationCap, FileText];
  return <>
    <section className="provider-hero"><ShieldCheck size={34} aria-hidden="true" /><p className="eyebrow">{content.badge}</p><h1>{content.heroLine1}<br />{content.heroLine2}</h1><p>{content.heroSubtitle.replaceAll("XT Diabetes Care", "NutriAll Wellness").replace(/completely covered by insurance\.?/i, "with commercial insurance benefit verification available.")}</p></section>
    <section className="provider-values">{content.values.map((value, index) => { const Icon = icons[index]; return <article key={value.title}><Icon size={25} aria-hidden="true" /><h3>{value.title}</h3><p>{value.desc}</p></article>; })}</section>
    <section className="provider-referral"><div><p className="eyebrow">{content.referTitle}</p><h2>{content.referTitle}</h2><p>{insuranceCopy}</p><strong className="provider-fax">{content.faxLine}</strong><ul>{content.referralCandidates.map((item) => <li key={item}><ArrowRight size={17} aria-hidden="true" />{item}</li>)}</ul><BookButton service={service}>{contactLabel}</BookButton></div><aside><img src={asset("adces-deap-accreditation.webp")} alt={content.accreditedTitle} /><h3>{content.accreditedTitle}</h3><strong>{content.accreditedId}</strong><p>{content.accreditedBody}</p><img className="provider-certificate" src={asset("adces-deap-certificate.webp")} alt={content.certificateAlt} /></aside></section>
  </>;
}

export function ClinicalServicePage({ service }) {
  const { i18n, t } = useTranslation();
  const content = getClinicalContent(i18n.resolvedLanguage || "en", serviceKeys[service]);
  const title = content.heroTitle || `${content.heroLine1} ${content.heroLine2}`;

  return <Layout title={`${title} | NutriAll`}><main className={`detailed-clinical-page detailed-${service}`}>
    {service === "classes" && <ClassesContent content={content} service={service} />}
    {service === "pump" && <PumpContent content={content} service={service} />}
    {service === "cgm" && <CgmContent content={content} service={service} />}
    {service === "glpTraining" && <GlpContent content={content} service={service} />}
    {service === "providers" && <ProvidersContent content={content} service={service} insuranceCopy={t("services.insurance")} contactLabel={t("services.appointment")} />}
    <section className="clinic-final-cta detailed-final-cta"><h2>{title}</h2><p>{t("services.insurance")}</p><BookButton service={service}>{t("services.appointment")}</BookButton></section>
  </main></Layout>;
}
