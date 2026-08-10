import { ShieldCheck } from "lucide-react";
import { asset } from "../lib";
import { SiteLink } from "./SiteLink";

const insuranceLogos = [
  ["Medicare", "insurance/medicare.webp"],
  ["Medicaid", "insurance/insurance-partner-1.webp"],
  ["Aetna", "insurance/insurance-partner-2.webp"],
  ["UnitedHealthcare", "insurance/insurance-partner-3.webp"],
  ["Anthem Blue Cross", "insurance/insurance-partner-4.webp"],
  ["Cigna", "insurance/insurance-partner-5.webp"],
];

export function InsuranceLogos({ compact = false }) {
  return <section className={`insurance-logo-band${compact ? " is-compact" : ""}`} aria-labelledby={compact ? undefined : "insurance-band-title"}>
    <div className="insurance-logo-copy">
      <span><ShieldCheck size={18} aria-hidden="true" /> Insurance-friendly care</span>
      {!compact && <><h2 id="insurance-band-title">Your plan may cover nutrition visits.</h2><p>We work with many major insurance plans and verify your individual benefits before care begins.</p></>}
    </div>
    <div className="insurance-logo-row" aria-label="Commonly accepted insurance plans">
      {insuranceLogos.map(([name, file]) => <div className="insurance-logo-item" key={name}><img src={asset(file)} alt={name} /></div>)}
    </div>
    <div className="insurance-logo-action"><SiteLink to="/book?service=insurance">Check my benefits <span aria-hidden="true">-&gt;</span></SiteLink><small>Coverage and cost vary by plan and eligibility.</small></div>
  </section>;
}
