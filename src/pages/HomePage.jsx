import { Activity, ArrowRight, BookOpen, Cable, ClipboardList, Pill, ShieldCheck, Stethoscope, Users } from "lucide-react";
import { useTranslation } from "react-i18next";
import { InsuranceLogos } from "../components/InsuranceLogos";
import { Layout } from "../components/Layout";
import { SiteLink } from "../components/SiteLink";
import { asset } from "../lib";

const carePaths = [
  ["path1Title", "path1Text", "/one-to-one-weight-loss", "01"],
  ["path2Title", "path2Text", "/glp1-care", "02"],
  ["path3Title", "path3Text", "/medical-weight-loss", "03"],
];

const clinicalServices = [
  [BookOpen, "nav.classes", "services.classes.summary", "/diabetes-classes"],
  [Cable, "nav.pump", "services.pump.summary", "/pump-training"],
  [Activity, "nav.cgm", "services.cgm.summary", "/cgm-training"],
  [Pill, "nav.glpTraining", "services.glpTraining.summary", "/glp1-training"],
  [ClipboardList, "nav.providers", "services.providers.summary", "/providers"],
];

export function HomePage() {
  const { t } = useTranslation();
  const steps = [["step1Title", "step1Text"], ["step2Title", "step2Text"], ["step3Title", "step3Text"]];

  return <Layout><main className="clinic-home">
    <section className="clinic-hero">
      <div className="clinic-hero-copy">
        <p className="eyebrow">{t("home.eyebrow")}</p>
        <h1>{t("home.title")}</h1>
        <p>{t("home.intro")}</p>
        <div className="clinic-hero-actions">
          <SiteLink className="button button-primary" to="/book?service=one-to-one">{t("home.primary")}</SiteLink>
          <SiteLink className="button button-secondary" to="/insurance">{t("home.secondary")}</SiteLink>
        </div>
        <div className="clinic-language-trust"><Users size={19} aria-hidden="true" /><span>{t("home.trust")}</span></div>
      </div>
      <div className="clinic-hero-media"><img src={asset("generated/hero-diabetes-bright.png")} alt="Registered dietitian speaking with a patient" /></div>
    </section>

    <InsuranceLogos />

    <section className="clinic-paths" aria-labelledby="weight-path-title">
      <div className="clinic-section-heading"><p className="eyebrow">{t("home.pathsEyebrow")}</p><h2 id="weight-path-title">{t("home.pathsTitle")}</h2><p>{t("home.pathsIntro")}</p></div>
      <div className="clinic-path-grid">{carePaths.map(([title, text, to, number]) => <article key={to}><span>{number}</span><h3>{t(`home.${title}`)}</h3><p>{t(`home.${text}`)}</p><SiteLink to={to}>{t("home.explore")} <ArrowRight size={17} aria-hidden="true" /></SiteLink></article>)}</div>
    </section>

    <section className="clinic-process" aria-labelledby="process-title">
      <div className="clinic-section-heading"><p className="eyebrow">{t("home.processEyebrow")}</p><h2 id="process-title">{t("home.processTitle")}</h2></div>
      <div className="clinic-process-grid">{steps.map(([title, text], index) => <article key={title}><span>0{index + 1}</span><h3>{t(`home.${title}`)}</h3><p>{t(`home.${text}`)}</p></article>)}</div>
    </section>

    <section className="clinic-capabilities" aria-labelledby="capabilities-title">
      <div className="clinic-section-heading"><p className="eyebrow">{t("home.clinicalEyebrow")}</p><h2 id="capabilities-title">{t("home.clinicalTitle")}</h2><p>{t("home.clinicalIntro")}</p></div>
      <div className="clinic-capability-grid">{clinicalServices.map(([Icon, title, text, to]) => <SiteLink to={to} key={to}><span><Icon size={23} aria-hidden="true" /></span><h3>{t(title)}</h3><p>{t(text)}</p><b>{t("home.learn")} <ArrowRight size={16} aria-hidden="true" /></b></SiteLink>)}</div>
    </section>

    <section className="clinic-team-preview">
      <img src={asset("nutriall-team.jpg")} alt="NutriAll registered dietitians" />
      <div>
        <p className="eyebrow">{t("home.teamEyebrow")}</p>
        <h2>{t("home.teamTitle")}</h2>
        <p>{t("home.teamText")}</p>
        <SiteLink className="button button-secondary" to="/about">{t("home.teamLink")}</SiteLink>
        <aside><Stethoscope size={21} aria-hidden="true" /><div><strong>{t("home.directorTitle")}</strong><p>{t("home.directorText")}</p></div></aside>
      </div>
    </section>

    <section className="clinic-final-cta">
      <ShieldCheck size={31} aria-hidden="true" />
      <h2>{t("home.finalTitle")}</h2>
      <p>{t("home.finalText")}</p>
      <SiteLink className="button button-primary" to="/book?service=insurance">{t("home.finalButton")}</SiteLink>
    </section>
  </main></Layout>;
}
