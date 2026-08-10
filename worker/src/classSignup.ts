import { randomId } from "./crypto";
import { getDb } from "./db";
import { badRequest, json, readJson, serverError } from "./http";
import { checkRateLimit } from "./rateLimit";
import { sendSmtpEmail } from "./smtp";
import type { Env } from "./types";

const agreementVersion = "DSMES-confidentiality-ip-2026-07-09";
const maxInsuranceCardBytes = 20 * 1024 * 1024;
const insuranceCardExtensions: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/heic": "heic",
  "image/heif": "heif",
};

type ClassSignupPayload = {
  ageRange?: string;
  gender?: string;
  genderOther?: string;
  raceEthnicity?: string[];
  primaryLanguage?: string;
  primaryLanguageOther?: string;
  stateResidence?: string;
  educationLevel?: string;
  hasUsHealthInsurance?: string;
  diagnosedConditions?: string[];
  bloodSugarMonitoring?: string;
  diabetesMedications?: string[];
  agreementAccepted?: boolean;
  sourcePage?: string;
  preferredSiteLanguage?: string;
};

type InsuranceCardUpload = {
  kind: "front" | "back";
  file: File;
};

type StoredInsuranceCard = {
  id: string;
  kind: "front" | "back";
  objectKey: string;
  originalName: string;
  contentType: string;
  sizeBytes: number;
};

function trim(value: unknown, max = 500) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function trimList(value: unknown, maxItems = 12, maxLength = 160) {
  return Array.isArray(value)
    ? value.map((item) => trim(item, maxLength)).filter(Boolean).slice(0, maxItems)
    : [];
}

function formatList(value: string[]) {
  return value.length ? value.join(", ") : "-";
}

function formText(form: FormData, name: string) {
  const value = form.get(name);
  return typeof value === "string" ? value : "";
}

function formList(form: FormData, name: string) {
  const value = formText(form, name);
  try {
    return trimList(JSON.parse(value));
  } catch {
    return [];
  }
}

function formFile(form: FormData, name: string) {
  const value = form.get(name);
  return value instanceof File && value.size > 0 ? value : null;
}

async function readSignupInput(request: Request): Promise<{ payload: ClassSignupPayload; cards: InsuranceCardUpload[] } | null> {
  const contentType = request.headers.get("Content-Type") || "";
  if (!contentType.includes("multipart/form-data")) {
    const payload = await readJson<ClassSignupPayload>(request);
    return payload ? { payload, cards: [] } : null;
  }

  try {
    const form = await request.formData();
    const front = formFile(form, "insuranceCardFront");
    const back = formFile(form, "insuranceCardBack");
    const cards: InsuranceCardUpload[] = [];
    if (front) cards.push({ kind: "front", file: front });
    if (back) cards.push({ kind: "back", file: back });
    return {
      payload: {
        ageRange: formText(form, "ageRange"),
        gender: formText(form, "gender"),
        genderOther: formText(form, "genderOther"),
        raceEthnicity: formList(form, "raceEthnicity"),
        primaryLanguage: formText(form, "primaryLanguage"),
        primaryLanguageOther: formText(form, "primaryLanguageOther"),
        stateResidence: formText(form, "stateResidence"),
        educationLevel: formText(form, "educationLevel"),
        hasUsHealthInsurance: formText(form, "hasUsHealthInsurance"),
        diagnosedConditions: formList(form, "diagnosedConditions"),
        bloodSugarMonitoring: formText(form, "bloodSugarMonitoring"),
        diabetesMedications: formList(form, "diabetesMedications"),
        agreementAccepted: formText(form, "agreementAccepted") === "true",
        sourcePage: formText(form, "sourcePage"),
        preferredSiteLanguage: formText(form, "preferredSiteLanguage"),
      },
      cards,
    };
  } catch {
    return null;
  }
}

function insuranceCardError(cards: InsuranceCardUpload[]) {
  for (const card of cards) {
    if (!insuranceCardExtensions[card.file.type]) {
      return "Insurance card photos must be JPG, PNG, WEBP, HEIC, or HEIF files";
    }
    if (card.file.size > maxInsuranceCardBytes) {
      return "Insurance card photo is too large to process";
    }
  }
  return null;
}

