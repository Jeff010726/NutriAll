import { HeartHandshake, Scale, Stethoscope } from "lucide-react";
import { useTranslation } from "react-i18next";
import { DietitianCard } from "../components/DietitianCard";
import { Layout } from "../components/Layout";
import { SiteLink } from "../components/SiteLink";
import { asset } from "../lib";
import { dietitians } from "../teamData";

export function AboutPage() {
  const { t } = useTranslation();
  const values = [
    [Stethoscope, "value1", "value1Text"],
    [Scale, "value2", "value2Text"],
    [HeartHandshake, "value3", "value3Text"],
  ];

  return <Layout><main className="clinic-about">
    <section className="clinic-about-hero">
      <div><p className="eyebrow">{t("about.eyebrow")}</p><h1>{t("about.title")}</h1><p>{t("about.intro")}</p></div>
      <img src={asset("nutriall-team.jpg")} alt="Three NutriAll dietitians together" />
    </section>

    <section className="clinic-about-values" aria-labelledby="about-values-title">
      <h2 id="about-values-title">{t("about.valuesTitle")}</h2>
      <div>{values.map(([Icon, title, text]) => <article key={title}><Icon size={23} aria-hidden="true" /><h3>{t(`about.${title}`)}</h3><p>{t(`about.${text}`)}</p></article>)}</div>
    </section>

    <section className="clinic-dietitians all-dietitians" aria-labelledby="dietitian-team-title">
      <div className="clinic-dietitian-heading"><div><p className="eyebrow">{t("about.teamEyebrow")}</p><h2 id="dietitian-team-title">{t("about.teamTitle")}</h2></div><p>{t("about.teamText")}</p></div>
      <div className="dietitian-profile-grid">{dietitians.map((dietitian) => <DietitianCard key={dietitian.name} dietitian={dietitian} />)}</div>
    </section>

    <section className="clinic-director-note">
      <img src={asset("team/dr-leon-katz.jpg")} alt="Leon Katz, MD" />
      <div><p className="eyebrow">{t("about.director")}</p><h2>Leon Katz, MD</h2><p>{t("about.directorText")}</p><SiteLink to="/medical-director">{t("home.learn")}</SiteLink></div>
    </section>

    <section className="clinic-final-cta"><h2>{t("about.cta")}</h2><SiteLink className="button button-primary" to="/book">{t("nav.book")}</SiteLink></section>
  </main></Layout>;
}
