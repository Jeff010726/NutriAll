import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { SurveyApp } from "./SurveyApp";
import "./survey.css";

createRoot(document.getElementById("survey-root")).render(<StrictMode><SurveyApp /></StrictMode>);
