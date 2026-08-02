import { asset } from "../lib";
import { SiteLink } from "./SiteLink";

const defaultLinks = [
  ["Program", "/program"],
  ["Recipes", "/recipes"],
  ["Research", "/research"],
  ["About", "/about"],
  ["Book now", "/book"],
];

export function Footer({ note = "A standalone diabetes nutrition management program from NutriAll Wellness.", links = defaultLinks }) {
  return (
    <footer className="site-footer">
      <div>
        <SiteLink className="brand footer-brand" to="/">
          <img src={asset("nutriall-logo.svg")} alt="" />
          <span>Diabetes Care</span>
        </SiteLink>
        <p>{note}</p>
      </div>
      <div className="footer-links">
        {links.map(([label, to]) => <SiteLink key={to} to={to}>{label}</SiteLink>)}
      </div>
    </footer>
  );
}