function signupEmailBody(input: {
  id: string;
  createdAt: string;
  ageRange: string;
  gender: string;
  genderOther: string;
  raceEthnicity: string[];
  primaryLanguage: string;
  primaryLanguageOther: string;
  stateResidence: string;
  educationLevel: string;
  hasUsHealthInsurance: string;
  diagnosedConditions: string[];
  bloodSugarMonitoring: string;
  diabetesMedications: string[];
  insuranceCardKinds: string[];
  agreementAcceptedAt: string;
  sourcePage: string;
  preferredSiteLanguage: string;
  ip: string;
  userAgent: string;
}) {
  return [
    "A new DSMES class signup was submitted.",
    "",
    `Signup ID: ${input.id}`,
    `Submitted: ${input.createdAt}`,
    "Survey answers:",
    `1. Age: ${input.ageRange}`,
    `2. Gender: ${input.gender}${input.genderOther ? ` - ${input.genderOther}` : ""}`,
    `3. Race/ethnicity: ${formatList(input.raceEthnicity)}`,
    `4. Primary language: ${input.primaryLanguage}${input.primaryLanguageOther ? ` - ${input.primaryLanguageOther}` : ""}`,
    `5. State of residence: ${input.stateResidence}`,
    `6. Highest education level: ${input.educationLevel}`,
    `7. U.S. health insurance: ${input.hasUsHealthInsurance}`,
    `8. Conditions told by provider: ${formatList(input.diagnosedConditions)}`,
    `9. Blood sugar monitoring: ${input.bloodSugarMonitoring}`,
    `10. Diabetes medication: ${formatList(input.diabetesMedications)}`,
    `Insurance card photos: ${input.insuranceCardKinds.length ? input.insuranceCardKinds.join(", ") : "Not uploaded"}`,
    "",
    "Agreement:",
    "Accepted: Yes",
    `Agreement version: ${agreementVersion}`,
    `Accepted at: ${input.agreementAcceptedAt}`,
    "",
    "Request metadata:",
    `Source page: ${input.sourcePage || "-"}`,
    `Site language: ${input.preferredSiteLanguage || "-"}`,
    `IP: ${input.ip || "-"}`,
    `User agent: ${input.userAgent || "-"}`,
    "",
    "Admin:",
    "https://admin.xtdiabetescare.com/",
  ].join("\n");
}

