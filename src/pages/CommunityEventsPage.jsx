import { ArrowRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Layout } from "../components/Layout";
import { SiteLink } from "../components/SiteLink";
import { asset } from "../lib";
import { getExpansionContent } from "../siteExpansionContent";

const images = [
  "community-gallery/church-diabetes-class.jpg", "community-gallery/outdoor-family-fair.webp", "community-gallery/wellness-booth.webp", "community-gallery/senior-community-class-1.webp",
  "community-gallery/bilingual-dsmes-poster-team.webp", "community-gallery/conference-poster-presentation.webp", "community-gallery/fnce-2025-group.webp", "community-gallery/outdoor-team.webp",
  "community-gallery/senior-community-class-2.webp", "community-gallery/conference-poster-team.webp", "community-gallery/adces-conference-team.webp", "community-gallery/fnce-2025-pair.webp",
];

export function CommunityEventsPage() {
  const { i18n } = useTranslation();
  const content = getExpansionContent(i18n.resolvedLanguage).events;
  return <Layout title={`${content.title} | NutriAll`} description={content.intro}><main className="expansion-page events-page">
    <section className="expansion-hero compact"><div><p className="eyebrow">{content.eyebrow}</p><h1>{content.title}</h1><p>{content.intro}</p><SiteLink className="button button-primary" to="/community-programs/inquiry">{content.cta} <ArrowRight size={18} aria-hidden="true" /></SiteLink></div></section>
    <section className="events-grid">{images.map((src, index) => <figure key={src}><img src={asset(src)} alt={content.captions[index % content.captions.length]} loading={index < 3 ? "eager" : "lazy"} /><figcaption>{content.captions[index % content.captions.length]}</figcaption></figure>)}</section>
  </main></Layout>;
}
