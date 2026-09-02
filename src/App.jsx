import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AboutPage } from "./pages/AboutPage";
import { BookPage } from "./pages/BookPage";
import { BookingRedirectPage } from "./pages/BookingRedirectPage";
import { BookingWhatsAppPage } from "./pages/BookingWhatsAppPage";
import { HomePage } from "./pages/HomePage";
import { InsurancePage } from "./pages/InsurancePage";
import { Glp1CarePage } from "./pages/Glp1CarePage";
import { MedicalDirectorPage } from "./pages/MedicalDirectorPage";
import { MedicalWeightLossPage } from "./pages/MedicalWeightLossPage";
import { OneToOneWeightLossPage } from "./pages/OneToOneWeightLossPage";
import { CommunityProgramsPage } from "./pages/CommunityProgramsPage";
import { ConditionPage } from "./pages/ConditionPage";
import { CommunityEventsPage } from "./pages/CommunityEventsPage";
import { CommunityInquiryPage } from "./pages/CommunityInquiryPage";
import { CommunityInquiryThanksPage } from "./pages/CommunityInquiryThanksPage";
import { DiabetesEducationPage } from "./pages/DiabetesEducationPage";
import { PrivacyPage } from "./pages/PrivacyPage";
import { ServicesPage } from "./pages/ServicesPage";
import { TermsPage } from "./pages/TermsPage";

export default function App() {
  return <BrowserRouter basename={import.meta.env.BASE_URL}><Routes>
    <Route path="/" element={<HomePage />} />
    <Route path="/medical-weight-loss" element={<MedicalWeightLossPage />} />
    <Route path="/glp1-care" element={<Glp1CarePage />} />
    <Route path="/one-to-one-weight-loss" element={<OneToOneWeightLossPage />} />
    <Route path="/medical-director" element={<MedicalDirectorPage />} />
    <Route path="/community-programs" element={<CommunityProgramsPage />} />
    <Route path="/community-programs/inquiry" element={<CommunityInquiryPage />} />
    <Route path="/community-programs/thanks" element={<CommunityInquiryThanksPage />} />
    <Route path="/community-events" element={<CommunityEventsPage />} />
    <Route path="/services" element={<ServicesPage />} />
    <Route path="/diabetes-education" element={<DiabetesEducationPage />} />
    <Route path="/privacy" element={<PrivacyPage />} />
    <Route path="/terms" element={<TermsPage />} />
    <Route path="/conditions/:condition" element={<ConditionPage />} />
    <Route path="/coverage" element={<Navigate replace to="/insurance" />} />
    <Route path="/insurance" element={<InsurancePage />} />
    <Route path="/about" element={<AboutPage />} />
    <Route path="/book" element={<BookPage />} />
    <Route path="/booking-redirect" element={<BookingRedirectPage />} />
    <Route path="/booking-whatsapp" element={<BookingWhatsAppPage />} />
    <Route path="/booking-confirmation" element={<Navigate replace to="/booking-redirect" />} />
    <Route path="/index.html" element={<Navigate replace to="/" />} />
    <Route path="/insurance.html" element={<Navigate replace to="/insurance" />} />
    <Route path="/about.html" element={<Navigate replace to="/about" />} />
    <Route path="/book.html" element={<Navigate replace to="/book" />} />
    <Route path="*" element={<Navigate replace to="/" />} />
  </Routes></BrowserRouter>;
}
