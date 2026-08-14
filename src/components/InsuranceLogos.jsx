import { ShieldCheck } from "lucide-react";
import { asset } from "../lib";
import { SiteLink } from "./SiteLink";
import { useTranslation } from "react-i18next";

const insuranceLogos = [
  ["UnitedHealthcare", "insurance/insurance-partner-2.webp"],
  ["Aetna", "insurance/insurance-partner-3.webp"],
  ["Fidelis Care", "insurance/insurance-partner-4.webp"],
  ["1199SEIU Funds", "insurance/insurance-partner-5.webp"],
  ["Healthfirst", "insurance/healthfirst.webp"],
];

export function InsuranceLogos({ compact = false }) {
  const { t } = useTranslation();
  return <section className={`insurance-logo-band${compact ? " is-compact" : ""}`} aria-labelledby={compact ? undefined : "insurance-band-title"}>
    <div className="insurance-logo-copy">
      <span><ShieldCheck size={18} aria-hidden="true" /> {t("insurance.badge")}</span>
      {!compact && <><h2 id="insurance-band-title">{t("insurance.title")}</h2><p>{t("insurance.text")}</p></>}
    </div>
    <div className="insurance-logo-row" aria-label="Commonly accepted commercial insurance plans">
      {insuranceLogos.map(([name, file]) => <div className="insurance-logo-item" key={name}><img src={asset(file)} alt={name} /></div>)}
    </div>
    <div className="insurance-logo-action"><SiteLink to="/book?service=insurance">{t("insurance.action")} <span aria-hidden="true">-&gt;</span></SiteLink><small>{t("insurance.note")}</small></div>
  </section>;
}
