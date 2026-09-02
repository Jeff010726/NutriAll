import { ArrowRight, HeartPulse, Pill, Scale, ShieldCheck, Stethoscope, Users } from "lucide-react";
import { useTranslation } from "react-i18next";
import { InsuranceLogos } from "../components/InsuranceLogos";
import { Layout } from "../components/Layout";
import { SiteLink } from "../components/SiteLink";
import { CareJourney } from "../components/CareJourney";
import { CareNeeds } from "../components/CareNeeds";
import { HomeFaq } from "../components/HomeFaq";
import { CommunityGallery } from "../components/CommunityGallery";
import { asset } from "../lib";

const weightServices = [
  [Scale, "weightServices.oneToOne.title", "weightServices.oneToOne.summary", "/one-to-one-weight-loss"],
  [Pill, "weightServices.glpCare.title", "weightServices.glpCare.summary", "/glp1-care"],
  [HeartPulse, "weightServices.medical.title", "weightServices.medical.summary", "/medical-weight-loss"],
];

export function HomePage() {
  const { t } = useTranslation();
  return <Layout><main className="clinic-home">
    <section className="clinic-hero">
      <div className="clinic-hero-copy">
        <p className="eyebrow">{t("home.eyebrow")}</p>
        <h1>{t("home.title")}</h1>
        <p>{t("home.intro")}</p>
        <div className="clinic-hero-actions">
          <SiteLink className="button button-primary" to="/book?service=one-to-one">{t("home.primary")}</SiteLink>
        </div>
        <div className="clinic-language-trust"><Users size={19} aria-hidden="true" /><span>{t("home.trust")}</span></div>
      </div>
      <div className="clinic-hero-media"><img src={asset("generated/hero-diabetes-bright.png")} alt="Registered dietitian speaking with a patient" /></div>
    </section>

    <InsuranceLogos />

    <CareNeeds />

    <CareJourney />

    <section className="clinic-capabilities" aria-labelledby="capabilities-title">
      <div className="clinic-section-heading"><p className="eyebrow">{t("home.clinicalEyebrow")}</p><h2 id="capabilities-title">{t("home.clinicalTitle")}</h2><p>{t("home.clinicalIntro")}</p></div>
      <div className="clinic-capability-grid">{weightServices.map(([Icon, title, text, to]) => <SiteLink to={to} key={to}><span><Icon size={23} aria-hidden="true" /></span><h3>{t(title)}</h3><p>{t(text)}</p><b>{t("home.learn")} <ArrowRight size={16} aria-hidden="true" /></b></SiteLink>)}</div>
      <div className="clinic-capability-action"><SiteLink className="button button-secondary" to="/services">{t("home.allServices")} <ArrowRight size={17} aria-hidden="true" /></SiteLink></div>
    </section>

    <section className="clinic-team-preview">
      <img className="is-tan-photo" src={asset("team/xiaofang-tan-dark-studio.jpg")} alt="Xiaofang Tan, registered dietitian" />
      <div>
        <p className="eyebrow">{t("home.teamEyebrow")}</p>
        <h2>{t("home.teamTitle")}</h2>
        <p>{t("home.teamText")}</p>
        <SiteLink className="button button-secondary" to="/about">{t("home.teamLink")}</SiteLink>
        <aside><Stethoscope size={21} aria-hidden="true" /><div><strong>{t("home.directorTitle")}</strong><p>{t("home.directorText")}</p></div></aside>
      </div>
    </section>

    <section className="community-home-band">
      <div className="community-home-media"><img src={asset("community-gallery/church-diabetes-class.jpg")} alt={t("community.imageAlt")} /><span>{t("community.contractBadge")}</span></div>
      <div className="community-home-copy">
        <p className="eyebrow">{t("community.eyebrow")}</p>
        <h2>{t("community.homeTitle")}</h2>
        <p>{t("community.homeText")}</p>
        <div className="community-home-formats"><span>{t("community.homeFormat1")}</span><span>{t("community.homeFormat2")}</span><span>{t("community.homeFormat3")}</span></div>
        <div className="community-home-actions"><SiteLink className="button button-secondary" to="/community-programs">{t("community.homeAction")}</SiteLink><SiteLink className="button button-primary" to="/community-programs/inquiry">{t("community.book")}</SiteLink></div>
      </div>
    </section>

    <CommunityGallery />

    <HomeFaq />

    <section className="clinic-final-cta">
      <ShieldCheck size={31} aria-hidden="true" />
      <h2>{t("home.finalTitle")}</h2>
      <p>{t("home.finalText")}</p>
      <SiteLink className="button button-primary" to="/book?service=insurance">{t("home.finalButton")}</SiteLink>
    </section>
  </main></Layout>;
}
