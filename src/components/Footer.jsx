import { useTranslation } from "react-i18next";
import { asset } from "../lib";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { SiteLink } from "./SiteLink";

export function Footer({ note }) {
  const { t } = useTranslation();
  const links = [
    ["nav.oneToOne", "/one-to-one-weight-loss"], ["nav.glpCare", "/glp1-care"],
    ["nav.classes", "/diabetes-classes"], ["nav.pump", "/pump-training"],
    ["nav.cgm", "/cgm-training"], ["nav.insurance", "/insurance"],
    ["nav.about", "/about"], ["nav.providers", "/providers"],
  ];
  return <footer className="site-footer clinic-footer">
    <div className="clinic-footer-brand"><SiteLink className="brand footer-brand" to="/"><img src={asset("nutriall-logo.svg")} alt="NutriAll Wellness" /></SiteLink><p>{note || t("footer.note")}</p><LanguageSwitcher /></div>
    <nav aria-label="Footer">{links.map(([key, to]) => <SiteLink key={to} to={to}>{t(key)}</SiteLink>)}</nav>
    <p className="clinic-footer-legal">© {new Date().getFullYear()} {t("footer.copyright")}</p>
  </footer>;
}
