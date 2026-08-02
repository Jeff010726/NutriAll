import { Layout } from "../components/Layout";
import { ContentLibrary } from "../components/ContentLibrary";
import { diabetesRecipes } from "../data";

const filters = [["All", "All"], ["High Protein", "High protein"], ["Lunch", "Lunch"], ["Dinner", "Dinner"], ["Low Carb", "Low carb"], ["Dessert", "Dessert"]];

export function RecipesPage() {
  return <Layout><main className="recipes-page"><section className="recipes-full-hero"><div className="recipes-hero-copy"><p className="eyebrow">Recipes</p><h1>Food ideas built for real diabetes care.</h1><p>Browse high-protein breakfasts, vegetable-forward dinners, lower-carb sides, and planned treats from NutriAll resources.</p></div></section><section className="listing-section recipes-library-section"><ContentLibrary items={diabetesRecipes} filters={filters} type="recipe" /></section></main></Layout>;
}
