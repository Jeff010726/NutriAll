import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { asset, pageTitles } from "../lib";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { Footer } from "./Footer";
import { Header } from "./Header";
import { SiteLink } from "./SiteLink";
import { trackEvent } from "../analytics";
import { trackMetaPageView } from "../metaPixel";
import { useTranslation } from "react-i18next";

const defaultDescription = "Physician-led medical weight loss, GLP-1 care, and one-to-one nutrition support from NutriAll.";

export function Layout({ children, description = defaultDescription, footerProps, title, bookingOnly = false }) {
  const { i18n, t } = useTranslation();
  const { pathname, hash } = useLocation();
  useEffect(() => {
    const pageTitle = title || pageTitles[pathname] || "NutriAll Medical Weight Care";
    const canonicalUrl = `https://nutriallwellness.org${pathname === "/" ? "/" : pathname}`;
    document.title = pageTitle;
    document.querySelector('meta[name="description"]')?.setAttribute("content", description);
    document.querySelector('meta[property="og:title"]')?.setAttribute("content", pageTitle);
    document.querySelector('meta[property="og:description"]')?.setAttribute("content", description);
    document.querySelector('meta[property="og:url"]')?.setAttribute("content", canonicalUrl);
    document.querySelector('link[rel="canonical"]')?.setAttribute("href", canonicalUrl);
    if (hash) {
      requestAnimationFrame(() => document.getElementById(decodeURIComponent(hash.slice(1)))?.scrollIntoView());
    } else {
      window.scrollTo({ top: 0, behavior: "auto" });
    }
  }, [description, hash, pathname, title]);

  useEffect(() => {
    document.documentElement.lang = i18n.resolvedLanguage || "en";
  }, [i18n.resolvedLanguage]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      trackMetaPageView();
      trackEvent("page_view", pathname);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [pathname]);

  const hideMobileBookingBar = ["/book", "/booking-redirect", "/booking-whatsapp", "/community-programs/inquiry", "/community-programs/thanks"].includes(pathname.replace(/\/+$/, ""));
  if (bookingOnly) return <div className="booking-simple-shell"><header className="booking-simple-header"><SiteLink to="/" aria-label="NutriAll Wellness"><img src={asset("nutriall-logo.png")} alt="NutriAll Wellness" /></SiteLink><LanguageSwitcher /></header>{children}<footer className="booking-simple-footer"><span>© {new Date().getFullYear()} NutriAll Wellness</span><SiteLink to="/privacy">{t("nav.privacy")}</SiteLink><SiteLink to="/terms">{t("nav.terms")}</SiteLink></footer></div>;
  return <><Header />{children}<Footer {...footerProps} />{!hideMobileBookingBar && <SiteLink className="mobile-booking-bar" to="/book?service=general"><span>{t("insurance.badge")}</span><strong>{t("mobileCta")}</strong></SiteLink>}</>;
}
