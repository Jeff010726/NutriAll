import { ArrowRight } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { apiRequest } from "../api";
import { getAttribution, trackEvent } from "../analytics";
import { Layout } from "../components/Layout";
import { SiteLink } from "../components/SiteLink";
import { getExpansionContent } from "../siteExpansionContent";

const initialForm = { organization: "", organizationType: "", contactName: "", email: "", phone: "", audienceSize: "", audienceAge: "", language: "", topic: "", format: "", delivery: "", preferredDate: "", location: "", budget: "", notes: "", consent: false };

export function CommunityInquiryPage() {
  const { i18n } = useTranslation();
  const content = getExpansionContent(i18n.resolvedLanguage).inquiry;
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");
  const update = (field) => (event) => setForm((current) => ({ ...current, [field]: event.target.type === "checkbox" ? event.target.checked : event.target.value }));
  const select = (field, options) => <select value={form[field]} onChange={update(field)} required><option value="">-</option>{options.map((option) => <option value={option} key={option}>{option}</option>)}</select>;

  const submit = async (event) => {
    event.preventDefault();
    setStatus("submitting");
    setError("");
    try {
      const attribution = getAttribution();
      await apiRequest("/api/community-inquiry", { method: "POST", body: { ...form, pageLanguage: document.documentElement.lang || "en", sourcePage: window.location.pathname, timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || "", ...attribution } });
      trackEvent("community_inquiry_submit", "community_program_form");
      navigate("/community-programs/thanks");
    } catch {
      setStatus("error");
      setError(content.error);
    }
  };

  return <Layout title={`${content.title} | NutriAll`} description={content.intro}><main className="expansion-page community-inquiry-page">
    <section className="expansion-hero compact"><div><p className="eyebrow">{content.eyebrow}</p><h1>{content.title}</h1><p>{content.intro}</p></div></section>
    <section className="community-inquiry-shell">
      <form className="community-inquiry-form" onSubmit={submit}>
        <label className="wide">{content.fields.organization}<input value={form.organization} onChange={update("organization")} autoComplete="organization" required /></label>
        <label>{content.fields.organizationType}{select("organizationType", content.options.organizationType)}</label>
        <label>{content.fields.contactName}<input value={form.contactName} onChange={update("contactName")} autoComplete="name" required /></label>
        <label>{content.fields.email}<input type="email" value={form.email} onChange={update("email")} autoComplete="email" required /></label>
        <label>{content.fields.phone}<input type="tel" value={form.phone} onChange={update("phone")} autoComplete="tel" required /></label>
        <label>{content.fields.audienceSize}<input value={form.audienceSize} onChange={update("audienceSize")} inputMode="numeric" required /></label>
        <label>{content.fields.audienceAge}{select("audienceAge", content.options.audienceAge)}</label>
        <label>{content.fields.language}{select("language", content.options.language)}</label>
        <label>{content.fields.format}{select("format", content.options.format)}</label>
        <label>{content.fields.delivery}{select("delivery", content.options.delivery)}</label>
        <label>{content.fields.date}<input value={form.preferredDate} onChange={update("preferredDate")} required /></label>
        <label>{content.fields.location}<input value={form.location} onChange={update("location")} /></label>
        <label>{content.fields.budget}<input value={form.budget} onChange={update("budget")} /></label>
        <label className="wide">{content.fields.topic}<textarea value={form.topic} onChange={update("topic")} required /></label>
        <label className="wide">{content.fields.notes}<textarea value={form.notes} onChange={update("notes")} /></label>
        <label className="community-consent wide"><input type="checkbox" checked={form.consent} onChange={update("consent")} required /><span>{content.fields.consent}</span></label>
        <p className="form-disclaimer wide">{content.privacy} <SiteLink to="/privacy">{content.privacyLink}</SiteLink></p>
        {status === "error" && <p className="form-error wide" role="alert">{error}</p>}
        <button className="button button-primary wide" type="submit" disabled={status === "submitting"}>{status === "submitting" ? content.submitting : <>{content.submit} <ArrowRight size={18} aria-hidden="true" /></>}</button>
      </form>
    </section>
  </main></Layout>;
}
