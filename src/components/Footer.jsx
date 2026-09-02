import { useTranslation } from "react-i18next";
import { asset } from "../lib";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { SiteLink } from "./SiteLink";

export function Footer({ note }) {
  const { t } = useTranslation();
  const links = [
    ["nav.allServices", "/services"],
    ["nav.oneToOne", "/one-to-one-weight-loss"], ["nav.glpCare", "/glp1-care"],
    ["nav.medical", "/medical-weight-loss"], ["nav.insurance", "/insurance"],
    ["nav.about", "/about"], ["nav.community", "/community-programs"],
    ["nav.events", "/community-events"], ["nav.diabetes", "/diabetes-education"],
    ["nav.privacy", "/privacy"], ["nav.terms", "/terms"], ["nav.book", "/book"],
  ];
  return <footer className="site-footer clinic-footer">
    <div className="clinic-footer-brand"><SiteLink className="brand footer-brand" to="/"><img src={asset("nutriall-logo.png")} alt="NutriAll Wellness" /></SiteLink><p>{note || t("footer.note")}</p><LanguageSwitcher /></div>
    <nav aria-label="Footer">{links.map(([key, to]) => <SiteLink key={to} to={to}>{t(key)}</SiteLink>)}</nav>
    <p className="clinic-footer-legal">© {new Date().getFullYear()} {t("footer.copyright")}</p>
  </footer>;
}
