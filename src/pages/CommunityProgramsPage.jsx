import { ArrowRight, Building2, CalendarRange, Check, Church, Languages, Presentation, UsersRound } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Layout } from "../components/Layout";
import { SiteLink } from "../components/SiteLink";
import { asset } from "../lib";

const audienceIcons = [Church, Building2, UsersRound, CalendarRange];

export function CommunityProgramsPage() {
  const { t } = useTranslation();
  const content = t("community", { returnObjects: true });

  return <Layout title={`${content.title} | NutriAll`}><main className="community-program-page">
    <section className="community-program-hero">
      <div>
        <p className="eyebrow">{content.eyebrow}</p>
        <h1>{content.title}</h1>
        <p>{content.intro}</p>
        <SiteLink className="button button-primary" to="/book?service=community">{content.book} <ArrowRight size={18} aria-hidden="true" /></SiteLink>
      </div>
      <img src={asset("community-gallery/church-diabetes-class.jpg")} alt={content.imageAlt} />
    </section>

    <section className="community-audiences" aria-labelledby="community-audiences-title">
      <div className="community-section-heading">
        <p className="eyebrow">{content.audiencesEyebrow}</p>
        <h2 id="community-audiences-title">{content.audiencesTitle}</h2>
      </div>
      <div>{content.audiences.map((item, index) => {
        const Icon = audienceIcons[index];
        return <article key={item}><Icon size={24} aria-hidden="true" /><span>{item}</span></article>;
      })}</div>
    </section>

    <section className="community-formats" aria-labelledby="community-formats-title">
      <div className="community-section-heading">
        <p className="eyebrow">{content.formatsEyebrow}</p>
        <h2 id="community-formats-title">{content.formatsTitle}</h2>
        <p>{content.formatsIntro}</p>
      </div>
      <div className="community-format-grid">{content.formats.map((format, index) => <article key={format.title}>
        <span>0{index + 1}</span>
        <h3>{format.title}</h3>
        <p>{format.text}</p>
      </article>)}</div>
    </section>

    <section className="community-delivery">
      <div>
        <p className="eyebrow">{content.deliveryEyebrow}</p>
        <h2>{content.deliveryTitle}</h2>
        <p>{content.deliveryIntro}</p>
      </div>
      <ul>{content.delivery.map((item) => <li key={item}><Check size={20} aria-hidden="true" /><span>{item}</span></li>)}</ul>
      <aside><Presentation size={25} aria-hidden="true" /><Languages size={25} aria-hidden="true" /><p>{content.languageNote}</p></aside>
    </section>

    <section className="community-process" aria-labelledby="community-process-title">
      <div className="community-section-heading"><p className="eyebrow">{content.processEyebrow}</p><h2 id="community-process-title">{content.processTitle}</h2></div>
      <ol>{content.process.map((step, index) => <li key={step}><span>0{index + 1}</span><p>{step}</p></li>)}</ol>
    </section>

    <section className="clinic-final-cta community-final-cta">
      <h2>{content.finalTitle}</h2>
      <p>{content.finalText}</p>
      <SiteLink className="button button-primary" to="/book?service=community">{content.book}</SiteLink>
    </section>
  </main></Layout>;
}
