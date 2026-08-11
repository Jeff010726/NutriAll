import { ArrowRight, CheckCircle2, MessageCircle, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { apiRequest } from "../api";
import { getAttribution, trackEvent } from "../analytics";
import { InsuranceLogos } from "../components/InsuranceLogos";
import { Layout } from "../components/Layout";

const availabilityOptions = [
  "8AM - 10AM", "10AM - 12PM", "12PM - 2PM", "2PM - 4PM",
  "4PM - 6PM", "6PM - 7PM", "7PM - 9PM",
];

const languageOptions = ["English", "Mandarin", "Cantonese", "Spanish", "No preference"];
const serviceLabels = {
  "medical-weight-loss": "Medical weight loss",
  "one-to-one": "1:1 weight-loss nutrition",
  glp1: "GLP-1 support",
  diabetes: "Diabetes nutrition care",
  insurance: "Insurance benefit check",
  general: "General consultation",
};

const whatsappUrl = `${import.meta.env.BASE_URL}booking-whatsapp`;

export function BookPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const requestedService = searchParams.get("service") || "general";
  const serviceInterest = serviceLabels[requestedService] || serviceLabels.general;
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");
  const [started, setStarted] = useState(false);
  const [form, setForm] = useState({
    name: "", email: "", phone: "", age: "", preferredLanguage: "", availability: "",
    insuranceCompany: "", insuranceMemberId: "", dateOfBirth: "",
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
      setError("We could not submit your request. Please try again or contact us on WhatsApp.");
    }
  };

  return <Layout footerProps={{ note: "Insurance benefits are verified before care begins. Coverage and out-of-pocket cost vary by plan." }}><main className="booking-page-new">
    <section className="booking-hero-new">
      <div className="booking-hero-copy">
        <p className="eyebrow"><ShieldCheck size={17} aria-hidden="true" /> Free 15-minute consultation</p>
        <h1>Start with a quick insurance and care check.</h1>
        <p>Tell us when to reach you. We will verify your benefits, answer your first questions, and help identify the right NutriAll service.</p>
        <div className="booking-hero-highlights">
          <span><CheckCircle2 aria-hidden="true" /> One short form</span>
          <span><CheckCircle2 aria-hidden="true" /> No commitment</span>
          <span><CheckCircle2 aria-hidden="true" /> Insurance verification</span>
        </div>
        <a className="button booking-whatsapp" href={whatsappUrl}><MessageCircle size={19} aria-hidden="true" /> Message us on WhatsApp</a>
      </div>
      <div className="booking-hero-image" role="img" aria-label="Dietitian speaking with a client during a one-to-one nutrition consultation"><div><span>Your starting point</span><strong>{serviceInterest}</strong><small>We can adjust this when we speak.</small></div></div>
    </section>

    <InsuranceLogos compact />

    <section className="booking-form-section" id="booking-form">
      <div className="booking-form-intro"><p className="eyebrow">Request a call</p><h2>Choose a time that works for you.</h2><p>Required fields help us contact you. Insurance details are optional and can help us prepare before the call.</p></div>
      <form className="intake-form" onSubmit={submit} onFocus={() => { if (!started) { setStarted(true); trackEvent("form_start", "booking_form", { service: requestedService }); } }}>
        <div className="form-field full"><label htmlFor="booking-name">Full name</label><input id="booking-name" type="text" value={form.name} onChange={updateField("name")} autoComplete="name" required placeholder="Your full name" /></div>
        <div className="form-field"><label htmlFor="booking-email">Email</label><input id="booking-email" type="email" value={form.email} onChange={updateField("email")} autoComplete="email" required placeholder="you@example.com" /></div>
        <div className="form-field"><label htmlFor="booking-phone">Phone</label><input id="booking-phone" type="tel" value={form.phone} onChange={updateField("phone")} autoComplete="tel" required placeholder="(000) 000-0000" /></div>
        <div className="form-field"><label htmlFor="booking-age">Age</label><input id="booking-age" type="number" min="1" max="120" value={form.age} onChange={updateField("age")} required placeholder="Age" /></div>
        <div className="form-field"><label htmlFor="booking-language">Preferred language</label><select id="booking-language" value={form.preferredLanguage} onChange={updateField("preferredLanguage")} required><option value="">Select a language</option>{languageOptions.map((option) => <option key={option}>{option}</option>)}</select></div>
        <div className="form-field full"><label htmlFor="booking-availability">Best time to reach you</label><select id="booking-availability" value={form.availability} onChange={updateField("availability")} required><option value="">Select a time window</option>{availabilityOptions.map((option) => <option key={option}>{option}</option>)}</select></div>

        <fieldset className="insurance-fields">
          <legend>Optional insurance information</legend>
          <p>Share these details if you would like our team to begin checking benefits before we call.</p>
          <div className="insurance-fields-grid">
            <div className="form-field"><label htmlFor="booking-insurance">Insurance company</label><input id="booking-insurance" type="text" value={form.insuranceCompany} onChange={updateField("insuranceCompany")} autoComplete="organization" placeholder="Aetna, UnitedHealthcare, Cigna..." /></div>
            <div className="form-field"><label htmlFor="booking-member-id">Member ID</label><input id="booking-member-id" type="text" value={form.insuranceMemberId} onChange={updateField("insuranceMemberId")} placeholder="Member ID on your card" /></div>
            <div className="form-field"><label htmlFor="booking-dob">Date of birth</label><input id="booking-dob" type="date" value={form.dateOfBirth} onChange={updateField("dateOfBirth")} autoComplete="bday" /></div>
          </div>
        </fieldset>

        {status === "error" && <p className="form-error" role="alert">{error}</p>}
        <button className="button button-primary intake-submit" type="submit" disabled={status === "submitting"}>{status === "submitting" ? "Submitting..." : <>Request my free consultation <ArrowRight size={19} aria-hidden="true" /></>}</button>
        <p className="form-disclaimer">By submitting, you authorize NutriAll to contact you about this request. Do not use this form for urgent medical concerns.</p>
      </form>
    </section>
  </main></Layout>;
}
