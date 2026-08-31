const metaPixelId = import.meta.env.VITE_META_PIXEL_ID || "1809933399979917";

let initialized = false;

function loadPixelScript() {
  if (document.querySelector('script[src="https://connect.facebook.net/en_US/fbevents.js"]')) return;

  const script = document.createElement("script");
  script.async = true;
  script.src = "https://connect.facebook.net/en_US/fbevents.js";
  const firstScript = document.getElementsByTagName("script")[0];
  firstScript?.parentNode?.insertBefore(script, firstScript);
}

export function installMetaPixel() {
  if (!metaPixelId || initialized || typeof window === "undefined") return;

  if (!window.fbq) {
    const fbq = (...args) => {
      if (fbq.callMethod) fbq.callMethod(...args);
      else fbq.queue?.push(args);
    };
    window.fbq = fbq;
    window._fbq = fbq;
    fbq.push = fbq;
    fbq.loaded = true;
    fbq.version = "2.0";
    fbq.queue = [];
  }

  loadPixelScript();
  window.fbq("init", metaPixelId);
  initialized = true;
}

function track(eventName) {
  installMetaPixel();
  window.fbq?.("track", eventName);
}

function trackCustom(eventName) {
  installMetaPixel();
  window.fbq?.("trackCustom", eventName);
}

export function trackMetaPageView() {
  track("PageView");
}

export function trackMetaConversion(eventType, eventName = "") {
  if (eventType === "contact_submit") trackCustom("ContactFormSubmit");
  if (eventType === "member_register") trackCustom("MemberSignup");
  if (eventType === "booking_click" && eventName === "booking_form_success") trackCustom("ExternalLinkClick");
  if (eventType === "whatsapp_booking_click") trackCustom("WhatsAppOpen");
  if (eventType === "kalix_booking_click") trackCustom("KalixOpen");
}
