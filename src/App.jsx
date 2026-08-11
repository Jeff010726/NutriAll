import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { AboutPage } from "./pages/AboutPage";
import { BookPage } from "./pages/BookPage";
import { BookingRedirectPage } from "./pages/BookingRedirectPage";
import { HomePage } from "./pages/HomePage";
import { InsurancePage } from "./pages/InsurancePage";
import { Glp1CarePage } from "./pages/Glp1CarePage";
import { MedicalDirectorPage } from "./pages/MedicalDirectorPage";
import { MedicalWeightLossPage } from "./pages/MedicalWeightLossPage";
import { OneToOneWeightLossPage } from "./pages/OneToOneWeightLossPage";
import { ProgramPage } from "./pages/ProgramPage";
import { RecipeDetailPage } from "./pages/RecipeDetailPage";
import { RecipesPage } from "./pages/RecipesPage";
import { ResearchDetailPage } from "./pages/ResearchDetailPage";
import { ResearchPage } from "./pages/ResearchPage";

function LegacyDetailRedirect({ type }) {
  const { search } = useLocation();
  const slug = new URLSearchParams(search).get("slug") || "";
  return <Navigate replace to={`/${type}/${slug}`} />;
}

export default function App() {
  return <BrowserRouter basename={import.meta.env.BASE_URL}><Routes>
    <Route path="/" element={<HomePage />} />
    <Route path="/medical-weight-loss" element={<MedicalWeightLossPage />} />
    <Route path="/glp1-care" element={<Glp1CarePage />} />
    <Route path="/one-to-one-weight-loss" element={<OneToOneWeightLossPage />} />
    <Route path="/medical-director" element={<MedicalDirectorPage />} />
    <Route path="/diabetes-care" element={<ProgramPage />} />
    <Route path="/program" element={<Navigate replace to="/diabetes-care" />} />
    <Route path="/insurance" element={<InsurancePage />} />
    <Route path="/recipes" element={<RecipesPage />} />
    <Route path="/recipes/:slug" element={<RecipeDetailPage />} />
    <Route path="/research" element={<ResearchPage />} />
    <Route path="/research/:slug" element={<ResearchDetailPage />} />
    <Route path="/about" element={<AboutPage />} />
    <Route path="/book" element={<BookPage />} />
    <Route path="/booking-redirect" element={<BookingRedirectPage />} />
    <Route path="/booking-confirmation" element={<Navigate replace to="/booking-redirect" />} />
    <Route path="/index.html" element={<Navigate replace to="/" />} />
    <Route path="/program.html" element={<Navigate replace to="/diabetes-care" />} />
    <Route path="/insurance.html" element={<Navigate replace to="/insurance" />} />
    <Route path="/recipes.html" element={<Navigate replace to="/recipes" />} />
    <Route path="/recipe-detail.html" element={<LegacyDetailRedirect type="recipes" />} />
    <Route path="/research.html" element={<Navigate replace to="/research" />} />
    <Route path="/research-detail.html" element={<LegacyDetailRedirect type="research" />} />
    <Route path="/about.html" element={<Navigate replace to="/about" />} />
    <Route path="/book.html" element={<Navigate replace to="/book" />} />
    <Route path="*" element={<Navigate replace to="/" />} />
  </Routes></BrowserRouter>;
}
