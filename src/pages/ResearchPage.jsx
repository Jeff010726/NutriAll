import { Layout } from "../components/Layout";
import { ContentLibrary } from "../components/ContentLibrary";
import { diabetesResearch } from "../data";

const filters = [["All", "All"], ["Physical Activity", "Activity"], ["Carbohydrates", "Carbs"], ["Diet Patterns", "Diet patterns"], ["Blood Sugar & A1C", "A1C"], ["Sleep", "Sleep"]];

export function ResearchPage() {
  return <Layout footerProps={{ note: "Educational summaries are not a substitute for medical care." }}><main className="research-page"><section className="page-full-hero research-full-hero"><div><p className="eyebrow">Research</p><h1>Public diabetes research, translated into useful language.</h1><p>Short explanations of what studies suggest, what they do not prove, and how to talk about them with your care team.</p></div></section><section className="listing-section full-library-section"><ContentLibrary items={diabetesResearch} filters={filters} type="research" /></section></main></Layout>;
}