export async function submitClassSignup(request: Request, env: Env, ctx?: ExecutionContext) {
  const rateLimited = checkRateLimit(request, env, "class_signup", 4, 60);
  if (rateLimited) return rateLimited;

  const input = await readSignupInput(request);
  if (!input) return badRequest(request, env, "Invalid form submission");

  const { payload, cards } = input;
  const ageRange = trim(payload.ageRange, 40);
  const gender = trim(payload.gender, 80);
  const genderOther = trim(payload.genderOther, 160);
  const raceEthnicity = trimList(payload.raceEthnicity);
  const primaryLanguage = trim(payload.primaryLanguage, 80);
  const primaryLanguageOther = trim(payload.primaryLanguageOther, 160);
  const stateResidence = trim(payload.stateResidence, 80);
  const educationLevel = trim(payload.educationLevel, 120);
  const hasUsHealthInsurance = trim(payload.hasUsHealthInsurance, 40);
  const diagnosedConditions = trimList(payload.diagnosedConditions);
  const bloodSugarMonitoring = trim(payload.bloodSugarMonitoring, 80);
  const diabetesMedications = trimList(payload.diabetesMedications);
  const sourcePage = trim(payload.sourcePage, 200);
  const preferredSiteLanguage = trim(payload.preferredSiteLanguage, 32);

  if (!ageRange) return badRequest(request, env, "Age is required");
  if (!gender) return badRequest(request, env, "Gender is required");
  if (raceEthnicity.length < 1) return badRequest(request, env, "Race/ethnicity is required");
  if (!primaryLanguage) return badRequest(request, env, "Primary language is required");
  if (!stateResidence) return badRequest(request, env, "State is required");
  if (!educationLevel) return badRequest(request, env, "Education level is required");
  if (!hasUsHealthInsurance) return badRequest(request, env, "Health insurance status is required");
  if (diagnosedConditions.length < 1) return badRequest(request, env, "Condition selection is required");
  if (!bloodSugarMonitoring) return badRequest(request, env, "Blood sugar monitoring answer is required");
  if (diabetesMedications.length < 1) return badRequest(request, env, "Medication answer is required");
  if (!payload.agreementAccepted) return badRequest(request, env, "Agreement acceptance is required");

  const cardValidationError = insuranceCardError(cards);
  if (cardValidationError) return badRequest(request, env, cardValidationError);
  if (cards.length !== 2 || !cards.some((card) => card.kind === "front") || !cards.some((card) => card.kind === "back")) {
    return badRequest(request, env, "Both front and back insurance card photos are required");
  }
  if (cards.length && !env.INSURANCE_CARDS) {
    return json(request, env, { error: "Insurance card uploads are temporarily unavailable" }, { status: 503 });
  }

  const now = new Date().toISOString();
  const signupId = randomId("cls_");
  const agreementAcceptedAt = now;
  const ip = request.headers.get("CF-Connecting-IP") || "";
  const userAgent = request.headers.get("User-Agent") || "";
  const db = getDb(env);
  const insuranceCards = env.INSURANCE_CARDS;
  const storedCards: StoredInsuranceCard[] = cards.map((card) => ({
    id: randomId("csf_"),
    kind: card.kind,
    objectKey: `class-signups/${signupId}/${card.kind}.${insuranceCardExtensions[card.file.type]}`,
    originalName: trim(card.file.name, 180) || `insurance-card-${card.kind}.${insuranceCardExtensions[card.file.type]}`,
    contentType: card.file.type,
    sizeBytes: card.file.size,
  }));
  const uploadedKeys: string[] = [];

  try {
    if (insuranceCards) {
      for (let index = 0; index < cards.length; index += 1) {
        const card = cards[index];
        const storedCard = storedCards[index];
        await insuranceCards.put(storedCard.objectKey, card.file.stream(), {
          httpMetadata: { contentType: storedCard.contentType },
          customMetadata: { originalName: storedCard.originalName, signupId, kind: storedCard.kind },
        });
        uploadedKeys.push(storedCard.objectKey);
      }
    }

    await db.batch([
      db
        .prepare(
          `INSERT INTO class_signups
           (id, full_name, date_of_birth, email, age_range, gender, gender_other, race_ethnicity,
            primary_language, primary_language_other, state_residence, education_level, has_us_health_insurance,
            diagnosed_conditions, blood_sugar_monitoring, diabetes_medications, agreement_accepted, agreement_version,
            agreement_accepted_at, source_page, preferred_site_language, ip, user_agent, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        )
        .bind(
          signupId,
          "",
          "",
          "",
          ageRange,
          gender,
          genderOther,
          JSON.stringify(raceEthnicity),
          primaryLanguage,
          primaryLanguageOther,
          stateResidence,
          educationLevel,
          hasUsHealthInsurance,
          JSON.stringify(diagnosedConditions),
          bloodSugarMonitoring,
          JSON.stringify(diabetesMedications),
          1,
          agreementVersion,
          agreementAcceptedAt,
          sourcePage,
          preferredSiteLanguage,
          ip,
          userAgent,
          now,
          now,
        ),
      ...storedCards.map((card) =>
        db
          .prepare(
            `INSERT INTO class_signup_files
             (id, signup_id, kind, object_key, original_name, content_type, size_bytes, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          )
          .bind(card.id, signupId, card.kind, card.objectKey, card.originalName, card.contentType, card.sizeBytes, now),
      ),
    ]);
  } catch (error) {
    if (insuranceCards) {
      await Promise.all(uploadedKeys.map((key) => insuranceCards.delete(key).catch(() => undefined)));
    }
    return serverError(request, env, error instanceof Error ? error.message : undefined);
  }

  const emailInput = {
    id: signupId,
    createdAt: now,
    ageRange,
    gender,
    genderOther,
    raceEthnicity,
    primaryLanguage,
    primaryLanguageOther,
    stateResidence,
    educationLevel,
    hasUsHealthInsurance,
    diagnosedConditions,
    bloodSugarMonitoring,
    diabetesMedications,
    insuranceCardKinds: storedCards.map((card) => card.kind),
    agreementAcceptedAt,
    sourcePage,
    preferredSiteLanguage,
    ip,
    userAgent,
  };
  const notify = sendSmtpEmail(env, {
    subject: "New DSMES class signup",
    text: signupEmailBody(emailInput),
  });
  const recordEmailStatus = notify
    .then(async (result) => {
      const status = result.skipped ? "skipped" : "sent";
      const error = result.skipped ? `Missing SMTP config: ${(result.missing || []).join(", ")}`.slice(0, 500) : null;
      const notifiedAt = new Date().toISOString();
      await db
        .prepare("UPDATE class_signups SET email_status = ?, email_error = ?, email_notified_at = ?, updated_at = ? WHERE id = ?")
        .bind(status, error, notifiedAt, notifiedAt, signupId)
        .run();
    })
    .catch(async (error) => {
      const message = error instanceof Error ? error.message.slice(0, 500) : "Class signup notification email failed";
      const notifiedAt = new Date().toISOString();
      console.error("Class signup notification email failed", message);
      await db
        .prepare("UPDATE class_signups SET email_status = 'failed', email_error = ?, email_notified_at = ?, updated_at = ? WHERE id = ?")
        .bind(message, notifiedAt, notifiedAt, signupId)
        .run();
    });
  if (ctx) ctx.waitUntil(recordEmailStatus);

  return json(request, env, { ok: true, id: signupId });
}
