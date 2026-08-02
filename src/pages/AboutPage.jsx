import { Layout } from "../components/Layout";
import { asset } from "../lib";

const values = [["01", "Clinical nutrition", "Care plans are led by registered dietitians and built around medical history, labs, medications, and realistic food access."], ["02", "Cultural fluency", "Meals can be adapted across cuisines instead of forcing generic diet rules that are hard to sustain."], ["03", "Insurance-aware access", "The team helps clients understand benefits and expected cost before care begins."]];

export function AboutPage() {
  return <Layout footerProps={{ note: "Team and About are combined here for a simpler diabetes-focused site structure." }}><main className="about-page">
    <section className="about-hero about-full-hero"><div><p className="eyebrow">About us</p><h1>Diabetes care from registered dietitians who understand food, culture, and daily life.</h1><p>NutriAll Diabetes Care is a dedicated diabetes nutrition program from NutriAll Wellness. Team information lives here with the About page so the site stays focused and easy to navigate.</p></div><img src={asset("nutriall-team.jpg")} alt="NutriAll Wellness team group photo" /></section>
    <section className="about-grid full-about-grid">{values.map(([number, title, text]) => <article key={number}><span>{number}</span><h2>{title}</h2><p>{text}</p></article>)}</section>
  </main></Layout>;
}
