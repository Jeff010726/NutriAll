import { BadgeCheck, Stethoscope } from "lucide-react";
import { asset } from "../lib";

export function DietitianCard({ dietitian }) {
  return <article className="dietitian-profile">
    <img
      src={asset(dietitian.image)}
      alt={dietitian.imageAlt}
      style={{ objectPosition: dietitian.imagePosition }}
    />
    <div className="dietitian-profile-copy">
      <p className="dietitian-role">{dietitian.role}</p>
      <h3>{dietitian.name}</h3>
      <div className="dietitian-bio">{dietitian.bio.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</div>
      <div className="dietitian-details">
        {dietitian.details.map((detail, index) => <span key={detail}>
          {index === 0 ? <BadgeCheck size={17} aria-hidden="true" /> : <Stethoscope size={17} aria-hidden="true" />}
          {detail}
        </span>)}
      </div>
    </div>
  </article>;
}
