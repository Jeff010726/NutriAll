import fs from "node:fs";
import path from "node:path";

const distDir = path.resolve("dist");
const indexPath = path.join(distDir, "index.html");

if (!fs.existsSync(indexPath)) process.exit(0);

const indexHtml = fs.readFileSync(indexPath);
fs.writeFileSync(path.join(distDir, "404.html"), indexHtml);

const routes = [
  "medical-weight-loss",
  "glp1-care",
  "one-to-one-weight-loss",
  "medical-director",
  "community-programs",
  "conditions/pcos",
  "conditions/thyroid-health",
  "conditions/digestive-health",
  "conditions/sports-nutrition",
  "conditions/menopause-nutrition",
  "conditions/heart-health",
  "conditions/pregnancy-postpartum",
  "conditions/eating-disorders",
  "conditions/celiac-disease",
  "conditions/kidney-health",
  "conditions/cancer-nutrition",
  "conditions/high-cholesterol",
  "conditions/food-allergies",
  "coverage",
  "insurance",
  "about",
  "book",
  "booking-redirect",
  "booking-whatsapp",
  "booking-confirmation",
];

for (const route of routes) {
  const routeDir = path.join(distDir, route);
  fs.mkdirSync(routeDir, { recursive: true });
  fs.writeFileSync(path.join(routeDir, "index.html"), indexHtml);
}
