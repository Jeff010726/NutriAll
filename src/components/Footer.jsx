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

export function Footer({ note = "Physician-led medical weight care paired with practical, one-to-one nutrition support.", links = defaultLinks }) {
  return (
    <footer className="site-footer">
      <div>
        <SiteLink className="brand footer-brand" to="/">
          <img src={asset("nutriall-logo.svg")} alt="" />
          <span>Medical Weight Care</span>
        </SiteLink>
        <p>{note}</p>
      </div>
      <div className="footer-links">
        {links.map(([label, to]) => <SiteLink key={to} to={to}>{label}</SiteLink>)}
      </div>
    </footer>
  );
}
