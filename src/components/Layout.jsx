import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { pageTitles } from "../lib";
import { Footer } from "./Footer";
import { Header } from "./Header";

export function Layout({ children, footerProps, title }) {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    document.title = title || pageTitles[pathname] || "NutriAll Medical Weight Care";
    if (hash) {
      requestAnimationFrame(() => document.getElementById(decodeURIComponent(hash.slice(1)))?.scrollIntoView());
    } else {
      window.scrollTo({ top: 0, behavior: "auto" });
    }
  }, [hash, pathname, title]);

  return <><Header />{children}<Footer {...footerProps} /></>;
}
