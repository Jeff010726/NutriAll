import { ArrowRight, CheckCircle2, MessageCircle, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useSearchParams } from "react-router-dom";
import { apiRequest } from "../api";
import { getAttribution, trackEvent } from "../analytics";
import { InsuranceLogos } from "../components/InsuranceLogos";
import { Layout } from "../components/Layout";
import { SiteLink } from "../components/SiteLink";

const availabilityOptions = [
  "8AM - 10AM", "10AM - 12PM", "12PM - 2PM", "2PM - 4PM",
  "4PM - 6PM", "6PM - 7PM", "7PM - 9PM",
];

const languageOptions = ["English", "Mandarin", "Cantonese", "Spanish", "No preference"];
const serviceLabels = {
  "medical-weight-loss": "Medical weight loss",
  "one-to-one": "1:1 weight-loss nutrition",
  glp1: "GLP-1 support",
  insurance: "Insurance benefit check",
  community: "Community and church program partnership",
  general: "General consultation",
};

const whatsappUrl = `${import.meta.env.BASE_URL}booking-whatsapp`;

export function BookPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const requestedService = searchParams.get("service") || "general";
  const serviceInterest = serviceLabels[requestedService] || serviceLabels.general;
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");
  const [started, setStarted] = useState(false);
  const [form, setForm] = useState({
    name: "", email: "", phone: "", age: "", preferredLanguage: "", availability: "",
    patientType: "", insuranceCompany: "", insuranceMemberId: "", dateOfBirth: "",
  });

  const updateField = (field) => (event) => setForm((current) => ({ ...current, [field]: event.target.value }));

  const submit = async (event) => {
    event.preventDefault();
    setStatus("submitting");
    setError("");
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
    const attribution = getAttribution();
    try {
      await apiRequest("/api/contact", {
        method: "POST",
        body: {
          ...form,
          sourcePage: `${window.location.pathname}${window.location.search}`,
          serviceInterest,
          timeZone,
          pageLanguage: document.documentElement.lang || "en",
          utmSource: attribution.utmSource,
          utmMedium: attribution.utmMedium,
          utmCampaign: attribution.utmCampaign,
        },
      });
      trackEvent("contact_submit", "booking_form", { service: requestedService });
      navigate("/booking-redirect");
    } catch {
      setStatus("error");
      setError(t("book.error"));
    }
  };

  return <Layout footerProps={{ note: "Insurance benefits are verified before care begins. Coverage and out-of-pocket cost vary by plan." }}><main className="booking-page-new">
    <section className="booking-hero-new">
      <div className="booking-hero-copy">
        <p className="eyebrow"><ShieldCheck size={17} aria-hidden="true" /> {t("book.badge")}</p>
        <h1>{t("book.title")}</h1>
        <p>{t("book.intro")}</p>
        <div className="booking-hero-highlights">
          <span><CheckCircle2 aria-hidden="true" /> {t("book.short")}</span>
          <span><CheckCircle2 aria-hidden="true" /> {t("book.noCommitment")}</span>
          <span><CheckCircle2 aria-hidden="true" /> {t("book.verification")}</span>
        </div>
        <a className="button booking-whatsapp" href={whatsappUrl}><MessageCircle size={19} aria-hidden="true" /> {t("book.whatsapp")}</a>
      </div>
      <div className="booking-hero-image" role="img" aria-label="Dietitian speaking with a client during a one-to-one nutrition consultation"><div><span>{t("book.starting")}</span><strong>{serviceInterest}</strong><small>{t("book.adjust")}</small></div></div>
    </section>

    <InsuranceLogos compact />

    <section className="booking-form-section" id="booking-form">
      <div className="booking-form-intro"><p className="eyebrow">{t("book.request")}</p><h2>{t("book.timeTitle")}</h2><p>{t("book.required")}</p></div>
      <form className="intake-form" onSubmit={submit} onFocus={() => { if (!started) { setStarted(true); trackEvent("form_start", "booking_form", { service: requestedService }); } }}>
        <div className="form-field full"><label htmlFor="booking-name">{t("book.name")}</label><input id="booking-name" type="text" value={form.name} onChange={updateField("name")} autoComplete="name" required /></div>
        <div className="form-field"><label htmlFor="booking-email">{t("book.email")}</label><input id="booking-email" type="email" value={form.email} onChange={updateField("email")} autoComplete="email" required placeholder="you@example.com" /></div>
        <div className="form-field"><label htmlFor="booking-phone">{t("book.phone")}</label><input id="booking-phone" type="tel" value={form.phone} onChange={updateField("phone")} autoComplete="tel" required placeholder="(000) 000-0000" /></div>
        <div className="form-field"><label htmlFor="booking-age">{t("book.age")}</label><input id="booking-age" type="number" min="1" max="120" value={form.age} onChange={updateField("age")} required /></div>
        <div className="form-field"><label htmlFor="booking-language">{t("book.preferred")}</label><select id="booking-language" value={form.preferredLanguage} onChange={updateField("preferredLanguage")} required><option value="">{t("book.selectLanguage")}</option>{languageOptions.map((option) => <option key={option}>{option}</option>)}</select></div>
        <fieldset className="patient-type-field">
          <legend>{t("book.patientQuestion")}</legend>
          <div className="patient-type-options">
            <label><input type="radio" name="patientType" value="new" checked={form.patientType === "new"} onChange={updateField("patientType")} required /><span>{t("book.newPatient")}</span></label>
            <label><input type="radio" name="patientType" value="returning" checked={form.patientType === "returning"} onChange={updateField("patientType")} required /><span>{t("book.returningPatient")}</span></label>
          </div>
        </fieldset>
        <div className="form-field full"><label htmlFor="booking-availability">{t("book.bestTime")}</label><select id="booking-availability" value={form.availability} onChange={updateField("availability")} required><option value="">{t("book.selectTime")}</option>{availabilityOptions.map((option) => <option key={option}>{option}</option>)}</select></div>

        <fieldset className="insurance-fields">
          <legend>{t("book.optionalInsurance")}</legend>
          <p>{t("book.insuranceHelp")}</p>
          <div className="insurance-fields-grid">
            <div className="form-field"><label htmlFor="booking-insurance">{t("book.company")}</label><input id="booking-insurance" type="text" value={form.insuranceCompany} onChange={updateField("insuranceCompany")} autoComplete="organization" placeholder="Aetna, UnitedHealthcare..." /></div>
            <div className="form-field"><label htmlFor="booking-member-id">{t("book.memberId")}</label><input id="booking-member-id" type="text" value={form.insuranceMemberId} onChange={updateField("insuranceMemberId")} /></div>
            <div className="form-field"><label htmlFor="booking-dob">{t("book.dob")}</label><input id="booking-dob" type="date" value={form.dateOfBirth} onChange={updateField("dateOfBirth")} autoComplete="bday" /></div>
          </div>
        </fieldset>

        {status === "error" && <p className="form-error" role="alert">{error}</p>}
        <button className="button button-primary intake-submit" type="submit" disabled={status === "submitting"}>{status === "submitting" ? t("book.submitting") : <>{t("book.submit")} <ArrowRight size={19} aria-hidden="true" /></>}</button>
        <p className="form-disclaimer">{t("book.disclaimer")} <SiteLink to="/privacy">{t("book.privacyLink")}</SiteLink></p>
      </form>
    </section>
  </main></Layout>;
}
