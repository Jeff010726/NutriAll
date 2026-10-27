import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ArrowRight, Search } from "lucide-react";
import { Layout } from "../components/Layout";
import { SiteLink } from "../components/SiteLink";
import { recipeCopy } from "../recipeContent";
import "../recipes.css";

export function RecipesPage() {
  const { i18n } = useTranslation();
  const language = i18n.resolvedLanguage || "en";
  const copy = recipeCopy(language);
  const [recipes, setRecipes] = useState([]);
  const [status, setStatus] = useState("loading");
  const [query, setQuery] = useState("");
  const [tag, setTag] = useState("");
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/recipes?lng=${encodeURIComponent(language)}`, { signal: controller.signal }).then(async (response) => {
      if (!response.ok) throw new Error("Unavailable");
      return response.json();
    }).then((data) => { setRecipes(data.recipes); setStatus("ready"); }).catch(() => { if (!controller.signal.aborted) setStatus("error"); });
    return () => controller.abort();
  }, [language, retry]);
  const tags = useMemo(() => [...new Set(recipes.flatMap((recipe) => recipe.tags))].slice(0, 16), [recipes]);
  const activeTag = tags.includes(tag) ? tag : "";
  const visible = useMemo(() => recipes.filter((recipe) => (!activeTag || recipe.tags.includes(activeTag)) && [recipe.title, recipe.excerpt, ...recipe.ingredients].join(" ").toLocaleLowerCase().includes(query.toLocaleLowerCase())), [recipes, activeTag, query]);
  return <Layout title={`${copy.title} | NutriAll`} description={copy.intro}><main className="nr-library">
    <section className="nr-library-heading"><p className="eyebrow">{copy.title}</p><h1>{copy.heading}</h1><p>{copy.intro}</p></section>
    <section className="nr-library-content"><label className="nr-search"><Search size={20} /><input type="search" placeholder={copy.search} aria-label={copy.search} value={query} onChange={(event) => setQuery(event.target.value)} /></label>
      <div className="nr-filters"><button className={!activeTag ? "active" : ""} type="button" onClick={() => setTag("")}>{copy.all}</button>{tags.map((item) => <button key={item} type="button" className={activeTag === item ? "active" : ""} onClick={() => setTag(item)}>{item}</button>)}</div>
      {status === "loading" && <p role="status">{copy.loading}</p>}
      {status === "error" && <div role="alert"><p>{copy.error}</p><button type="button" onClick={() => setRetry((value) => value + 1)}>{copy.retry}</button></div>}
      {status === "ready" && <div className="nr-cards">{visible.map((recipe) => <SiteLink to={`/recipes/${recipe.slug}`} className="nr-card" key={recipe.id}><img src={recipe.image} alt={recipe.title} loading="lazy" /><div><p>{recipe.category}</p><h2>{recipe.title}</h2><span>{recipe.excerpt}</span><small>{copy.prep} {recipe.prepTime || "—"} · {copy.servings} {recipe.servings || "—"}<ArrowRight size={18} /></small></div></SiteLink>)}</div>}
      {status === "ready" && !visible.length && <p className="nr-empty">{copy.noResults}</p>}
    </section>
    <section className="clinic-final-cta"><h2>{copy.bookTitle}</h2><SiteLink className="button button-primary" to="/book">{copy.book}</SiteLink></section>
  </main></Layout>;
}
