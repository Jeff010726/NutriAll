import { useEffect, useState } from "react";
import { asset } from "../lib";
import { SiteLink } from "./SiteLink";

const menuContent = {
  programs: {
    label: "Programs",
    rows: [
      ["/medical-weight-loss", "generated/weight-management-care.png", "Medical Weight Loss", "A physician-led plan with nutrition and ongoing follow-up."],
      ["/one-to-one-weight-loss", "generated/weight-habits-lifestyle.png", "1:1 Weight Loss", "Personal nutrition care for sustainable fat loss."],
      ["/glp1-care", "generated/glp1-training.webp", "GLP-1 Care", "Medication education, side-effect planning, and nutrition support."],
    ],
    articles: [["/diabetes-care", "Diabetes care", "A focused nutrition program"], ["/insurance", "Cost and insurance", "Understand each part of care"]],
    all: ["/medical-weight-loss", "Explore medical weight care"],
  },
  team: {
    label: "Medical Team",
    rows: [
      ["/medical-director", "team/dr-leon-katz.jpg", "Dr. Leon Katz", "Medical Director and obesity medicine specialist."],
      ["/about", "nutriall-team.jpg", "Registered Dietitians", "Practical, culturally responsive nutrition counseling."],
      ["/about", "generated/nutrition-education-care.png", "One coordinated team", "Medical decisions and daily habits connected through follow-up."],
    ],
    articles: [["/medical-director", "Medical oversight", "Evaluation, risk review, and prescribing"], ["/one-to-one-weight-loss", "Nutrition partnership", "Food strategy and accountability"]],
    all: ["/about", "Meet the NutriAll team"],
  },
  resources: {
    label: "Resources",
    rows: [
      ["/recipes", "mosaic/recipes.jpg", "Recipes", "Protein- and fiber-forward ideas for real routines."],
      ["/research", "generated/behavior-education-cards.png", "Research Explained", "Health studies translated into useful next steps."],
      ["/diabetes-care", "generated/glucose-device-modern.png", "Diabetes Care", "Glucose, meal planning, and heart-health support."],
    ],
    articles: [["/research/walking-after-meals", "Walking after meals", "A practical research takeaway"], ["/recipes/dijon-salmon-spinach", "Dijon salmon with spinach", "A repeatable weeknight meal"]],
    all: ["/research", "Browse the resource library"],
  },
};

function MegaMenu({ name, active, onEnter }) {
  const menu = menuContent[name];
  return <section className={`mega-menu${active ? " is-active" : ""}`} aria-label={`${menu.label} menu`} onMouseEnter={onEnter}>
    {menu.rows.map(([to, image, title, description], index) => <SiteLink className={`mega-row${index === 0 ? " mega-row-feature" : ""}`} to={to} key={`${name}-${title}`}>
      <img src={asset(image)} alt="" /><span><strong>{title}</strong><small>{description}</small></span>
    </SiteLink>)}
    <p className="mega-section-label">More from NutriAll</p>
    {menu.articles.map(([to, title, description]) => <SiteLink className="mega-article" to={to} key={title}><strong>{title}</strong><small>{description}</small></SiteLink>)}
    <SiteLink className="mega-all-link" to={menu.all[0]}>{menu.all[1]} <span>-&gt;</span></SiteLink>
  </section>;
}

export function Header() {
  const [openMenu, setOpenMenu] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.classList.toggle("nav-open", mobileOpen);
    return () => document.body.classList.remove("nav-open");
  }, [mobileOpen]);

  const closeAll = () => { setOpenMenu(null); setMobileOpen(false); };

  return <header className={`site-header${scrolled ? " is-scrolled" : ""}${openMenu || mobileOpen ? " has-open-menu" : ""}`} onMouseLeave={() => setOpenMenu(null)}>
    <SiteLink className="announcement-bar" to="/medical-weight-loss">Physician-led weight care + 1:1 nutrition support -&gt;</SiteLink>
    <div className="header-inner">
      <button className="nav-toggle" type="button" aria-label={mobileOpen ? "Close menu" : "Open menu"} aria-expanded={mobileOpen} onClick={() => setMobileOpen((value) => !value)}><span></span><span></span></button>
      <SiteLink className="brand" to="/" aria-label="NutriAll Medical Weight Care home" onClick={closeAll}><img src={asset("nutriall-logo.svg")} alt="" /><span>Medical Weight Care</span></SiteLink>
      <nav className="site-nav" aria-label="Primary navigation">
        <span className="nav-highlight"></span>
        {Object.entries(menuContent).map(([name, menu]) => <button className={`nav-link${openMenu === name ? " is-active" : ""}`} type="button" key={name} aria-expanded={openMenu === name} onMouseEnter={() => setOpenMenu(name)} onClick={() => setOpenMenu(openMenu === name ? null : name)}>{menu.label}</button>)}
      </nav>
      <div className="header-actions"><SiteLink to="/insurance">Cost & Insurance</SiteLink><SiteLink className="get-started-link" to="/book">Get Started</SiteLink></div>
    </div>
    <div className={`mega-shell${openMenu ? " is-open" : ""}`}>{Object.keys(menuContent).map((name) => <MegaMenu key={name} name={name} active={openMenu === name} onEnter={() => setOpenMenu(name)} />)}</div>
    <nav className={`mobile-menu${mobileOpen ? " is-open" : ""}`} aria-label="Mobile navigation" onClick={closeAll}>
      <div className="mobile-section"><p>Programs</p><SiteLink to="/medical-weight-loss">Medical weight loss</SiteLink><SiteLink to="/one-to-one-weight-loss">1:1 weight loss</SiteLink><SiteLink to="/glp1-care">GLP-1 care</SiteLink><SiteLink to="/diabetes-care">Diabetes care</SiteLink></div>
      <div className="mobile-section"><p>Team</p><SiteLink to="/medical-director">Medical Director</SiteLink><SiteLink to="/about">Registered dietitians</SiteLink></div>
      <div className="mobile-section"><p>Resources</p><SiteLink to="/recipes">Recipes</SiteLink><SiteLink to="/research">Research explained</SiteLink><SiteLink to="/insurance">Cost & insurance</SiteLink></div>
      <SiteLink className="mobile-cta" to="/book">Get Started</SiteLink>
    </nav>
  </header>;
}
