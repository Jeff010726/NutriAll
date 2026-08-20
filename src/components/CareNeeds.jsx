import { useTranslation } from "react-i18next";
import { SiteLink } from "./SiteLink";
import { guidePaths } from "../careGuides";

const guideKeys = {
  weight: "weight-loss",
  glp1: "glp1",
  pcos: "pcos",
  thyroid: "thyroid-health",
  digestive: "digestive-health",
  sports: "sports-nutrition",
  menopause: "menopause-nutrition",
  heart: "heart-health",
  pregnancy: "pregnancy-postpartum",
  eating: "eating-disorders",
  celiac: "celiac-disease",
  kidney: "kidney-health",
  cancer: "cancer-nutrition",
  cholesterol: "high-cholesterol",
  allergies: "food-allergies",
};

const rows = [
  [
    ["weight", "featured"], ["pcos", "medium"], ["thyroid", "large"], ["digestive", "medium"],
    ["sports", "small"], ["glp1", "featured"], ["menopause", "medium"],
  ],
  [
    ["heart", "medium"], ["pregnancy", "large"], ["glp1", "featured"], ["eating", "large"],
    ["weight", "featured"], ["celiac", "small"], ["kidney", "medium"],
  ],
  [
    ["thyroid", "medium"], ["pcos", "large"], ["weight", "featured"], ["cancer", "medium"],
    ["cholesterol", "large"], ["menopause", "medium"], ["glp1", "featured"], ["allergies", "medium"],
  ],
];

function NeedGroup({ items, duplicate, t }) {
  return <div className="care-needs-group" aria-hidden={duplicate || undefined} role={duplicate ? undefined : "list"}>
    {items.map(([key, size], index) => {
      const className = `care-needs-bubble is-${size} is-${key}`;
      const label = t(`home.needs.${key}`);
      if (duplicate) return <span className={className} key={`${key}-${index}`}>{label}</span>;
      return <SiteLink className={className} to={guidePaths[guideKeys[key]]} key={`${key}-${index}`} role="listitem">{label}</SiteLink>;
    })}
  </div>;
}

export function CareNeeds() {
  const { t } = useTranslation();

  return <section className="care-needs" aria-labelledby="care-needs-title">
    <div className="care-needs-heading">
      <p className="eyebrow">{t("home.pathsEyebrow")}</p>
      <h2 id="care-needs-title">{t("home.pathsTitle")}</h2>
      <p>{t("home.pathsIntro")}</p>
      <SiteLink className="button button-primary" to="/book?service=one-to-one">{t("home.needsAction")}</SiteLink>
    </div>

    <div className="care-needs-rails">
      {rows.map((items, rowIndex) => <div className={`care-needs-rail care-needs-rail-${rowIndex + 1}`} key={rowIndex}>
        <div className="care-needs-track">
          <NeedGroup items={items} t={t} />
          <NeedGroup duplicate items={items} t={t} />
          <NeedGroup duplicate items={items} t={t} />
          <NeedGroup duplicate items={items} t={t} />
        </div>
      </div>)}
    </div>
  </section>;
}
