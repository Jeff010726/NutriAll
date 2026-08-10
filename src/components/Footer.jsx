import { asset } from "../lib";
import { SiteLink } from "./SiteLink";

const defaultLinks = [
  ["Medical weight loss", "/medical-weight-loss"],
  ["GLP-1 care", "/glp1-care"],
  ["1:1 nutrition", "/one-to-one-weight-loss"],
  ["Medical Director", "/medical-director"],
  ["Recipes", "/recipes"],
  ["About", "/about"],
];

export function Footer({ note = "One-to-one weight-loss nutrition, GLP-1 support, and medical oversight when needed.", links = defaultLinks }) {
  return (
    <footer className="site-footer">
      <div>
        <SiteLink className="brand footer-brand" to="/">
          <img src={asset("nutriall-logo.svg")} alt="" />
          <span>Weight &amp; Nutrition Care</span>
        </SiteLink>
        <p>{note}</p>
      </div>
      <div className="footer-links">
        {links.map(([label, to]) => <SiteLink key={to} to={to}>{label}</SiteLink>)}
      </div>
    </footer>
  );
}
