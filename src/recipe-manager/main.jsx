import { createRoot } from "react-dom/client";
import { RecipeManager } from "./RecipeManager";
import "./manager.css";
import "../recipes.css";

createRoot(document.getElementById("recipe-manager-root")).render(<RecipeManager />);
