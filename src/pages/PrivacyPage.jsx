import { useTranslation } from "react-i18next";
import { Layout } from "../components/Layout";
import { getExpansionContent } from "../siteExpansionContent";

export function PrivacyPage() {
  const { i18n } = useTranslation();
  const content = getExpansionContent(i18n.resolvedLanguage).privacy;
  return <Layout title={`${content.eyebrow} | NutriAll`} description={content.intro}><main className="policy-page"><header><p className="eyebrow">{content.eyebrow}</p><h1>{content.title}</h1><p>{content.intro}</p><small>{content.updated}</small></header><div>{content.sections.map(([title, text]) => <section key={title}><h2>{title}</h2><p>{text}</p></section>)}<p className="policy-contact">{content.contact}</p></div></main></Layout>;
}
