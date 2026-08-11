import { MessageCircle } from "lucide-react";
import { useEffect } from "react";
import { trackEvent } from "../analytics";
import { Layout } from "../components/Layout";

const whatsappDirectUrl = import.meta.env.VITE_WHATSAPP_BOOKING_URL || "https://wa.me/16466395011?text=Hi%2C%20I%27d%20like%20to%20book%20a%20free%2015-minute%20consultation%20and%20check%20whether%20my%20insurance%20may%20cover%20care.";

export function BookingWhatsAppPage() {
  useEffect(() => {
    trackEvent("whatsapp_booking_click", "booking_whatsapp", { destination: "whatsapp" });
    const timer = window.setTimeout(() => window.location.replace(whatsappDirectUrl), 700);
    return () => window.clearTimeout(timer);
  }, []);

  return <Layout title="Opening WhatsApp | NutriAll"><main className="booking-confirmation-page">
    <section className="booking-confirmation-panel">
      <MessageCircle className="booking-confirmation-icon" aria-hidden="true" />
      <p className="eyebrow">One moment</p>
      <h1>Opening WhatsApp...</h1>
      <p>We are taking you to WhatsApp so you can ask about insurance coverage and request a free consultation.</p>
      <a className="button button-primary" href={whatsappDirectUrl}>Continue to WhatsApp</a>
    </section>
  </main></Layout>;
}
