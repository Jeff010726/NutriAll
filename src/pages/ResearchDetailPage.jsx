import { useParams } from "react-router-dom";
import { Layout } from "../components/Layout";
import { diabetesResearch } from "../data";

export function ResearchDetailPage() {
  const { slug } = useParams();
  const article = diabetesResearch.find((item) => item.slug === slug) || diabetesResearch[0];
  return <Layout title={`${article.title} | NutriAll`} footerProps={{ note: "Plain-English health research summaries from NutriAll." }}><main className="research-detail-page"><section className="page-full-hero research-full-hero research-detail-full-hero"><div><p className="eyebrow">{article.category} / {article.source} / {article.year}</p><h1>{article.title}</h1><p>{article.summary}</p></div></section><section className="detail-grid research-detail-grid"><article><p className="eyebrow">Plain-English takeaway</p><h2>What it means in real life</h2><p>{article.takeaway}</p></article><aside><h3>Key points</h3><ul>{article.findings.map((item) => <li key={item}>{item}</li>)}</ul></aside></section></main></Layout>;
}
