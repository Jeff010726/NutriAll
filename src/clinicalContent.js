import { xtClinicalContent } from "./xtClinicalContent";

export function getClinicalContent(language, service) {
  const locale = xtClinicalContent[language] || xtClinicalContent.en;
  return locale[service] || xtClinicalContent.en[service];
}
