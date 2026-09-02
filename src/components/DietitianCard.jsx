import { BadgeCheck, Stethoscope } from "lucide-react";
import { asset } from "../lib";
import { useTranslation } from "react-i18next";
import { localizeDietitian } from "../teamData";

export function DietitianCard({ dietitian }) {
  const { t, i18n } = useTranslation();
  const profile = localizeDietitian(dietitian, i18n.resolvedLanguage);
  return <article className="dietitian-profile">
    <img
      src={asset(profile.image)}
      alt={profile.imageAlt}
      style={{ objectPosition: profile.imagePosition }}
    />
    <div className="dietitian-profile-copy">
      <p className="dietitian-role">{profile.role}</p>
      <h3>{profile.name}</h3>
      <div className="dietitian-details">
        {profile.details.map((detail, index) => <span key={detail}>
          {index === 0 ? <BadgeCheck size={17} aria-hidden="true" /> : <Stethoscope size={17} aria-hidden="true" />}
          {detail}
        </span>)}
      </div>
      <details className="dietitian-bio"><summary>{t("about.readProfile")}</summary>{profile.bio.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</details>
    </div>
  </article>;
}
