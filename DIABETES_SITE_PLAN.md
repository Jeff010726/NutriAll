# NutriAll Diabetes Care Site Plan

## Positioning

NutriAll Diabetes Care is a standalone diabetes nutrition management website. NutriAll Wellness provides the clinical and brand trust, but this site is focused only on diabetes: nutrition counseling, meal planning, blood sugar education, insurance-supported care, diabetes-friendly recipes, and plain-English research translation.

## Primary Goals

- Convert visitors into booked discovery calls or insurance checks.
- Explain diabetes nutrition care in plain language.
- Build trust through registered dietitian credentials, team material, client stories, and insurance transparency.
- Create SEO depth through recipes, education resources, and research explainers.

## Routes

```txt
/                              Home
/about                         About Us
/team                          Dietitian Team
/program                       Diabetes Management Program
/program/nutrition             Nutrition Assessment & Meal Planning
/program/carbs                 Carbohydrate Management
/program/glucose               Blood Sugar Monitoring
/program/heart-health          Heart Health & Weight Support
/insurance                     Insurance & Pricing
/resources                     Diabetes Education Hub
/resources/diabetes-basics
/resources/carbs-guide
/resources/blood-sugar
/resources/meal-planning
/recipes                       Diabetes-Friendly Recipes
/recipes/[slug]                Recipe Detail
/research                      Research Library
/research/[slug]               Research Explained
/stories                       Client Stories
/book                          Booking Funnel
/book/confirmation             Booking Confirmation
/contact                       Contact
/privacy                       Privacy Policy
/terms                         Terms
```

## Navigation

Primary nav:

```txt
Program
Recipes
Research
Resources
About
Book Now
```

Mega menu behavior should follow the Seed reference: hover on a nav item opens a rounded vertical panel attached visually to the left navigation capsule. The menu closes when the pointer leaves the header/menu area, and click/focus support should remain for accessibility.

## Page Plans

### Home

Purpose: high-conversion landing page.

Sections:
- Bright diabetes-friendly hero with Book Now and Program CTAs.
- Insurance banner: most clients may pay $0 with eligible benefits.
- Program overview.
- Six service cards: assessment, meal planning, carbs, glucose monitoring, weight support, heart health.
- Why Choose Us with NutriAll team photo.
- Recipe teaser.
- Research teaser.
- Client stories.
- Booking CTA.

### About Us

Explain why this diabetes-focused site exists under NutriAll Wellness:
- Mission.
- Diabetes-specific care philosophy.
- Registered dietitian-led care.
- Multi-language and multi-cultural counseling.
- Insurance-friendly support.

### Team

Use NutriAll team assets. Focus on credentials, care style, language support, and trust.

### Program

Explain the care model:

```txt
Assess -> Plan -> Track -> Adjust -> Sustain
```

Subpages should be SEO-capable and conversion-focused:
- Nutrition Assessment & Meal Planning.
- Carbohydrate Management.
- Blood Sugar Monitoring.
- Heart Health & Weight Support.

### Insurance

Explain:
- Eligible insurance may cover nutrition counseling.
- How verification works.
- What information is needed.
- Self-pay path.
- FAQ.
- CTA into booking.

### Resources

Plain-language diabetes education hub. Topics:
- Diabetes basics.
- A1C and blood sugar.
- Carb counting.
- Plate method.
- Meal timing.
- Exercise and glucose.
- Hypoglycemia basics.
- Medication and meals.

### Recipes

Migrate diabetes-friendly recipes from `C:\Users\jeff\Desktop\nta\data\content` and matching images from `data/assets`.

Priority recipes:
- Cottage Cheese with Blueberries and Hemp Seeds.
- Dijon Salmon with Spinach.
- Chicken Sausage Kale Skillet.
- Chicken Salad Collard Wraps.
- Turkey Herb Burger.
- Turkey Meatball Wonton Soup with Bok Choy Carrots.
- Mediterranean Zucchini.
- Cucumber Tomato Salad.
- Bolognese with Spaghetti Squash.
- Chocolate Fudge Shake.
- Low-carb Easy Tiramisu.

