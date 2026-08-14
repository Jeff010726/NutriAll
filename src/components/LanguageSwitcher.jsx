import { Languages } from "lucide-react";
import { useTranslation } from "react-i18next";
import { localeLabels, supportedLocales } from "../i18n";

export function LanguageSwitcher({ onChange }) {
  const { i18n, t } = useTranslation();
  const active = supportedLocales.includes(i18n.resolvedLanguage) ? i18n.resolvedLanguage : "en";

  return <label className="language-switcher">
    <span className="sr-only">{t("language")}</span>
    <Languages size={18} aria-hidden="true" />
    <select value={active} aria-label={t("language")} onChange={(event) => {
      void i18n.changeLanguage(event.target.value);
      onChange?.();
    }}>
      {supportedLocales.map((locale) => <option value={locale} key={locale}>{localeLabels[locale]}</option>)}
    </select>
  </label>;
}
