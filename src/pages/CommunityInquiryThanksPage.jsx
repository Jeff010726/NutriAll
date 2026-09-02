import { CheckCircle2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Layout } from "../components/Layout";
import { SiteLink } from "../components/SiteLink";
import { getExpansionContent } from "../siteExpansionContent";

export function CommunityInquiryThanksPage() {
  const { i18n } = useTranslation();
  const content = getExpansionContent(i18n.resolvedLanguage).inquiry;
  return <Layout title={`${content.thanksTitle} | NutriAll`}><main className="booking-confirmation-page"><section className="booking-confirmation-panel"><CheckCircle2 className="booking-confirmation-icon" aria-hidden="true" /><h1>{content.thanksTitle}</h1><p>{content.thanksText}</p><SiteLink className="button button-primary" to="/community-programs">{content.back}</SiteLink></section></main></Layout>;
}
