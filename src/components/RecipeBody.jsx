import { Clock3, Printer, Users } from "lucide-react";
import { recipeCopy } from "../recipeContent";

export function RecipeBody({ recipe, language = "en", preview = false }) {
  const copy = recipeCopy(language);
  return <article className="nr-recipe">
    <header className="nr-detail-heading"><p className="eyebrow">{recipe.category}</p><h1>{recipe.title}</h1><p>{recipe.excerpt}</p>
      {recipe.contentLanguage === "en" && !language.startsWith("en") && <p className="nr-language-note">{copy.english}</p>}
      <div className="nr-meta"><span><Clock3 size={18} />{copy.prep}: {recipe.prepTime || "—"}</span><span>{copy.cook}: {recipe.cookTime || "—"}</span><span><Users size={18} />{copy.servings}: {recipe.servings || "—"}</span></div>
      {!preview && <button className="nr-print" type="button" onClick={() => window.print()}><Printer size={17} />{copy.print}</button>}
    </header>
    {recipe.image && <img className="nr-detail-cover" src={recipe.image} alt={recipe.title} />}
    <div className="nr-method"><section><h2>{copy.ingredients}</h2><ul>{recipe.ingredients.map((item, i) => <li key={i}>{item}</li>)}</ul></section><section><h2>{copy.instructions}</h2><ol>{recipe.instructions.map((item, i) => <li key={i}>{item}</li>)}</ol></section></div>
    {(recipe.nutrition.length > 0 || recipe.diabetesNote || recipe.carbAwareness) && <div className="nr-notes"><section><h2>{copy.note}</h2>{recipe.diabetesNote && <p>{recipe.diabetesNote}</p>}{recipe.carbAwareness && <p>{recipe.carbAwareness}</p>}</section><section><h2>{copy.nutrition}</h2><ul>{recipe.nutrition.map((item, i) => <li key={i}>{item}</li>)}</ul></section></div>}
    {recipe.originalCard && <details className="nr-original"><summary>{copy.original}</summary><img src={recipe.originalCard} alt={copy.original} loading="lazy" /></details>}
    <p className="nr-disclaimer">{copy.disclaimer}</p>
  </article>;
}
