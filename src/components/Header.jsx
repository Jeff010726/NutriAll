import { ChevronDown, Menu, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { asset } from "../lib";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { SiteLink } from "./SiteLink";

const groups = {
  weight: [
    ["/one-to-one-weight-loss", "nav.oneToOne", "1:1"],
    ["/glp1-care", "nav.glpCare", "GLP-1"],
    ["/medical-weight-loss", "nav.medical", "MD"],
  ],
  clinical: [
    ["/diabetes-classes", "nav.classes", "01"],
    ["/pump-training", "nav.pump", "02"],
    ["/cgm-training", "nav.cgm", "03"],
    ["/glp1-training", "nav.glpTraining", "04"],
    ["/providers", "nav.providers", "05"],
  ],
  resources: [
    ["/recipes", "nav.recipes", "01"],
    ["/research", "nav.research", "02"],
    ["/about", "nav.about", "03"],
  ],
};

function Dropdown({ name, open, close }) {
  const { t } = useTranslation();
  return <div className={`nav-dropdown nav-dropdown-${name}${open ? " is-open" : ""}`} aria-hidden={!open}>
    <div className="nav-dropdown-copy">
      <p>{t(`nav.${name}`)}</p>
      <span>{t(name === "weight" ? "nav.weightIntro" : name === "clinical" ? "nav.clinicalIntro" : "home.clinicalIntro")}</span>
    </div>
    <div className="nav-dropdown-links">
      {groups[name].map(([to, key, number]) => <SiteLink to={to} key={to} onClick={close} tabIndex={open ? 0 : -1}>
        <span>{number}</span><strong>{t(key)}</strong>
      </SiteLink>)}
    </div>
  </div>;
}

export function Header() {
  const { t } = useTranslation();
  const headerRef = useRef(null);
  const [openMenu, setOpenMenu] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  const closeAll = () => { setOpenMenu(null); setMobileOpen(false); };

  useEffect(() => {
    const closeOnEscape = (event) => { if (event.key === "Escape") closeAll(); };
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, []);

  useEffect(() => {
    document.body.classList.toggle("nav-open", mobileOpen);
    return () => document.body.classList.remove("nav-open");
  }, [mobileOpen]);

  const toggle = (name) => setOpenMenu((current) => current === name ? null : name);

  return <header className="site-header clinic-header" ref={headerRef}>
    <div className="header-inner clinic-header-inner">
      <SiteLink className="brand clinic-brand" to="/" aria-label="NutriAll Wellness home" onClick={closeAll}>
        <img src={asset("nutriall-logo.svg")} alt="NutriAll Wellness" />
      </SiteLink>

      <nav className="clinic-nav" aria-label="Primary navigation">
        {[["weight", "nav.weight"], ["clinical", "nav.clinical"], ["resources", "nav.resources"]].map(([name, key]) => <button type="button" className={openMenu === name ? "is-active" : ""} aria-expanded={openMenu === name} aria-controls={`menu-${name}`} onClick={() => toggle(name)} key={name}>
          {t(key)} <ChevronDown size={16} aria-hidden="true" />
        </button>)}
        <SiteLink to="/insurance" onClick={closeAll}>{t("nav.insurance")}</SiteLink>
        <SiteLink to="/about" onClick={closeAll}>{t("nav.team")}</SiteLink>
      </nav>

      <div className="clinic-header-actions">
        <LanguageSwitcher onChange={closeAll} />
        <SiteLink className="button button-primary header-book-button" to="/book" onClick={closeAll}>{t("nav.book")}</SiteLink>
      </div>

      <button className="clinic-menu-toggle" type="button" aria-label={t("nav.menu")} aria-expanded={mobileOpen} onClick={() => setMobileOpen((current) => !current)}>
        {mobileOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
      </button>
    </div>

    <div className={`clinic-dropdown-shell${openMenu ? " is-open" : ""}`}>
      {Object.keys(groups).map((name) => <div id={`menu-${name}`} key={name}><Dropdown name={name} open={openMenu === name} close={closeAll} /></div>)}
    </div>

    <nav className={`clinic-mobile-menu${mobileOpen ? " is-open" : ""}`} aria-label="Mobile navigation">
      {Object.entries(groups).map(([name, links]) => <section key={name}>
        <p>{t(`nav.${name}`)}</p>
        {links.map(([to, key]) => <SiteLink to={to} onClick={closeAll} key={to}>{t(key)}</SiteLink>)}
      </section>)}
      <section><p>{t("nav.team")}</p><SiteLink to="/about" onClick={closeAll}>{t("nav.about")}</SiteLink><SiteLink to="/insurance" onClick={closeAll}>{t("nav.insurance")}</SiteLink></section>
      <LanguageSwitcher onChange={closeAll} />
      <SiteLink className="button button-primary" to="/book" onClick={closeAll}>{t("nav.book")}</SiteLink>
    </nav>
  </header>;
}
