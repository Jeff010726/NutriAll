import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Layout } from "../components/Layout";
import { SiteLink } from "../components/SiteLink";
import { RecipeBody } from "../components/RecipeBody";
import { recipeCopy } from "../recipeContent";
import "../recipes.css";

export function RecipeDetailPage() {
  const { slug } = useParams();
  const { i18n } = useTranslation();
  const language = i18n.resolvedLanguage || "en";
  const copy = recipeCopy(language);
  const [state, setState] = useState({ slug: "", recipe: null, status: "loading" });
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/recipes/${encodeURIComponent(slug)}?lng=${encodeURIComponent(language)}`, { signal: controller.signal }).then(async (response) => {
      if (response.status === 404) return { recipe: null, status: "missing" };
      if (!response.ok) throw new Error("Unavailable");
      return { ...(await response.json()), status: "ready" };
    }).then((data) => setState({ ...data, slug })).catch(() => { if (!controller.signal.aborted) setState({ slug, recipe: null, status: "error" }); });
    return () => controller.abort();
  }, [slug, language, retry]);
  const active = state.slug === slug ? state : { recipe: null, status: "loading" };
  return <Layout title={`${active.recipe?.title || copy.title} | NutriAll`} description={active.recipe?.excerpt || copy.intro}><main className="nr-detail"><SiteLink className="nr-back" to="/recipes">← {copy.back}</SiteLink>
    {active.recipe && <RecipeBody recipe={active.recipe} language={language} />}
    {active.status === "loading" && <p role="status">{copy.loading}</p>}
    {active.status === "missing" && <h1>{copy.missing}</h1>}
    {active.status === "error" && <div role="alert"><p>{copy.error}</p><button type="button" onClick={() => setRetry((value) => value + 1)}>{copy.retry}</button></div>}
    {active.recipe && <section className="nr-booking"><h2>{copy.bookTitle}</h2><SiteLink className="button button-primary" to="/book">{copy.book}</SiteLink></section>}
  </main></Layout>;
}
