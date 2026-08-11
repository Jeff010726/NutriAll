import { ArrowRight, CheckCircle2, Mail, Phone } from "lucide-react";
import { useEffect } from "react";
import { trackEvent } from "../analytics";
import { Layout } from "../components/Layout";
import { SiteLink } from "../components/SiteLink";

export function BookingRedirectPage() {
  useEffect(() => {
    trackEvent("booking_click", "booking_form_success", { destination: "booking-redirect" });
  }, []);

  return <Layout title="Consultation Request Received | NutriAll"><main className="booking-confirmation-page">
    <section className="booking-confirmation-panel">
      <CheckCircle2 className="booking-confirmation-icon" aria-hidden="true" />
      <p className="eyebrow">Request received</p>
      <h1>We will be in touch shortly.</h1>
      <p>Thank you for contacting NutriAll. Our care team will review your request, check the insurance information you provided, and contact you about the next available consultation time.</p>
      <div className="booking-confirmation-steps">
        <div><Phone aria-hidden="true" /><span><strong>Expect a call</strong><small>We will use the phone number from your request.</small></span></div>
        <div><Mail aria-hidden="true" /><span><strong>Check your email</strong><small>We will also send next-step information when available.</small></span></div>
      </div>
      <SiteLink className="button button-primary" to="/">Return home <ArrowRight size={18} aria-hidden="true" /></SiteLink>
    </section>
  </main></Layout>;
}