Recipe detail structure:
- Title.
- Hero image.
- Diabetes-friendly note.
- Prep/cook time and servings.
- Ingredients.
- Instructions.
- Protein/fiber highlights.
- Carb awareness.
- Pairing suggestions.
- Related recipes.
- CTA to meal planning.

Suggested recipe schema:

```ts
type Recipe = {
  slug: string;
  title: string;
  category: string;
  image: string;
  excerpt: string;
  prepTime: string;
  cookTime: string;
  servings: string;
  tags: string[];
  diabetesNote: string;
  nutritionHighlights: string[];
  carbAwareness: string;
  ingredients: string[];
  instructions: string[];
};
```

### Research

Research is a plain-English research translation library, not a raw academic database.

Use public sources such as ADA, CDC, NIH, WHO, PubMed, JAMA, NEJM, The Lancet, and Diabetes Care. Every article should link to the original source and use careful language such as "research suggests" rather than making treatment claims.

Research list categories:
- Blood Sugar & A1C.
- Carbohydrates.
- Diet Patterns.
- Weight & Insulin Resistance.
- Heart Health.
- Physical Activity.
- Sleep and Stress.
- Medication + Nutrition.

Research detail structure:

```txt
Title
Plain-English summary
Why this matters
What the study looked at
What they found
What this means for daily meals
What this does NOT mean
Dietitian takeaways
Original source
Related program CTA
Related recipes/resources
Medical disclaimer
```

Suggested research schema:

```ts
type ResearchArticle = {
  slug: string;
  title: string;
  category: string;
  summary: string;
  plainEnglishTakeaway: string;
  whyItMatters: string;
  studyType: string;
  sourceName: string;
  sourceUrl: string;
  publishedYear: string;
  findings: string[];
  dailyLifeTakeaways: string[];
  whatItDoesNotMean: string[];
  relatedPrograms: string[];
  relatedRecipes: string[];
};
```

Initial research topics:
- Plate method and blood sugar control.
- Mediterranean diet and type 2 diabetes.
- High-fiber foods and A1C.
- Protein at breakfast and post-meal glucose.
- Walking after meals and blood sugar.
- Weight loss and insulin resistance.
- Ultra-processed foods and diabetes risk.
- Sleep and glucose control.
- Heart health risk in diabetes.
- CGM and food awareness.

### Stories

Use diabetes-specific testimonials and anonymized case-style stories. Focus on clarity, confidence, and practical change rather than medical promises.

## Booking Flow

`/book` should be a multi-step front-end funnel:

1. Goal
   - Newly diagnosed.
   - Improve blood sugar.
   - Meal planning.
   - Carb counting.
   - Weight support.
   - Heart health.
   - Not sure.

2. Care format
   - Virtual.
   - In-person.
   - Free discovery call.

3. Payment path
   - Check insurance.
   - Self-pay.
   - Not sure.

4. Preferences
   - Language.
   - Preferred time.
   - Provider preference.

5. Contact
   - Name.
   - Email.
   - Phone.
   - State.
   - Consent checkbox.

6. Confirmation
   - Explain next steps: insurance verification, scheduling, and secure follow-up intake.

Do not collect detailed medical history in the public form unless the downstream flow is HIPAA-appropriate.

## Implementation Phases

1. Move from static HTML into a Next.js App Router app, using `C:\Users\jeff\Desktop\nta\nutriall-premium` as technical reference.
2. Build shared layout, header, Seed-style hover mega menu, footer, buttons, cards, CTAs, and forms.
3. Implement core conversion pages: Home, Program, Insurance, About, Team, Book.
4. Add Recipes list/detail pages using migrated recipe data.
5. Add Research list/detail pages using curated public-source explainers.
6. Add Resources education hub and guide pages.
7. Wire booking funnel state and confirmation.
8. Add SEO metadata, responsive QA, accessibility checks, and build validation.

## Success Criteria

- Multi-page architecture exists; no longer a single-page site.
- Every primary nav item maps to real routes.
- Booking flow is complete and clear.
- Recipes, research, resources, about/team, insurance, and stories are present.
- NutriAll brand assets support trust, but the site stays diabetes-specific.
- Visual direction remains premium, bright, calm, and conversion-focused.
