import { useEffect, useState } from "react";
import { asset } from "../lib";
import { SiteLink } from "./SiteLink";

const menuContent = {
  program: {
    label: "Program",
    rows: [
      ["/program", "generated/assessment-stilllife.png", "Diabetes Management", "Assessment, meal planning, glucose education, and follow-up support."],
      ["/program#meal-planning", "generated/meal-planning-colorful.png", "Meal Planning", "Build meals around culture, schedule, and blood sugar goals."],
      ["/program#carb-management", "generated/carb-education-foods.png", "Carb Management", "Learn portions, pairings, and post-meal patterns."],
    ],
    articles: [["/program#monitoring", "Blood sugar monitoring", "Understand readings and food responses"], ["/program#heart-health", "Heart health support", "Nutrition for long-term risk reduction"]],
    all: ["/program", "View all program areas"],
  },
  support: {
    label: "Recipes",
    rows: [
      ["/recipes/dijon-salmon-spinach", "recipe-covers/dijon-salmon-spinach.webp", "Dijon Salmon with Spinach", "15 min prep / heart-healthy dinner"],
      ["/recipes/cottage-cheese-blueberries-hemp-seeds", "recipe-covers/cottage-cheese-blueberries.webp", "Cottage Cheese with Blueberries", "High-protein breakfast or snack"],
      ["/recipes/turkey-meatball-wonton-soup-bok-choy-carrots", "recipe-covers/turkey-meatball-wonton-soup.webp", "Turkey Meatball Wonton Soup", "Brothy dinner with bok choy"],
    ],
    articles: [["/recipes/chicken-salad-collard-wraps", "Chicken salad collard wraps", "Low-carb lunch"], ["/recipes/low-carb-easy-tiramisu", "Low-carb easy tiramisu", "Planned dessert"]],
    all: ["/recipes", "Browse all recipes"],
  },
  learn: {
    label: "Research",
    rows: [
      ["/research", "generated/behavior-education-cards.png", "Research Explained", "Public diabetes studies translated into plain language."],
      ["/research", "generated/diabetes-symptoms-awareness.png", "Diabetes Basics", "A1C, glucose patterns, symptoms, and daily care."],
      ["/research", "generated/glucose-device-modern.png", "Blood Sugar & A1C", "What studies suggest for food, movement, and monitoring."],
    ],
    articles: [["/research/walking-after-meals", "Walking after meals", "What it can mean for glucose"], ["/research/high-fiber-foods-a1c", "High-fiber foods and A1C", "Plain-English takeaway"]],
    all: ["/research", "View research library"],
  },
};

function MegaMenu({ name, active, onEnter }) {
  const menu = menuContent[name];
  return (
    <section className={`mega-menu${active ? " is-active" : ""}`} aria-label={`${menu.label} menu`} onMouseEnter={onEnter}>
      {menu.rows.map(([to, image, title, description], index) => (
        <SiteLink className={`mega-row${index === 0 ? " mega-row-feature" : ""}`} to={to} key={`${name}-${title}`}>
          <img src={asset(image)} alt="" />
          <span><strong>{title}</strong><small>{description}</small></span>
        </SiteLink>
      ))}
      <p className="mega-section-label">Featured {name === "support" ? "recipes" : name === "learn" ? "research" : "care"}</p>
      {menu.articles.map(([to, title, description]) => (
        <SiteLink className="mega-article" to={to} key={title}><strong>{title}</strong><small>{description}</small></SiteLink>
      ))}
      <SiteLink className="mega-all-link" to={menu.all[0]}>{menu.all[1]} <span>-&gt;</span></SiteLink>
    </section>
  );
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

  return (
    <header className={`site-header${scrolled ? " is-scrolled" : ""}${openMenu || mobileOpen ? " has-open-menu" : ""}`} onMouseLeave={() => setOpenMenu(null)}>
      <SiteLink className="announcement-bar" to="/insurance">Most clients pay $0 with insurance benefits -&gt;</SiteLink>
      <div className="header-inner">
        <button className="nav-toggle" type="button" aria-label={mobileOpen ? "Close menu" : "Open menu"} aria-expanded={mobileOpen} onClick={() => setMobileOpen((value) => !value)}><span></span><span></span></button>
        <SiteLink className="brand" to="/" aria-label="NutriAll Diabetes home" onClick={closeAll}>
          <img src={asset("nutriall-logo.svg")} alt="" /><span>Diabetes Care</span>
        </SiteLink>
        <nav className="site-nav" aria-label="Primary navigation">
          <span className="nav-highlight"></span>
          {Object.entries(menuContent).map(([name, menu]) => (
            <button className={`nav-link${openMenu === name ? " is-active" : ""}`} type="button" key={name} aria-expanded={openMenu === name} onMouseEnter={() => setOpenMenu(name)} onClick={() => setOpenMenu(openMenu === name ? null : name)}>{menu.label}</button>
          ))}
        </nav>
        <div className="header-actions"><SiteLink to="/book">Sign In</SiteLink><SiteLink className="get-started-link" to="/book">Book Now</SiteLink></div>
      </div>
      <div className={`mega-shell${openMenu ? " is-open" : ""}`}>
        {Object.keys(menuContent).map((name) => <MegaMenu key={name} name={name} active={openMenu === name} onEnter={() => setOpenMenu(name)} />)}
      </div>
      <nav className={`mobile-menu${mobileOpen ? " is-open" : ""}`} aria-label="Mobile navigation" onClick={closeAll}>
        <div className="mobile-section"><p>Program</p><SiteLink to="/program">Assessment</SiteLink><SiteLink to="/program#meal-planning">Meal planning</SiteLink><SiteLink to="/program#monitoring">Blood sugar monitoring</SiteLink></div>
        <div className="mobile-section"><p>Recipes</p><SiteLink to="/recipes">Recipe library</SiteLink><SiteLink to="/recipes/dijon-salmon-spinach">Dinner ideas</SiteLink><SiteLink to="/recipes/cottage-cheese-blueberries-hemp-seeds">Breakfast ideas</SiteLink></div>
        <div className="mobile-section"><p>Research</p><SiteLink to="/research">Research library</SiteLink><SiteLink to="/research/walking-after-meals">Walking after meals</SiteLink><SiteLink to="/research/high-fiber-foods-a1c">High-fiber foods</SiteLink></div>
        <SiteLink className="mobile-cta" to="/book">Book Now</SiteLink>
      </nav>
    </header>
  );
}
