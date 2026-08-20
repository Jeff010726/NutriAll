import { ArrowRight } from "lucide-react";
import { Navigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { CareGuideSections } from "../components/CareGuideSections";
import { Layout } from "../components/Layout";
import { SiteLink } from "../components/SiteLink";
import { getCareGuide } from "../careGuides";
import { asset } from "../lib";

export function ConditionPage() {
  const { condition } = useParams();
  const { i18n } = useTranslation();
  const guide = getCareGuide(condition, i18n.resolvedLanguage || i18n.language);
  if (!guide) return <Navigate replace to="/" />;

  return <Layout description={guide.intro} title={`${guide.shortTitle} | NutriAll`}><main className="care-guide-page">
    <section className="care-guide-hero">
      <div>
        <p className="eyebrow">{guide.eyebrow}</p>
        <h1>{guide.title}</h1>
        <p>{guide.intro}</p>
        <SiteLink className="button button-primary" to={`/book?service=${encodeURIComponent(guide.shortTitle)}`}>{guide.bookingButton}<ArrowRight size={18} aria-hidden="true" /></SiteLink>
      </div>
      <img src={asset(guide.image)} alt={guide.imageAlt} />
    </section>
    <CareGuideSections guide={guide} />
  </main></Layout>;
}
