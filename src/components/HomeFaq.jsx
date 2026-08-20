import { ArrowRight, ChevronDown } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { SiteLink } from "./SiteLink";

const faqItems = [1, 2, 3, 4, 5];
const faqBookingServices = { 1: "general", 2: "insurance", 3: "general", 4: "general", 5: "glp1" };

export function HomeFaq() {
  const { t } = useTranslation();
  const [openItem, setOpenItem] = useState(1);

  return <section className="home-faq" aria-labelledby="home-faq-title">
    <div className="home-faq-heading">
      <p className="eyebrow">{t("faq.eyebrow")}</p>
      <h2 id="home-faq-title">{t("faq.title")}</h2>
      <p>{t("faq.intro")}</p>
    </div>

    <div className="home-faq-list">
      {faqItems.map((item) => {
        const isOpen = openItem === item;
        const buttonId = `home-faq-button-${item}`;
        const answerId = `home-faq-answer-${item}`;

        return <article className={`home-faq-item${isOpen ? " is-open" : ""}`} key={item}>
          <h3>
            <button
              id={buttonId}
              type="button"
              aria-controls={answerId}
              aria-expanded={isOpen}
              onClick={() => setOpenItem(isOpen ? null : item)}
            >
              <span>{t(`faq.q${item}`)}</span>
              <i aria-hidden="true"><ChevronDown size={20} /></i>
            </button>
          </h3>
          <div
            className="home-faq-answer"
            id={answerId}
            role="region"
            aria-labelledby={buttonId}
            aria-hidden={!isOpen}
          >
            <div>
              <p>{t(`faq.a${item}`)}</p>
              <SiteLink className="home-faq-cta" to={`/book?service=${faqBookingServices[item]}`}>
                {t(`faq.cta${item}`)} <ArrowRight size={17} aria-hidden="true" />
              </SiteLink>
            </div>
          </div>
        </article>;
      })}
    </div>
  </section>;
}
