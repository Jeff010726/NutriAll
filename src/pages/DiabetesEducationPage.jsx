import { Check, ExternalLink } from "lucide-react";
import { useTranslation } from "react-i18next";
import { trackEvent } from "../analytics";
import { Layout } from "../components/Layout";
import { SiteLink } from "../components/SiteLink";
import { getExpansionContent } from "../siteExpansionContent";

export function DiabetesEducationPage() {
  const { i18n } = useTranslation();
  const content = getExpansionContent(i18n.resolvedLanguage).diabetes;
  const common = getExpansionContent(i18n.resolvedLanguage).common;
  return <Layout title={`${content.eyebrow} | NutriAll`} description={content.intro}><main className="expansion-page diabetes-route-page">
    <section className="expansion-hero"><div><p className="eyebrow">{content.eyebrow}</p><h1>{content.title}</h1><p>{content.intro}</p></div></section>
    <section className="diabetes-choice-grid">
      <article><p className="eyebrow">NutriAll</p><h2>{content.nutriTitle}</h2><ul>{content.nutriItems.map((item) => <li key={item}><Check aria-hidden="true" />{item}</li>)}</ul><SiteLink className="button button-secondary" to="/book">{common.book}</SiteLink></article>
      <article><p className="eyebrow">XT Diabetes Care</p><h2>{content.xtTitle}</h2><ul>{content.xtItems.map((item) => <li key={item}><Check aria-hidden="true" />{item}</li>)}</ul><a className="button button-primary" href="https://xtdiabetescare.com/" target="_blank" rel="noreferrer" onClick={() => trackEvent("xt_diabetes_referral", "services")}>{content.action} <ExternalLink size={17} aria-hidden="true" /></a></article>
    </section>
    <p className="external-service-note">{content.note}</p>
  </main></Layout>;
}
