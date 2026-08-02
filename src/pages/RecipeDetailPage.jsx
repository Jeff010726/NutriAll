import { useParams } from "react-router-dom";
import { Layout } from "../components/Layout";
import { SiteLink } from "../components/SiteLink";
import { diabetesRecipes } from "../data";
import { asset } from "../lib";

const aliases = { "cottage-cheese-blueberries": "cottage-cheese-blueberries-hemp-seeds", "low-carb-tiramisu": "low-carb-easy-tiramisu", "turkey-meatball-wonton-soup": "turkey-meatball-wonton-soup-bok-choy-carrots" };

export function RecipeDetailPage() {
  const { slug } = useParams();
  const recipe = diabetesRecipes.find((item) => item.slug === (aliases[slug] || slug)) || diabetesRecipes[0];
  return <Layout title={`${recipe.title} | NutriAll Diabetes Care`} footerProps={{ note: "Educational nutrition content for diabetes care." }}><main className="recipe-detail-page">
    <section className="recipe-detail-hero"><div className="recipe-detail-copy"><p className="eyebrow">{recipe.category} / {recipe.date || "NutriAll recipe"}</p><h1>{recipe.title}</h1><p>{recipe.excerpt}</p><div className="detail-meta"><span>{recipe.prepTime || recipe.prep} prep</span><span>{recipe.cookTime || recipe.cook} cook</span><span>Serves {recipe.servings}</span></div></div><div className="recipe-detail-image"><img src={asset(recipe.image)} alt="" /></div></section>
    <section className="recipe-body-band"><div className="recipe-body-intro"><p className="eyebrow">Cook from the card</p><h2>Original NutriAll recipe, rebuilt for clearer reading.</h2><p>The full ingredient list, steps, nutrition notes, and diabetes-care context are kept together so the page feels like a proper recipe, not a scattered set of notes.</p></div></section>
    <section className="recipe-content-grid"><aside className="ingredients-panel"><p className="eyebrow">Ingredients</p><h2>What you need</h2><ul>{recipe.ingredients.map((item) => <li key={item}>{item}</li>)}</ul></aside><article className="instructions-panel"><p className="eyebrow">Instructions</p><h2>How to make it</h2><ol>{recipe.instructions.map((item, index) => <li key={item}><span>{index + 1}</span><p>{item}</p></li>)}</ol></article></section>
    <section className="recipe-support-grid"><article><p className="eyebrow">Diabetes note</p><h2>How this recipe fits</h2><p>{recipe.diabetesNote}</p><p>{recipe.carbAwareness}</p></article><article><p className="eyebrow">Per serving</p><h2>Nutrition</h2><div className="nutrition-pills">{recipe.nutrition.map((item) => <span key={item}>{item}</span>)}</div></article></section>
    <section className="original-card-section"><div><p className="eyebrow">Original recipe card</p><h2>Migrated from NutriAll&apos;s original recipe library.</h2><p>The structured recipe above follows the original NutriAll card, with extra diabetes-care context added for this standalone site.</p><SiteLink className="button button-primary" to="/recipes">Back to all recipes</SiteLink></div><img src={asset(recipe.originalCard)} alt={`${recipe.title} original recipe card`} /></section>
  </main></Layout>;
}
