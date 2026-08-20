import { Check, ChevronDown, MessageCircle } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { asset } from "../lib";
import { SiteLink } from "./SiteLink";

const steps = [
  { title: "step1Title", text: "step1Text", scene: "intake" },
  { title: "step2Title", text: "step2Text", scene: "summary" },
  { title: "step3Title", text: "step3Text", scene: "support" },
];

function JourneyScene({ activeStep, t }) {
  const sceneNumber = activeStep + 1;
  return <div className={`care-journey-scene care-journey-scene-${steps[activeStep].scene}`} aria-live="polite" key={activeStep}>
    {activeStep === 0 && <>
      <div className="care-journey-profile">
        <img src={asset("team/xiaofang-tan-studio.jpg")} alt="" />
        <div><strong>Xiaofang Tan</strong><span>{t("home.journeyDietitianRole")}</span></div>
        <span className="care-journey-online"><i />{t("home.journeyAvailable")}</span>
        <div className="care-journey-specialties">
          {[1, 2, 3].map((item) => <span key={item}>{t(`home.journeyScene1Item${item}`)}</span>)}
        </div>
      </div>
      <div className="care-journey-intake-note">
        <span>{t("home.journeyScene1Label")}</span>
        <h3>{t("home.journeyScene1Title")}</h3>
        <p>{t("home.journeyScene1Note")}</p>
      </div>
    </>}

    {activeStep === 1 && <div className="care-journey-summary">
      <span>{t("home.journeyScene2Label")}</span>
      <h3>{t("home.journeyScene2Title")}</h3>
      <p>{t("home.step2Text")}</p>
      <div className="care-journey-summary-list">
        {[1, 2, 3].map((item) => <div key={item}><Check size={16} aria-hidden="true" /><strong>{t(`home.journeyScene2Item${item}`)}</strong></div>)}
      </div>
      <small>{t("home.journeyScene2Note")}</small>
    </div>}

    {activeStep === 2 && <div className="care-journey-phone">
      <div className="care-journey-phone-bar"><span>9:41</span><i /><i /><i /></div>
      <div className="care-journey-phone-header">
        <img src={asset("team/xiaofang-tan-studio.jpg")} alt="" />
        <div><strong>Xiaofang Tan</strong><span>{t("home.journeyScene3Label")}</span></div>
      </div>
      <div className="care-journey-phone-feed">
        <h3 className="care-journey-phone-date">{t("home.journeyScene3Title")}</h3>
        <img src={asset("generated/meal-planning-colorful.png")} alt="" />
        <p className="is-sent">{t("home.journeyScene3Item1")}</p>
        <p className="is-received">{t("home.journeyScene3Item2")}</p>
        <small>{t("home.journeyScene3Item3")}</small>
      </div>
    </div>}

    <div className="care-journey-note" aria-hidden="true"><MessageCircle size={17} /><span>{t(`home.journeyScene${sceneNumber}Note`)}</span></div>
  </div>;
}

export function CareJourney() {
  const { t } = useTranslation();
  const [activeStep, setActiveStep] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  return <section
    className={`care-journey${isPaused ? " is-paused" : ""}`}
    aria-labelledby="process-title"
    onMouseEnter={() => setIsPaused(true)}
    onMouseLeave={() => setIsPaused(false)}
    onFocusCapture={() => setIsPaused(true)}
    onBlurCapture={(event) => {
      if (!event.currentTarget.contains(event.relatedTarget)) setIsPaused(false);
    }}
  >
    <div className="care-journey-heading">
      <p className="eyebrow">{t("home.processEyebrow")}</p>
      <h2 id="process-title">{t("home.processTitle")}</h2>
      <p>{t("home.processIntro")}</p>
    </div>

    <div className="care-journey-layout">
      <JourneyScene activeStep={activeStep} t={t} />

      <div className="care-journey-steps">
        {steps.map(({ title, text }, index) => {
          const isActive = activeStep === index;
          return <article className={isActive ? "is-active" : ""} key={title}>
            <span
              className="care-journey-row-progress"
              aria-hidden="true"
              onAnimationEnd={isActive ? () => setActiveStep((index + 1) % steps.length) : undefined}
            />
            <button type="button" aria-expanded={isActive} onClick={() => setActiveStep(index)}>
              <strong>{t(`home.${title}`)}</strong>
              <ChevronDown size={20} aria-hidden="true" />
            </button>
            <div className="care-journey-answer">
              {isActive && <div>
                <p>{t(`home.${text}`)}</p>
                <SiteLink to="/book?service=one-to-one">{t("home.journeyAction")}</SiteLink>
              </div>}
            </div>
          </article>;
        })}
      </div>
    </div>
  </section>;
}
