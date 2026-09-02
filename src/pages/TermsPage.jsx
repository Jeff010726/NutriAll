import { useTranslation } from "react-i18next";
import { Layout } from "../components/Layout";
import { getExpansionContent } from "../siteExpansionContent";

export function TermsPage() {
  const { i18n } = useTranslation();
  const content = getExpansionContent(i18n.resolvedLanguage).terms;
  return <Layout title={`${content.eyebrow} | NutriAll`}><main className="policy-page"><header><p className="eyebrow">{content.eyebrow}</p><h1>{content.title}</h1><small>{content.updated}</small></header><div>{content.sections.map(([title, text]) => <section key={title}><h2>{title}</h2><p>{text}</p></section>)}</div></main></Layout>;
}
