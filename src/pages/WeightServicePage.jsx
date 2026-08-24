import { ArrowRight, Check, ExternalLink, ShieldCheck, Users } from "lucide-react";
import { useTranslation } from "react-i18next";
import { InsuranceLogos } from "../components/InsuranceLogos";
import { Layout } from "../components/Layout";
import { SiteLink } from "../components/SiteLink";
import { CareGuideSections } from "../components/CareGuideSections";
import { getCareGuide } from "../careGuides";
import { asset } from "../lib";
import { trackEvent } from "../analytics";

const serviceConfig = {
  oneToOne: { image: "generated/weight-habits-lifestyle.png", booking: "one-to-one" },
  glpCare: { image: "generated/glp1-training.webp", booking: "glp1" },
  medical: { image: "generated/weight-management-care.png", booking: "medical-weight-loss" },
  insurance: { image: "mosaic/insurance-benefits.jpg", booking: "insurance" },
};

const guideKeys = { oneToOne: "weight-loss", glpCare: "glp1", medical: "medical-weight-loss" };
const kalixBookingUrl = "https://app.kalixhealth.com/calendar?calendar_token=06d2246dd9ed72a6228706d8c2dcac8f";

export function WeightServicePage({ service }) {
  const { t, i18n } = useTranslation();
  const content = t(`weightServices.${service}`, { returnObjects: true });
  const config = serviceConfig[service];
  const guide = guideKeys[service] ? getCareGuide(guideKeys[service], i18n.resolvedLanguage || i18n.language) : null;

  return <Layout description={guide?.intro || content.summary} title={`${content.title} | NutriAll`}><main className="clinical-service-page weight-service-page">
    <section className="clinical-service-hero">
      <div><p className="eyebrow">{t("weightServices.eyebrow")}</p><h1>{content.title}</h1><p>{content.summary}</p><div className="clinical-service-actions"><a className="button button-primary" href={kalixBookingUrl} target="_blank" rel="noreferrer" onClick={() => trackEvent("kalix_booking_click", service, { service })}>{t("weightServices.bookNow")} <ExternalLink size={17} aria-hidden="true" /></a><SiteLink className="button button-secondary" to={`/book?service=${config.booking}`}>{t("home.primary")} <ArrowRight size={18} aria-hidden="true" /></SiteLink></div></div>
      <img src={asset(config.image)} alt="" />
    </section>

    {guide ? <>
      <section className="clinical-service-insurance"><Users size={28} aria-hidden="true" /><p>{t("weightServices.insuranceNote")}</p><SiteLink to="/insurance">{t("insurance.action")} <ArrowRight size={17} aria-hidden="true" /></SiteLink></section>
      <CareGuideSections guide={guide} />
    </> : <>
      <InsuranceLogos compact />
      <section className="clinical-service-details">
        <div><p className="eyebrow">{t("weightServices.help")}</p><h2>{content.summary}</h2></div>
        <ul>{content.points.map((point) => <li key={point}><Check size={20} aria-hidden="true" /><span>{point}</span></li>)}</ul>
      </section>
      <section className="clinical-service-process">
        <p className="eyebrow">{t("weightServices.process")}</p>
        <div>{content.steps.map((step, index) => <article key={step}><span>0{index + 1}</span><p>{step}</p></article>)}</div>
      </section>
      <section className="clinical-service-insurance"><ShieldCheck size={28} aria-hidden="true" /><p>{content.note}</p><SiteLink to={`/book?service=${config.booking}`}>{t("insurance.action")} <ArrowRight size={17} aria-hidden="true" /></SiteLink></section>
      <section className="clinic-final-cta"><h2>{content.title}</h2><p>{content.summary}</p><SiteLink className="button button-primary" to={`/book?service=${config.booking}`}>{t("home.primary")}</SiteLink></section>
    </>}
  </main></Layout>;
}
