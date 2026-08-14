import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { pageTitles } from "../lib";
import { Footer } from "./Footer";
import { Header } from "./Header";
import { SiteLink } from "./SiteLink";
import { trackEvent } from "../analytics";
import { trackMetaPageView } from "../metaPixel";
import { useTranslation } from "react-i18next";

export function Layout({ children, footerProps, title }) {
  const { i18n, t } = useTranslation();
  const { pathname, hash } = useLocation();
  useEffect(() => {
    document.title = title || pageTitles[pathname] || "NutriAll Medical Weight Care";
    if (hash) {
      requestAnimationFrame(() => document.getElementById(decodeURIComponent(hash.slice(1)))?.scrollIntoView());
    } else {
      window.scrollTo({ top: 0, behavior: "auto" });
    }
  }, [hash, pathname, title]);

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

  return <><Header />{children}<Footer {...footerProps} /><SiteLink className="mobile-booking-bar" to="/book?service=general"><span>{t("insurance.badge")}</span><strong>{t("mobileCta")}</strong></SiteLink></>;
}
