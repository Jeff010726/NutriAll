import { ArrowRight, ExternalLink } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Layout } from "../components/Layout";
import { SiteLink } from "../components/SiteLink";
import { getExpansionContent, serviceGroups, servicePaths } from "../siteExpansionContent";

export function ServicesPage() {
  const { i18n } = useTranslation();
  const content = getExpansionContent(i18n.resolvedLanguage).services;
  const common = getExpansionContent(i18n.resolvedLanguage).common;

  return <Layout title={`${content.eyebrow} | NutriAll`} description={content.intro}><main className="expansion-page services-page">
    <section className="expansion-hero">
      <div><p className="eyebrow">{content.eyebrow}</p><h1>{content.title}</h1><p>{content.intro}</p><SiteLink className="button button-primary" to="/book">{common.book}</SiteLink></div>
    </section>
    <section className="services-groups">
      {serviceGroups.map((group) => <section className="service-group" key={group.id} aria-labelledby={`service-group-${group.id}`}>
        <h2 id={`service-group-${group.id}`}>{content.groupNames[group.id]}</h2>
        <div>{group.items.map((id) => <SiteLink className="service-directory-item" to={servicePaths[id]} key={id}>
          <span><strong>{content.items[id][0]}</strong><small>{content.items[id][1]}</small></span><ArrowRight aria-hidden="true" />
        </SiteLink>)}</div>
      </section>)}
    </section>
    <section className="service-diabetes-route">
      <div><p className="eyebrow">XT Diabetes Care</p><h2>{content.diabetesTitle}</h2><p>{content.diabetesText}</p></div>
      <SiteLink className="button button-secondary" to="/diabetes-education">{content.diabetesAction} <ExternalLink size={17} aria-hidden="true" /></SiteLink>
    </section>
    <section className="clinic-final-cta"><h2>{content.finalTitle}</h2><SiteLink className="button button-primary" to="/book">{common.book}</SiteLink></section>
  </main></Layout>;
}
