import { ArrowRight, Check, ShieldCheck } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Layout } from "../components/Layout";
import { SiteLink } from "../components/SiteLink";
import { asset } from "../lib";

const serviceAssets = {
  classes: "generated/nutrition-education-care.png",
  pump: "generated/glucose-device-modern.png",
  cgm: "generated/blood-sugar-monitoring-care.png",
  glpTraining: "generated/glp1-training.webp",
  providers: "generated/nutrition-education-care.png",
};

export function ClinicalServicePage({ service }) {
  const { t } = useTranslation();
  const content = t(`services.${service}`, { returnObjects: true });

  return <Layout title={`${content.title} | NutriAll`}><main className="clinical-service-page">
    <section className="clinical-service-hero">
      <div>
        <p className="eyebrow">{t("services.eyebrow")}</p>
        <h1>{content.title}</h1>
        <p>{content.summary}</p>
        <SiteLink className="button button-primary" to={`/book?service=${service}`}>{t("services.appointment")} <ArrowRight size={18} aria-hidden="true" /></SiteLink>
      </div>
      <img src={asset(serviceAssets[service])} alt="" />
    </section>

    <section className="clinical-service-details">
      <div>
        <p className="eyebrow">{t("services.what")}</p>
        <h2>{content.summary}</h2>
      </div>
      <ul>{content.points.map((point) => <li key={point}><Check size={20} aria-hidden="true" /><span>{point}</span></li>)}</ul>
    </section>

    <section className="clinical-service-process">
      <p className="eyebrow">{t("services.expect")}</p>
      <div>{content.steps.map((step, index) => <article key={step}><span>0{index + 1}</span><p>{step}</p></article>)}</div>
    </section>

    <section className="clinical-service-insurance">
      <ShieldCheck size={28} aria-hidden="true" />
      <p>{t("services.insurance")}</p>
      <SiteLink to="/insurance">{t("insurance.action")} <ArrowRight size={17} aria-hidden="true" /></SiteLink>
    </section>

    <section className="clinic-final-cta">
      <h2>{content.title}</h2>
      <p>{content.summary}</p>
      <SiteLink className="button button-primary" to={`/book?service=${service}`}>{t("services.appointment")}</SiteLink>
    </section>
  </main></Layout>;
}
