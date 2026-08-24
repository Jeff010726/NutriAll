import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";

export const supportedLocales = ["en", "zh-CN", "zh-TW", "es"];

export const localeLabels = {
  en: "English",
  "zh-CN": "简体中文",
  "zh-TW": "繁體中文",
  es: "Español",
};

const resources = {
  en: { translation: {
    language: "Language",
    nav: {
      weight: "Weight Loss", clinical: "Diabetes & Training", insurance: "Insurance",
      team: "Our Team", resources: "Resources", book: "Book a Free Call", menu: "Menu",
      weightIntro: "Personalized care for sustainable weight loss.",
      clinicalIntro: "Education and device training from diabetes specialists.",
      oneToOne: "1:1 Weight Loss", glpCare: "GLP-1 Weight Management", medical: "Medical Weight Loss",
      classes: "Diabetes Classes", pump: "Insulin Pump Training", cgm: "CGM Training & Reports",
      glpTraining: "GLP-1 Medication Training", providers: "For Providers",
      recipes: "Recipes", research: "Research Explained", about: "Meet Our Dietitians"
    },
    home: {
      eyebrow: "Nutrition care for real life · Insurance-friendly",
      title: "Food, health, and real life belong in the same conversation.",
      intro: "Talk one-to-one with a dietitian about how you eat, how you live, and what you want to change. We can help with weight loss, GLP-1, PCOS, digestive concerns, and more.",
      primary: "Book a free 15-minute call", secondary: "See if insurance covers care",
      trust: "Talk with us in English, Mandarin, Cantonese, Fuzhounese, Hakka, or Spanish.",
      pathsEyebrow: "Start with what is on your mind", pathsTitle: "What can we help you with today?",
      pathsIntro: "You do not need to choose the right service first. Tell us what you are dealing with, and we will help you find the right place to start.",
      needsAction: "Help me find the right dietitian",
      needs: { weight: "Weight Loss", glp1: "GLP-1", pcos: "PCOS", prediabetes: "Prediabetes", digestive: "Digestive Health", sports: "Sports Nutrition", diabetes: "Diabetes", heart: "Heart Health", pregnancy: "Pregnancy & Postpartum", eating: "Eating Disorders", celiac: "Celiac Disease", kidney: "Kidney Health", thyroid: "Thyroid Health", cancer: "Cancer Nutrition", cholesterol: "High Cholesterol", menopause: "Menopause", allergies: "Food Allergies" },
      path1Title: "1:1 Weight Loss", path1Text: "Work on meals, hunger, habits, and progress that can fit a busy week.",
      path2Title: "GLP-1 Weight Management", path2Text: "Get help with appetite changes, protein, hydration, side effects, and what comes next.",
      path3Title: "Medical Weight Loss", path3Text: "Meet with a dietitian and physician when medical evaluation or medication may be useful.",
      explore: "See how it works", processEyebrow: "How care works", processTitle: "A clear next step, from the first call onward.",
      processIntro: "From the first conversation to every adjustment after it, you will know what we are working on together.",
      step1Title: "Tell us what is going on", step1Text: "Use one short form, whether you are new or returning.",
      step2Title: "We check and match", step2Text: "We check your insurance and connect you with the right person.",
      step3Title: "Meet your dietitian", step3Text: "Leave your first visit with a few clear steps that fit your health and routine.",
      journeyAction: "Book a free 15-minute call", journeyDietitianRole: "Registered Dietitian", journeyAvailable: "Multilingual care",
      journeyScene1Label: "Before your first visit", journeyScene1Title: "What should we talk about?", journeyScene1Item1: "Your health and eating history", journeyScene1Item2: "What has felt hard", journeyScene1Item3: "What you want to change", journeyScene1Note: "No perfect food log required.",
      journeyScene2Label: "We prepare together", journeyScene2Title: "The right care, clearly matched", journeyScene2Item1: "Insurance checked first", journeyScene2Item2: "A dietitian who fits your needs", journeyScene2Item3: "A time that works for you", journeyScene2Note: "We explain costs before care starts.",
      journeyScene3Label: "After each visit", journeyScene3Title: "A few useful next steps", journeyScene3Item1: "One realistic goal for this week", journeyScene3Item2: "Notes you can come back to", journeyScene3Item3: "Adjustments at your next visit", journeyScene3Note: "The plan changes when life changes.",
      clinicalEyebrow: "Three ways to get started", clinicalTitle: "Weight loss care that meets you where you are.",
      clinicalIntro: "Choose one-to-one nutrition, GLP-1 support, or coordinated medical care. If you are not sure, start with a free 15-minute call.",
      learn: "See details", teamEyebrow: "Meet the people", teamTitle: "You will not be handed the same plan as everyone else.",
      teamText: "Our multilingual dietitians listen first, explain things clearly, and build around your food, culture, schedule, and health needs.",
      teamLink: "Meet the dietitians", directorTitle: "Medical support when needed", directorText: "Leon Katz, MD, can support clinical evaluation and prescribing decisions when they are part of your care.",
      finalTitle: "Talk for 15 minutes. You do not need to decide anything today.", finalText: "Tell us what you are looking for. We can answer your first questions, check insurance, and help you find the right person.", finalButton: "Request a free call"
    },
    faq: {
      eyebrow: "Good to know", title: "Frequently Asked Questions", intro: "A few straightforward answers before we talk.",
      q1: "What can a NutriAll dietitian help me with?", a1: "We help with weight goals, GLP-1 nutrition support, PCOS, digestive concerns, heart health, pregnancy, sports nutrition, eating concerns, and more. If you are not sure where to start, tell us what is going on and we will guide you.",
      q2: "Will my insurance cover nutrition visits?", a2: "Many commercial plans cover eligible visits, but benefits vary. Share your insurance information and we will check coverage and explain possible costs before care begins.",
      q3: "How do I find the right dietitian?", a3: "You do not have to choose alone. We match you based on your goals, health needs, preferred language, schedule, and the kind of support you want.",
      q4: "What happens during the first visit?", a4: "Your dietitian will listen to your health and food history, what feels difficult now, and what you want to change. You will leave with a few realistic next steps, not a rigid one-size-fits-all plan.",
      q5: "What does GLP-1 support include?", a5: "We can help with protein, hydration, meal timing, appetite changes, side effects, and medication routines. Prescribing requires an individual clinical evaluation and is never guaranteed.",
      cta1: "Book a free 15-minute call to find your starting point", cta2: "Book a free 15-minute call to understand your insurance", cta3: "Book a free 15-minute call and let us match you", cta4: "Book a free 15-minute call before your first visit", cta5: "Book a free 15-minute call about GLP-1 support"
    },
    insurance: { badge: "Insurance-friendly care", title: "Your insurance may cover nutrition visits.", text: "Share your plan details and we will check what it may cover before you start.", action: "Check my insurance", note: "Coverage and cost depend on your plan and eligibility." },
    about: { eyebrow: "About NutriAll", title: "Nutrition care shaped around the whole person.", intro: "Our registered dietitians connect weight care, GLP-1 support, culture, and daily life in one practical plan.", valuesTitle: "Care that is clinical, practical, and respectful.", value1: "Evidence-based", value1Text: "Recommendations grounded in nutrition science and your health history.", value2: "Made for real life", value2Text: "Plans built around culture, schedule, family, access, and preferences.", value3: "Without shame", value3Text: "Progress and setbacks are information, never a reason for blame.", teamEyebrow: "Our dietitians", teamTitle: "Meet the team behind your care.", teamText: "Our clinicians bring complementary experience across weight management, GLP-1 nutrition, digestive health, sports nutrition, intuitive eating, and more.", director: "Medical oversight when needed", directorText: "Leon Katz, MD, provides obesity-medicine leadership, clinical evaluation, and prescribing oversight when appropriate.", cta: "Find the right dietitian for you" },
    book: { badge: "Free 15-minute consultation", title: "Start with a quick insurance and care check.", intro: "Tell us when to reach you. We will verify benefits, answer your first questions, and help identify the right service.", short: "One short form", noCommitment: "No commitment", verification: "Insurance verification", whatsapp: "Message us on WhatsApp", starting: "Your starting point", adjust: "We can adjust this when we speak.", request: "Request a call", timeTitle: "Choose a time that works for you.", required: "Required fields help us contact you. Insurance details are optional.", name: "Full name", email: "Email", phone: "Phone", age: "Age", preferred: "Preferred language", selectLanguage: "Select a language", patientQuestion: "Have you worked with NutriAll before?", newPatient: "I'm a new patient", returningPatient: "I'm a returning patient", bestTime: "Best time to reach you", selectTime: "Select a time window", optionalInsurance: "Optional insurance information", insuranceHelp: "Share these details if you would like us to begin checking benefits before we call.", company: "Insurance company", memberId: "Member ID", dob: "Date of birth", submit: "Request my free consultation", submitting: "Submitting...", disclaimer: "By submitting, you authorize NutriAll to contact you about this request. Do not use this form for urgent medical concerns.", error: "We could not submit your request. Please try again or contact us on WhatsApp." },
    weightServices: { eyebrow: "Personalized weight care", help: "How this care helps", process: "What to expect", team: "Your care team", insuranceNote: "Eligible nutrition visits may be covered by commercial insurance. We verify benefits before care begins.", oneToOne: { title: "1:1 Weight Loss", summary: "Fat-loss nutrition built around your health, culture, preferences, and real weekly routine.", points: ["Practical protein and fiber planning", "Meal strategies for work, travel, restaurants, and family", "Support for hunger, plateaus, and consistency", "Accountability without shame or rigid rules"], steps: ["Complete one short consultation request", "Get matched with a registered dietitian", "Build and adjust a repeatable plan"], note: "Your dietitian considers weight history, appetite, medications, movement, sleep, stress, and the barriers that made past plans difficult." }, glpCare: { title: "GLP-1 Weight Management", summary: "Nutrition and clinical support before, during, or after GLP-1 treatment.", points: ["Protein, hydration, fiber, and meal pacing", "Injection or oral medication routines", "Planning for nausea, constipation, and appetite changes", "Questions and symptom tracking for your prescriber"], steps: ["Review your medication stage and goals", "Create a symptom-aware nutrition plan", "Adjust support as appetite and doses change"], note: "Medication requires individualized clinical evaluation. Product choice, prescription, availability, and coverage are not guaranteed." }, medical: { title: "Medical Weight Loss", summary: "A coordinated pathway combining obesity-medicine evaluation with one-to-one nutrition care.", points: ["Medical and weight-history review", "Medication, lab, and risk context", "Personalized nutrition assessment", "Ongoing physician and dietitian follow-up"], steps: ["Start with a short care request", "Meet the appropriate clinician", "Begin with clear medical and nutrition priorities"], note: "Prescription treatment is offered only when clinically appropriate. Individual results vary and no medication or amount of weight loss is guaranteed." }, insurance: { title: "Insurance & Cost", summary: "Understand potential coverage before care begins.", points: ["Medical visit network and cost rules", "Registered dietitian benefits and visit limits", "Referral or prior authorization requirements", "Medication coverage checked separately"], steps: ["Share optional insurance details", "We review the benefits relevant to your service", "You receive a clearer next step before booking care"], note: "Coverage and out-of-pocket cost vary by plan, network, diagnosis, eligibility, and location." } },
    services: {
      eyebrow: "Specialist diabetes care", appointment: "Request an appointment", what: "What we help you with", expect: "What to expect", insurance: "Many eligible visits may be covered by commercial insurance. We verify benefits before care begins.",
      classes: { title: "Diabetes Classes", summary: "Structured diabetes education for food, medication, exercise, monitoring, and daily routines.", points: ["Understanding diabetes and blood glucose", "Food, carbohydrates, and meal planning", "Medication, activity, and risk reduction", "Problem solving and sustainable routines"], steps: ["Education led by diabetes-focused dietitians", "Practical lessons you can apply at home", "Multilingual support and culturally responsive care"] },
      pump: { title: "Insulin Pump Training", summary: "Hands-on setup and confidence building for modern insulin pump systems.", points: ["Pump readiness and system setup", "Infusion sites, cartridges, and supplies", "Bolus, basal, alerts, and safety features", "Troubleshooting and daily confidence"], steps: ["Bring your prescribed device and supplies", "Train one-to-one with a diabetes specialist", "Leave with clear safety and follow-up steps"] },
      cgm: { title: "CGM Training & Reports", summary: "Sensor setup, app support, and glucose pattern interpretation that turns data into useful action.", points: ["Sensor placement and app connection", "Alerts, trend arrows, and time in range", "AGP report review", "Food, activity, and medication pattern insights"], steps: ["Support for major CGM systems", "Reports explained in plain language", "Shareable insights for your medical team"] },
      glpTraining: { title: "GLP-1 Medication Training", summary: "Practical training for injectable and oral GLP-1 medications, including technique and side-effect planning.", points: ["Injection technique and medication routines", "Storage, travel, and missed-dose questions", "Protein, hydration, and meal planning", "Nausea, constipation, and symptom planning"], steps: ["Understand how to use your prescribed medication", "Know what to monitor and when to call your prescriber", "Build nutrition routines that support treatment"] },
      providers: { title: "For Providers", summary: "Referral resources and diabetes education support for clinics and care teams.", points: ["Diabetes self-management education", "Medical nutrition therapy", "Pump, CGM, and medication training", "Clear communication back to the referring team"], steps: ["Refer patients who need more education time", "Give patients multilingual, culturally responsive support", "Extend your clinic's diabetes education capacity"] }
    },
    footer: { note: "One-to-one weight loss, GLP-1 support, and coordinated medical care when needed.", copyright: "NutriAll Wellness. All rights reserved." },
    mobileCta: "Book free call"
  } },
  "zh-CN": { translation: {
    language: "语言",
    nav: { weight: "减重服务", clinical: "糖尿病与培训", insurance: "保险", team: "营养师团队", resources: "健康资源", book: "免费预约咨询", menu: "菜单", weightIntro: "以长期可持续减重为目标的一对一服务。", clinicalIntro: "由糖尿病专业人员提供教育与设备培训。", oneToOne: "1对1减重", glpCare: "GLP-1 减重管理", medical: "医学减重", classes: "糖尿病课程", pump: "胰岛素泵培训", cgm: "CGM 培训与报告", glpTraining: "GLP-1 用药培训", providers: "医疗机构转诊", recipes: "健康食谱", research: "研究解读", about: "认识营养师" },
    home: { eyebrow: "从每天吃饭这件事开始 · 支持商业保险", title: "吃饭、身体和生活，本来就该放在一起聊。", intro: "和营养师一对一聊聊你平时怎么吃、身体怎么样、最想改变什么。减重、GLP-1、多囊、肠胃问题等，都可以一起想办法。", primary: "免费聊 15 分钟", secondary: "看看保险能不能报", trust: "可以用英语、普通话、粤语、福州话、客家话或西班牙语沟通。", pathsEyebrow: "从你现在最在意的事开始", pathsTitle: "今天最想先解决什么？", pathsIntro: "不用先弄清楚该选哪种服务。告诉我们你正在面对什么，我们会帮你找到合适的开始方式。", needsAction: "帮我找到合适的营养师", needs: { weight: "减重", glp1: "GLP-1", pcos: "多囊（PCOS）", prediabetes: "前糖", digestive: "肠胃健康", sports: "运动营养", diabetes: "糖尿病", heart: "心脏健康", pregnancy: "孕期与产后营养", eating: "进食障碍", celiac: "乳糜泻", kidney: "肾脏健康", thyroid: "甲状腺健康", cancer: "肿瘤营养", cholesterol: "高胆固醇", menopause: "更年期营养", allergies: "食物过敏" }, path1Title: "1对1减重", path1Text: "一起处理吃什么、饿不饿、怎么坚持，以及忙起来以后怎么办。", path2Title: "GLP-1 减重管理", path2Text: "聊清楚胃口变化、蛋白质、补水、副作用，以及用药前后的安排。", path3Title: "医学减重", path3Text: "适合时，由营养师和医生一起评估和跟进，不把药物当成唯一答案。", explore: "看看怎么进行", processEyebrow: "服务怎么进行", processTitle: "从第一次沟通开始，每一步都清清楚楚。", processIntro: "从第一次沟通到之后每一次调整，你都会知道我们正在一起处理什么。", step1Title: "告诉我们你的情况", step1Text: "无论第一次来还是已经见过我们，都只需填写一份简短表单。", step2Title: "查询保险，匹配合适的人", step2Text: "我们会了解你的需求、查询保险，再安排合适的营养师或医生。", step3Title: "开始第一次会面", step3Text: "带着几件适合你身体和日常生活的具体做法离开。", journeyAction: "免费聊 15 分钟", journeyDietitianRole: "注册营养师", journeyAvailable: "支持多语言沟通", journeyScene1Label: "第一次见面前", journeyScene1Title: "你最想先聊什么？", journeyScene1Item1: "你的健康和饮食经历", journeyScene1Item2: "最近最难处理的事", journeyScene1Item3: "你最想改变什么", journeyScene1Note: "不用准备完美的饮食记录。", journeyScene2Label: "我们一起做准备", journeyScene2Title: "把合适的人和服务找清楚", journeyScene2Item1: "先查询保险", journeyScene2Item2: "匹配适合你的营养师", journeyScene2Item3: "安排方便的时间", journeyScene2Note: "开始前先把可能的费用讲清楚。", journeyScene3Label: "每次见面以后", journeyScene3Title: "留下几件真正能做的事", journeyScene3Item1: "这周先试一个小目标", journeyScene3Item2: "随时可以回看的重点", journeyScene3Item3: "下次见面再一起调整", journeyScene3Note: "生活变了，方案也可以跟着变。", clinicalEyebrow: "三种开始方式", clinicalTitle: "减重这件事，可以从适合你的方式开始。", clinicalIntro: "可以选择一对一营养支持、GLP-1 体重管理或医学减重。不确定怎么选，也可以先免费聊 15 分钟。", learn: "查看详情", teamEyebrow: "先认识人，再谈方案", teamTitle: "你不会拿到一份所有人都一样的标准答案。", teamText: "我们的多语言营养师会先听你说，把复杂的事讲明白，再把方法放进你的饮食、文化、作息和身体状况里。", teamLink: "认识营养师", directorTitle: "需要时有医生一起支持", directorText: "如果照护涉及临床评估或处方，Leon Katz 医生可以参与判断和跟进。", finalTitle: "先聊 15 分钟，今天不用做任何决定。", finalText: "告诉我们你在找什么。我们可以先回答问题、查询保险，再帮你找到合适的人。", finalButton: "免费约个时间聊聊" },
    faq: {
      eyebrow: "开始前，先把问题说清楚", title: "常见问题", intro: "这些是大家第一次联系我们时最常问的几件事。",
      q1: "营养师可以帮我解决哪些问题？", a1: "减重、GLP-1 营养支持、多囊、肠胃问题、心脏健康、孕期营养、进食困扰和运动营养等，都可以一起聊。如果你不知道该从哪里开始，只要告诉我们现在最困扰你的事。",
      q2: "保险可以报销营养咨询吗？", a2: "不少商业保险会报销符合条件的营养咨询，但每个计划的规则不同。你提供保险信息后，我们会在开始前帮你查询，并把可能的费用讲清楚。",
      q3: "我怎么知道哪位营养师适合我？", a3: "不用自己一个个挑。我们会根据你的目标、身体状况、语言偏好、时间安排和你喜欢的沟通方式，帮你匹配合适的营养师。",
      q4: "第一次咨询会聊些什么？", a4: "营养师会先听你说健康和饮食经历、最近最难处理的事，以及你最想改变什么。结束时会一起定下几件现实可做的事，不会直接塞给你一套标准答案。",
      q5: "GLP-1 支持具体包括什么？", a5: "我们可以一起处理蛋白质、补水、吃饭节奏、胃口变化、副作用和用药习惯。是否适合开药需要单独做临床评估，也不保证一定会获得处方。",
      cta1: "免费聊 15 分钟，看看从哪里开始", cta2: "免费聊 15 分钟，先把保险问清楚", cta3: "免费聊 15 分钟，让我们帮你匹配", cta4: "第一次会面前，先免费聊 15 分钟", cta5: "免费聊 15 分钟，了解 GLP-1 支持"
    },
    insurance: { badge: "支持商业保险", title: "你的保险可能可以报销营养咨询。", text: "告诉我们你的保险信息，我们会在开始前帮你查清可能的报销和费用。", action: "帮我查保险", note: "实际报销和费用取决于你的保险计划及资格。" },
    about: { eyebrow: "关于 NutriAll", title: "从完整的你出发，提供营养照护。", intro: "注册营养师把减重、GLP-1 营养支持、文化和日常生活连接成一套实际可行的方案。", valuesTitle: "专业、实用并尊重每个人的服务。", value1: "循证专业", value1Text: "根据营养科学和你的健康状况提供建议。", value2: "适合真实生活", value2Text: "结合文化、时间、家庭、资源与个人偏好制定方案。", value3: "没有羞耻与指责", value3Text: "进步与挫折都是信息，不是责备你的理由。", teamEyebrow: "营养师团队", teamTitle: "认识为你提供服务的团队。", teamText: "团队擅长减重、GLP-1 营养、肠胃健康、运动营养、直觉饮食等领域。", director: "需要时提供医学监督", directorText: "Leon Katz 医生在合适时提供肥胖医学领导、临床评估及处方监督。", cta: "匹配适合你的营养师" },
    book: { badge: "免费15分钟咨询", title: "先做一个简单的保险与服务确认。", intro: "告诉我们方便联系你的时间。我们会核实保险、回答初步问题并帮助选择合适服务。", short: "一份简短表单", noCommitment: "无需承诺", verification: "核实保险", whatsapp: "通过 WhatsApp 联系", starting: "本次咨询方向", adjust: "通话时可以再调整。", request: "申请回电", timeTitle: "选择方便联系你的时间。", required: "必填项用于联系你，保险资料可选填。", name: "姓名", email: "电子邮箱", phone: "电话", age: "年龄", preferred: "首选语言", selectLanguage: "请选择语言", patientQuestion: "你以前是否在 NutriAll 接受过服务？", newPatient: "我是新患者", returningPatient: "我是老患者", bestTime: "最佳联系时间", selectTime: "请选择时间段", optionalInsurance: "选填保险资料", insuranceHelp: "如希望我们提前查询福利，可以填写以下信息。", company: "保险公司", memberId: "会员编号", dob: "出生日期", submit: "申请免费咨询", submitting: "正在提交...", disclaimer: "提交即表示你同意 NutriAll 就本次申请联系你。紧急医疗问题请勿使用此表单。", error: "提交失败，请重试或通过 WhatsApp 联系我们。" },
    weightServices: { eyebrow: "个性化减重服务", help: "这项服务如何帮助你", process: "服务流程", team: "你的专业团队", insuranceNote: "符合条件的营养咨询可能由商业保险报销，我们会在服务前核实福利。", oneToOne: { title: "1对1减重", summary: "根据你的健康、文化、饮食偏好和真实生活节奏制定减脂方案。", points: ["实用的蛋白质与纤维规划", "适用于工作、旅行、外食与家庭饮食的策略", "应对饥饿、平台期与坚持困难", "不羞辱、不依赖僵化规则的跟进"], steps: ["提交一份简短咨询申请", "匹配注册营养师", "制定并持续调整可执行方案"], note: "营养师会综合体重史、食欲、药物、运动、睡眠、压力及过往计划难以坚持的原因。" }, glpCare: { title: "GLP-1 减重管理", summary: "在 GLP-1 治疗前、中、后提供营养及临床支持。", points: ["蛋白质、补水、纤维与进食节奏", "注射或口服药物使用流程", "恶心、便秘与食欲变化规划", "为医生复诊记录问题与症状"], steps: ["了解用药阶段与目标", "制定兼顾症状的营养方案", "随食欲和剂量变化调整支持"], note: "用药需要个体化临床评估，药品选择、处方、供应及保险报销均不保证。" }, medical: { title: "医学减重", summary: "将肥胖医学评估与一对一营养服务结合的协调方案。", points: ["医学史与体重史评估", "药物、化验与风险背景", "个性化营养评估", "医生与营养师持续跟进"], steps: ["提交简短服务申请", "与合适的专业人员会面", "明确医学与营养优先事项"], note: "只有临床上合适时才会提供处方治疗。个人结果不同，不保证药物或具体减重幅度。" }, insurance: { title: "保险与费用", summary: "在开始服务前了解可能的保险报销。", points: ["医疗就诊网络及费用规则", "注册营养师福利与次数限制", "转诊或预授权要求", "药物报销需单独核实"], steps: ["可选填写保险资料", "核实与你所需服务相关的福利", "预约前获得更清楚的下一步"], note: "实际报销和自付费用取决于保险计划、网络、诊断、资格及所在地。" } },
    services: { eyebrow: "糖尿病专业服务", appointment: "预约咨询", what: "我们可以帮助你", expect: "服务流程", insurance: "符合条件的服务可能由商业保险报销，我们会提前核实。", classes: { title: "糖尿病课程", summary: "系统学习饮食、药物、运动、监测与日常管理。", points: ["了解糖尿病与血糖", "碳水化合物与饮食规划", "药物、运动与风险管理", "问题解决与可持续习惯"], steps: ["由糖尿病专业营养师授课", "内容实用，可直接用于日常生活", "提供多语言及文化适配支持"] }, pump: { title: "胰岛素泵培训", summary: "现代胰岛素泵的实际操作、设置与安全使用培训。", points: ["使用准备与系统设置", "输注部位、储药仓与耗材", "基础率、追加剂量、警报与安全", "故障排查与日常使用"], steps: ["携带已开具的设备与耗材", "与糖尿病专业人员一对一培训", "带着清晰的安全及跟进方案离开"] }, cgm: { title: "CGM 培训与报告", summary: "连续血糖监测设备设置、App 支持及血糖趋势解读。", points: ["传感器佩戴与 App 连接", "警报、趋势箭头及目标范围时间", "AGP 报告解读", "饮食、活动与药物模式分析"], steps: ["支持主流 CGM 系统", "用易懂语言解释报告", "提供可与医疗团队共享的要点"] }, glpTraining: { title: "GLP-1 用药培训", summary: "针对注射及口服 GLP-1 药物的使用、储存和副作用规划。", points: ["注射方法与用药流程", "储存、旅行及漏服处理", "蛋白质、补水与饮食规划", "恶心、便秘等症状管理"], steps: ["正确使用医生开具的药物", "知道要观察什么及何时联系医生", "建立支持治疗的营养习惯"] }, providers: { title: "医疗机构转诊", summary: "为诊所及医疗团队提供转诊、糖尿病教育与培训支持。", points: ["糖尿病自我管理教育", "医学营养治疗", "泵、CGM 及用药培训", "向转诊团队清晰反馈"], steps: ["转诊需要更多教育时间的患者", "提供多语言及文化适配支持", "扩充诊所的糖尿病教育能力"] } },
    footer: { note: "1对1减重、GLP-1 支持，以及需要时的医学减重服务。", copyright: "NutriAll Wellness。保留所有权利。" }, mobileCta: "免费预约"
  } },
};

// Traditional Chinese and Spanish keep the same clinical structure while translating
// every navigation and conversion-critical message.
resources["zh-TW"] = { translation: JSON.parse(JSON.stringify(resources["zh-CN"].translation)) };
Object.assign(resources["zh-TW"].translation, {
  language: "語言",
  nav: { ...resources["zh-CN"].translation.nav, weight: "減重服務", clinical: "糖尿病與培訓", insurance: "保險", team: "營養師團隊", resources: "健康資源", book: "免費預約諮詢", menu: "選單", oneToOne: "1對1減重", pump: "胰島素幫浦培訓", cgm: "CGM 培訓與報告", glpTraining: "GLP-1 用藥培訓", providers: "醫療機構轉介", recipes: "健康食譜", research: "研究解讀", about: "認識營養師" },
  home: { ...resources["zh-CN"].translation.home, eyebrow: "從每天吃飯這件事開始 · 支援商業保險", title: "吃飯、身體和生活，本來就該放在一起聊。", intro: "和營養師一對一聊聊你平時怎麼吃、身體怎麼樣、最想改變什麼。減重、GLP-1、多囊、腸胃問題等，都可以一起想辦法。", primary: "免費聊 15 分鐘", secondary: "看看保險能不能報", trust: "可以用英語、普通話、粵語、福州話、客家話或西班牙語溝通。", pathsEyebrow: "從你現在最在意的事開始", pathsTitle: "今天最想先解決什麼？", pathsIntro: "不用先弄清楚該選哪種服務。告訴我們你正在面對什麼，我們會幫你找到合適的開始方式。", needsAction: "幫我找到合適的營養師", needs: { weight: "減重", glp1: "GLP-1", pcos: "多囊（PCOS）", prediabetes: "前期糖尿病", digestive: "腸胃健康", sports: "運動營養", diabetes: "糖尿病", heart: "心臟健康", pregnancy: "孕期與產後營養", eating: "進食障礙", celiac: "乳糜瀉", kidney: "腎臟健康", thyroid: "甲狀腺健康", cancer: "腫瘤營養", cholesterol: "高膽固醇", menopause: "更年期營養", allergies: "食物過敏" }, path1Text: "一起處理吃什麼、餓不餓、怎麼堅持，以及忙起來以後怎麼辦。", path2Text: "聊清楚胃口變化、蛋白質、補水、副作用，以及用藥前後的安排。", path3Text: "適合時，由營養師和醫生一起評估和跟進，不把藥物當成唯一答案。", explore: "看看怎麼進行", processEyebrow: "服務怎麼進行", processTitle: "從第一次溝通開始，每一步都清清楚楚。", processIntro: "從第一次溝通到之後每一次調整，你都會知道我們正在一起處理什麼。", step1Title: "告訴我們你的情況", step1Text: "無論第一次來還是已經見過我們，都只需填寫一份簡短表單。", step2Title: "查詢保險，匹配合適的人", step2Text: "我們會了解你的需要、查詢保險，再安排合適的營養師或醫生。", step3Title: "開始第一次會面", step3Text: "帶著幾件適合你身體和日常生活的具體做法離開。", journeyAction: "免費聊 15 分鐘", journeyDietitianRole: "註冊營養師", journeyAvailable: "支援多語言溝通", journeyScene1Label: "第一次見面前", journeyScene1Title: "你最想先聊什麼？", journeyScene1Item1: "你的健康和飲食經歷", journeyScene1Item2: "最近最難處理的事", journeyScene1Item3: "你最想改變什麼", journeyScene1Note: "不用準備完美的飲食記錄。", journeyScene2Label: "我們一起做準備", journeyScene2Title: "把合適的人和服務找清楚", journeyScene2Item1: "先查詢保險", journeyScene2Item2: "匹配適合你的營養師", journeyScene2Item3: "安排方便的時間", journeyScene2Note: "開始前先把可能的費用講清楚。", journeyScene3Label: "每次見面以後", journeyScene3Title: "留下幾件真正能做的事", journeyScene3Item1: "這週先試一個小目標", journeyScene3Item2: "隨時可以回看的重點", journeyScene3Item3: "下次見面再一起調整", journeyScene3Note: "生活變了，方案也可以跟著變。", clinicalEyebrow: "三種開始方式", clinicalTitle: "減重這件事，可以從適合你的方式開始。", clinicalIntro: "可以選擇一對一營養支援、GLP-1 體重管理或醫學減重。不確定怎麼選，也可以先免費聊 15 分鐘。", learn: "查看詳情", teamEyebrow: "先認識人，再談方案", teamTitle: "你不會拿到一份所有人都一樣的標準答案。", teamText: "我們的多語言營養師會先聽你說，把複雜的事講明白，再把方法放進你的飲食、文化、作息和身體狀況裡。", teamLink: "認識營養師", directorTitle: "需要時有醫生一起支援", directorText: "如果照護涉及臨床評估或處方，Leon Katz 醫生可以參與判斷和跟進。", finalTitle: "先聊 15 分鐘，今天不用做任何決定。", finalText: "告訴我們你在找什麼。我們可以先回答問題、查詢保險，再幫你找到合適的人。", finalButton: "免費約個時間聊聊" },
  faq: {
    eyebrow: "開始前，先把問題說清楚", title: "常見問題", intro: "這些是大家第一次聯絡我們時最常問的幾件事。",
    q1: "營養師可以幫我處理哪些問題？", a1: "減重、GLP-1 營養支援、多囊、腸胃問題、心臟健康、孕期營養、進食困擾和運動營養等，都可以一起聊。如果你不知道該從哪裡開始，只要告訴我們現在最困擾你的事。",
    q2: "保險可以報銷營養諮詢嗎？", a2: "不少商業保險會報銷符合條件的營養諮詢，但每個計畫的規則不同。你提供保險資料後，我們會在開始前幫你查詢，並把可能的費用講清楚。",
    q3: "我怎麼知道哪位營養師適合我？", a3: "不用自己一個個挑。我們會根據你的目標、身體狀況、語言偏好、時間安排和你喜歡的溝通方式，幫你配對合適的營養師。",
    q4: "第一次諮詢會聊些什麼？", a4: "營養師會先聽你說健康和飲食經歷、最近最難處理的事，以及你最想改變什麼。結束時會一起定下幾件現實可做的事，不會直接塞給你一套標準答案。",
    q5: "GLP-1 支援具體包括什麼？", a5: "我們可以一起處理蛋白質、補水、吃飯節奏、胃口變化、副作用和用藥習慣。是否適合開藥需要單獨做臨床評估，也不保證一定會獲得處方。",
    cta1: "免費聊 15 分鐘，看看從哪裡開始", cta2: "免費聊 15 分鐘，先把保險問清楚", cta3: "免費聊 15 分鐘，讓我們幫你配對", cta4: "第一次會面前，先免費聊 15 分鐘", cta5: "免費聊 15 分鐘，了解 GLP-1 支援"
  },
  insurance: { badge: "支援商業保險", title: "你的保險可能可以報銷營養諮詢。", text: "告訴我們你的保險資料，我們會在開始前幫你查清可能的報銷和費用。", action: "幫我查保險", note: "實際報銷和費用取決於你的保險計畫及資格。" },
  footer: { note: "1對1減重、GLP-1 支援，以及需要時的醫學減重服務。", copyright: "NutriAll Wellness。保留所有權利。" }, mobileCta: "免費預約"
});

resources.es = { translation: {
  language: "Idioma",
  nav: { weight: "Pérdida de peso", clinical: "Diabetes y capacitación", insurance: "Seguro", team: "Nuestro equipo", resources: "Recursos", book: "Consulta gratuita", menu: "Menú", weightIntro: "Atención personalizada para una pérdida de peso sostenible.", clinicalIntro: "Educación y capacitación en dispositivos por especialistas.", oneToOne: "Pérdida de peso 1:1", glpCare: "Control de peso con GLP-1", medical: "Pérdida de peso médica", classes: "Clases de diabetes", pump: "Capacitación en bomba", cgm: "CGM e informes", glpTraining: "Capacitación en GLP-1", providers: "Para proveedores", recipes: "Recetas", research: "Investigación explicada", about: "Conozca a las dietistas" },
  home: { eyebrow: "Nutrición para la vida real · Aceptamos seguros", title: "La comida, la salud y la vida merecen una sola conversación.", intro: "Hable individualmente con una dietista sobre cómo come, cómo vive y qué desea cambiar. Podemos ayudar con el peso, GLP-1, SOP, salud digestiva y más.", primary: "Llamada gratuita de 15 minutos", secondary: "Ver si el seguro cubre la atención", trust: "Hable con nosotros en inglés, mandarín, cantonés, fuzhounés, hakka o español.", pathsEyebrow: "Empiece por lo que más le importa", pathsTitle: "¿Con qué podemos ayudarle hoy?", pathsIntro: "No necesita elegir primero el servicio correcto. Cuéntenos qué está viviendo y le ayudaremos a encontrar un buen punto de partida.", needsAction: "Ayúdeme a encontrar una dietista", needs: { weight: "Pérdida de peso", glp1: "GLP-1", pcos: "SOP", prediabetes: "Prediabetes", digestive: "Salud digestiva", sports: "Nutrición deportiva", diabetes: "Diabetes", heart: "Salud del corazón", pregnancy: "Embarazo y posparto", eating: "Trastornos alimentarios", celiac: "Enfermedad celíaca", kidney: "Salud renal", thyroid: "Salud tiroidea", cancer: "Nutrición oncológica", cholesterol: "Colesterol alto", menopause: "Menopausia", allergies: "Alergias alimentarias" }, path1Title: "Pérdida de peso 1:1", path1Text: "Trabaje en comidas, hambre y hábitos que sí caben en una semana ocupada.", path2Title: "Control de peso con GLP-1", path2Text: "Reciba ayuda con apetito, proteína, hidratación, efectos secundarios y los próximos pasos.", path3Title: "Pérdida de peso médica", path3Text: "Vea a una dietista y a un médico cuando una evaluación o un medicamento pueda ser útil.", explore: "Ver cómo funciona", processEyebrow: "Cómo funciona la atención", processTitle: "Un paso claro desde la primera llamada.", processIntro: "Desde la primera conversación hasta cada ajuste, sabrá en qué estamos trabajando juntos.", step1Title: "Cuéntenos qué pasa", step1Text: "Use un formulario breve, tanto si es paciente nuevo como si ya nos conoce.", step2Title: "Revisamos y buscamos", step2Text: "Revisamos su seguro y le conectamos con la persona adecuada.", step3Title: "Conozca a su dietista", step3Text: "Salga de la primera visita con pasos claros que encajen con su salud y rutina.", journeyAction: "Llamada gratuita de 15 minutos", journeyDietitianRole: "Dietista registrada", journeyAvailable: "Atención multilingüe", journeyScene1Label: "Antes de la primera visita", journeyScene1Title: "¿De qué quiere hablar primero?", journeyScene1Item1: "Su historia de salud y alimentación", journeyScene1Item2: "Lo que se ha vuelto difícil", journeyScene1Item3: "Lo que desea cambiar", journeyScene1Note: "No necesita un registro perfecto.", journeyScene2Label: "Nos preparamos juntos", journeyScene2Title: "La atención adecuada, bien coordinada", journeyScene2Item1: "Primero revisamos el seguro", journeyScene2Item2: "Una dietista acorde a sus necesidades", journeyScene2Item3: "Un horario que le convenga", journeyScene2Note: "Explicamos los costos antes de empezar.", journeyScene3Label: "Después de cada visita", journeyScene3Title: "Unos pocos pasos útiles", journeyScene3Item1: "Una meta realista para esta semana", journeyScene3Item2: "Notas que puede volver a consultar", journeyScene3Item3: "Ajustes en la próxima visita", journeyScene3Note: "El plan cambia cuando cambia la vida.", clinicalEyebrow: "Tres formas de empezar", clinicalTitle: "Atención para el peso adaptada a su punto de partida.", clinicalIntro: "Elija nutrición individual, apoyo con GLP-1 o atención médica coordinada. Si no sabe cuál, empiece con una llamada gratuita de 15 minutos.", learn: "Ver detalles", teamEyebrow: "Conozca a las personas", teamTitle: "No recibirá el mismo plan que todo el mundo.", teamText: "Nuestras dietistas multilingües escuchan primero y adaptan el apoyo a su comida, cultura, horario y salud.", teamLink: "Conocer a las dietistas", directorTitle: "Apoyo médico cuando hace falta", directorText: "Leon Katz, MD, puede apoyar la evaluación clínica y las decisiones de prescripción cuando formen parte de su atención.", finalTitle: "Hablemos 15 minutos. Hoy no tiene que decidir nada.", finalText: "Cuéntenos qué busca. Podemos responder sus primeras preguntas, revisar el seguro y ayudarle a encontrar a la persona adecuada.", finalButton: "Solicitar una llamada gratuita" },
  faq: {
    eyebrow: "Antes de empezar", title: "Preguntas frecuentes", intro: "Respuestas claras a las preguntas que más recibimos.",
    q1: "¿En qué puede ayudarme una dietista de NutriAll?", a1: "Ayudamos con peso, apoyo nutricional para GLP-1, SOP, salud digestiva, corazón, embarazo, deporte, inquietudes alimentarias y más. Si no sabe por dónde empezar, cuéntenos qué le preocupa y le orientaremos.",
    q2: "¿Mi seguro cubre las visitas de nutrición?", a2: "Muchos seguros comerciales cubren visitas elegibles, pero cada plan es diferente. Comparta sus datos y revisaremos la cobertura y los posibles costos antes de empezar.",
    q3: "¿Cómo encuentro a la dietista adecuada?", a3: "No tiene que elegir sin ayuda. Le asignamos una dietista según sus objetivos, necesidades de salud, idioma, horario y el tipo de apoyo que busca.",
    q4: "¿Qué ocurre en la primera visita?", a4: "La dietista escuchará su historia de salud y alimentación, qué se siente difícil ahora y qué desea cambiar. Saldrá con unos pasos realistas, no con un plan rígido igual para todos.",
    q5: "¿Qué incluye el apoyo con GLP-1?", a5: "Ayudamos con proteína, hidratación, horarios de comida, cambios de apetito, efectos secundarios y rutinas de medicación. La prescripción requiere una evaluación clínica individual y no está garantizada.",
    cta1: "Reserve una llamada gratuita de 15 minutos para empezar", cta2: "Reserve una llamada gratuita para aclarar su seguro", cta3: "Reserve una llamada gratuita y le ayudaremos a elegir", cta4: "Hable con nosotros gratis antes de su primera visita", cta5: "Reserve una llamada gratuita sobre el apoyo con GLP-1"
  },
  insurance: { badge: "Aceptamos seguros", title: "Su seguro puede cubrir las visitas de nutrición.", text: "Comparta los datos de su plan y revisaremos qué puede cubrir antes de empezar.", action: "Revisar mi seguro", note: "La cobertura y el costo dependen del plan y la elegibilidad." },
  about: { eyebrow: "Acerca de NutriAll", title: "Nutrición centrada en la persona completa.", intro: "Nuestras dietistas conectan el control de peso, el apoyo con GLP-1, la cultura y la vida diaria en un plan práctico.", valuesTitle: "Atención clínica, práctica y respetuosa.", value1: "Basada en evidencia", value1Text: "Recomendaciones según la ciencia y su historial de salud.", value2: "Para la vida real", value2Text: "Planes adaptados a cultura, horario, familia, acceso y preferencias.", value3: "Sin vergüenza", value3Text: "El progreso y los contratiempos son información, nunca motivo de culpa.", teamEyebrow: "Nuestras dietistas", teamTitle: "Conozca al equipo que le atiende.", teamText: "El equipo aporta experiencia en peso, nutrición para GLP-1, salud digestiva, deporte, alimentación intuitiva y más.", director: "Supervisión médica cuando se necesita", directorText: "Leon Katz, MD, brinda liderazgo en medicina de obesidad, evaluación clínica y supervisión de prescripción cuando corresponde.", cta: "Encuentre la dietista adecuada" },
  book: { badge: "Consulta gratuita de 15 minutos", title: "Comience con una breve revisión de seguro y atención.", intro: "Díganos cuándo llamarle. Verificaremos beneficios, responderemos preguntas y le ayudaremos a elegir el servicio.", short: "Un formulario breve", noCommitment: "Sin compromiso", verification: "Verificación de seguro", whatsapp: "Escríbanos por WhatsApp", starting: "Punto de partida", adjust: "Podemos ajustarlo durante la llamada.", request: "Solicitar llamada", timeTitle: "Elija un horario conveniente.", required: "Los campos obligatorios nos ayudan a contactarle. El seguro es opcional.", name: "Nombre completo", email: "Correo electrónico", phone: "Teléfono", age: "Edad", preferred: "Idioma preferido", selectLanguage: "Seleccione un idioma", patientQuestion: "¿Ha recibido atención de NutriAll antes?", newPatient: "Soy paciente nuevo", returningPatient: "Soy paciente actual", bestTime: "Mejor horario para llamar", selectTime: "Seleccione un horario", optionalInsurance: "Información opcional del seguro", insuranceHelp: "Comparta estos datos si desea que verifiquemos beneficios antes de llamar.", company: "Compañía de seguro", memberId: "ID de miembro", dob: "Fecha de nacimiento", submit: "Solicitar consulta gratuita", submitting: "Enviando...", disclaimer: "Al enviar, autoriza a NutriAll a contactarle. No use este formulario para urgencias médicas.", error: "No pudimos enviar su solicitud. Intente de nuevo o contáctenos por WhatsApp." },
  weightServices: { eyebrow: "Atención personalizada para el peso", help: "Cómo le ayuda esta atención", process: "Qué puede esperar", team: "Su equipo", insuranceNote: "Las visitas de nutrición elegibles pueden estar cubiertas por un seguro comercial. Verificamos beneficios antes de comenzar.", oneToOne: { title: "Pérdida de peso 1:1", summary: "Nutrición para perder grasa adaptada a su salud, cultura, preferencias y rutina real.", points: ["Plan práctico de proteína y fibra", "Estrategias para trabajo, viajes, restaurantes y familia", "Apoyo para hambre, estancamientos y constancia", "Seguimiento sin vergüenza ni reglas rígidas"], steps: ["Complete una solicitud breve", "Le asignamos una dietista registrada", "Cree y ajuste un plan repetible"], note: "Su dietista considera historial de peso, apetito, medicamentos, movimiento, sueño, estrés y barreras previas." }, glpCare: { title: "Control de peso con GLP-1", summary: "Apoyo nutricional y clínico antes, durante o después del tratamiento GLP-1.", points: ["Proteína, hidratación, fibra y ritmo de comidas", "Rutinas de medicamentos inyectables u orales", "Plan para náuseas, estreñimiento y apetito", "Preguntas y registro de síntomas para su médico"], steps: ["Revise su etapa y objetivos", "Cree un plan sensible a síntomas", "Ajuste el apoyo con cambios de apetito y dosis"], note: "El medicamento requiere evaluación clínica individual. No se garantizan producto, receta, disponibilidad ni cobertura." }, medical: { title: "Pérdida de peso médica", summary: "Una vía coordinada que combina evaluación médica de obesidad y nutrición individual.", points: ["Revisión médica y del historial de peso", "Contexto de medicamentos, laboratorios y riesgos", "Evaluación nutricional personalizada", "Seguimiento médico y nutricional"], steps: ["Envíe una solicitud breve", "Reúnase con el profesional adecuado", "Comience con prioridades claras"], note: "El tratamiento con receta solo se ofrece cuando es clínicamente apropiado. Los resultados varían y no se garantiza una pérdida específica." }, insurance: { title: "Seguro y costo", summary: "Comprenda la posible cobertura antes de comenzar.", points: ["Red y costos de visitas médicas", "Beneficios y límites de nutrición", "Requisitos de referido o autorización", "Cobertura de medicamentos por separado"], steps: ["Comparta datos opcionales del seguro", "Revisamos los beneficios relevantes", "Reciba un siguiente paso más claro"], note: "La cobertura y el costo dependen del plan, red, diagnóstico, elegibilidad y ubicación." } },
  services: { eyebrow: "Atención especializada en diabetes", appointment: "Solicitar una cita", what: "Cómo podemos ayudarle", expect: "Qué puede esperar", insurance: "Muchas visitas elegibles pueden estar cubiertas por un seguro comercial. Verificamos los beneficios antes de comenzar.", classes: { title: "Clases de diabetes", summary: "Educación estructurada sobre alimentación, medicamentos, ejercicio, monitoreo y rutinas diarias.", points: ["Comprender la diabetes y la glucosa", "Carbohidratos y planificación de comidas", "Medicamentos, actividad y reducción de riesgos", "Resolución de problemas y rutinas sostenibles"], steps: ["Educación por dietistas especializadas", "Lecciones prácticas para usar en casa", "Apoyo multilingüe y culturalmente sensible"] }, pump: { title: "Capacitación en bomba de insulina", summary: "Configuración práctica y confianza para los sistemas modernos de bomba de insulina.", points: ["Preparación y configuración", "Sitios de infusión y suministros", "Basal, bolos, alertas y seguridad", "Solución de problemas"], steps: ["Traiga su dispositivo recetado", "Capacitación individual con un especialista", "Pasos claros de seguridad y seguimiento"] }, cgm: { title: "Capacitación e informes de CGM", summary: "Configuración del sensor, apoyo con aplicaciones e interpretación de patrones.", points: ["Colocación y conexión", "Alertas, tendencias y tiempo en rango", "Revisión de informes AGP", "Patrones de comida, actividad y medicación"], steps: ["Apoyo para los principales sistemas", "Informes explicados claramente", "Información para compartir con su equipo médico"] }, glpTraining: { title: "Capacitación en medicamentos GLP-1", summary: "Capacitación práctica para medicamentos inyectables y orales, incluyendo técnica y efectos secundarios.", points: ["Técnica de inyección y rutinas", "Almacenamiento, viajes y dosis omitidas", "Proteína, hidratación y comidas", "Plan para náuseas y estreñimiento"], steps: ["Use correctamente su medicamento recetado", "Sepa qué vigilar y cuándo llamar", "Cree rutinas nutricionales de apoyo"] }, providers: { title: "Para proveedores", summary: "Recursos de referidos y apoyo educativo para clínicas y equipos de atención.", points: ["Educación para el autocontrol", "Terapia nutricional médica", "Capacitación en bomba, CGM y medicamentos", "Comunicación con el equipo que refiere"], steps: ["Refiera pacientes que necesitan más educación", "Ofrezca apoyo multilingüe y cultural", "Amplíe la capacidad educativa de su clínica"] } },
  footer: { note: "Pérdida de peso 1:1, apoyo con GLP-1 y atención médica coordinada cuando se necesita.", copyright: "NutriAll Wellness. Todos los derechos reservados." }, mobileCta: "Consulta gratuita"
} };

resources.en.translation.nav.weight = "Service";
resources.en.translation.weightServices.bookNow = "Book Now";
resources["zh-CN"].translation.nav.weight = "服务";
resources["zh-CN"].translation.weightServices.bookNow = "立即预约";
resources["zh-TW"].translation.nav.weight = "服務";
resources["zh-TW"].translation.weightServices.bookNow = "立即預約";
resources.es.translation.nav.weight = "Servicios";
resources.es.translation.weightServices.bookNow = "Reservar ahora";

resources.en.translation.nav.community = "Community Programs";
resources.en.translation.community = {
  eyebrow: "For communities and organizations",
  contractBadge: "Programs planned and delivered by NutriAll",
  title: "Nutrition classes, contracted and run for your community.",
  intro: "Churches, community centers, senior programs, nonprofits, and employee benefit teams can hire NutriAll to plan and deliver practical nutrition education, from a single class to a large community event.",
  imageAlt: "A presenter leading a community education workshop for adults",
  book: "Book a Free Call",
  homeTitle: "Need nutrition classes for your members? We can run the whole program.",
  homeText: "Tell us who you serve, how many people may attend, and what they want to learn. We can take on the topic, registered dietitian speaker, teaching materials, and live Q&A.",
  homeFormat1: "One-time workshop", homeFormat2: "Ongoing class series", homeFormat3: "Conference or health event", homeAction: "See program options",
  audiencesEyebrow: "Who can work with us", audiencesTitle: "Built for organizations that want to offer a useful health benefit.",
  audiences: ["Churches and faith communities", "Community and senior centers", "Nonprofits and cultural organizations", "Benefit teams and event organizers"],
  formatsEyebrow: "Ways to partner", formatsTitle: "Contract one class, a series, or a full event.",
  formatsIntro: "We shape the scope around your audience, venue, schedule, and budget.",
  formats: [
    { title: "One-time workshop", text: "A focused class with practical takeaways and time for audience questions." },
    { title: "Multi-session series", text: "A repeatable learning program that builds skills over several weeks or months." },
    { title: "Conference or community health event", text: "A larger talk, breakout session, panel, or nutrition education track for an open event." },
  ],
  deliveryEyebrow: "What NutriAll can handle", deliveryTitle: "A ready-to-run program, not just a speaker.",
  deliveryIntro: "We agree on the scope before the event so your team knows exactly what is included.",
  delivery: ["Topic planning for your audience", "Registered dietitian educator", "Plain-language teaching materials", "Live questions and discussion", "Multilingual and culturally relevant options", "Coordination for small groups or large rooms"],
  languageNote: "Programs may be available in English, Mandarin, Cantonese, Fuzhounese, Hakka, or Spanish depending on the topic and schedule.",
  processEyebrow: "How to start", processTitle: "Start with one free 15-minute call.",
  process: ["Tell us about your organization, audience, and preferred dates.", "We recommend a format, topics, language, and scope.", "Once approved, we coordinate the program and deliver the session."],
  finalTitle: "Planning a class, church benefit, or community event?",
  finalText: "Book a free call and tell us what you need. We will discuss audience size, format, language, timing, and the next step for a program proposal.",
};

resources["zh-CN"].translation.nav.community = "社区课程承办";
resources["zh-CN"].translation.community = {
  eyebrow: "面向社区与机构的承办服务",
  contractBadge: "NutriAll 整套承接与执行",
  title: "社区、教会需要营养福利课程，我们可以整套承接。",
  intro: "教会、社区中心、老人中心、非营利机构和员工福利团队，都可以委托 NutriAll 策划并执行营养健康课程。从一场讲座、系列课程到开放式大会都可以合作。",
  imageAlt: "讲师正在为社区里的成年人开展集体课程",
  book: "免费聊 15 分钟",
  homeTitle: "想为会员或居民开营养课？策划和执行都可以交给我们。",
  homeText: "告诉我们服务对象、大概人数和大家最想了解的内容。课程主题、注册营养师讲师、讲义和现场问答，都可以由 NutriAll 负责。",
  homeFormat1: "单场福利讲座", homeFormat2: "连续系列课程", homeFormat3: "大会或健康活动", homeAction: "查看承办方式",
  audiencesEyebrow: "适合哪些机构", audiencesTitle: "想为大家提供一项真正有用的健康福利，都可以来联系。",
  audiences: ["教会与宗教社区", "社区中心与老人中心", "非营利与文化机构", "员工福利团队与活动主办方"],
  formatsEyebrow: "合作方式", formatsTitle: "一场课、一个系列，或者一场大会，都可以承接。",
  formatsIntro: "我们会根据参与人群、场地、时间和预算一起确定范围。",
  formats: [
    { title: "单场福利讲座", text: "围绕一个实用主题讲清重点，并留出时间回答大家的问题。" },
    { title: "连续系列课程", text: "按周或按月开展，让参与者逐步学会可以带回家使用的方法。" },
    { title: "大会或社区健康活动", text: "可以承接大型公开讲座、分会场、圆桌分享或整组营养课程。" },
  ],
  deliveryEyebrow: "我们可以负责什么", deliveryTitle: "不只是派一位讲师，而是一套可以直接落地的课程。",
  deliveryIntro: "活动开始前先把范围讲清楚，主办方会明确知道包含哪些内容。",
  delivery: ["根据参与人群设计主题", "安排注册营养师讲师", "准备容易看懂的课程材料", "现场提问与互动讨论", "多语言和文化饮食内容", "小班课堂与大型会场协调"],
  languageNote: "根据主题和时间安排，课程可提供英语、普通话、粤语、福州话、客家话或西班牙语。",
  processEyebrow: "怎么开始", processTitle: "先免费聊 15 分钟，把需求说清楚。",
  process: ["告诉我们机构类型、参与人群和大概时间。", "我们建议课程形式、主题、语言和承办范围。", "方案确认后，由我们协调并完成现场或线上课程。"],
  finalTitle: "正在筹备社区课程、教会福利或大型健康活动？",
  finalText: "直接预约一次免费电话，告诉我们人数、形式、语言和时间。我们会进一步讨论并准备合作方案。",
};

resources["zh-TW"].translation.nav.community = "社區課程承辦";
resources["zh-TW"].translation.community = {
  eyebrow: "面向社區與機構的承辦服務",
  contractBadge: "NutriAll 整套承接與執行",
  title: "社區、教會需要營養福利課程，我們可以整套承接。",
  intro: "教會、社區中心、老人中心、非營利機構和員工福利團隊，都可以委託 NutriAll 策劃並執行營養健康課程。從一場講座、系列課程到開放式大會都可以合作。",
  imageAlt: "講師正在為社區裡的成年人開展集體課程",
  book: "免費聊 15 分鐘",
  homeTitle: "想為會員或居民開營養課？策劃和執行都可以交給我們。",
  homeText: "告訴我們服務對象、大概人數和大家最想了解的內容。課程主題、註冊營養師講師、講義和現場問答，都可以由 NutriAll 負責。",
  homeFormat1: "單場福利講座", homeFormat2: "連續系列課程", homeFormat3: "大會或健康活動", homeAction: "查看承辦方式",
  audiencesEyebrow: "適合哪些機構", audiencesTitle: "想為大家提供一項真正有用的健康福利，都可以來聯絡。",
  audiences: ["教會與宗教社區", "社區中心與老人中心", "非營利與文化機構", "員工福利團隊與活動主辦方"],
  formatsEyebrow: "合作方式", formatsTitle: "一場課、一個系列，或者一場大會，都可以承接。",
  formatsIntro: "我們會根據參與人群、場地、時間和預算一起確定範圍。",
  formats: [
    { title: "單場福利講座", text: "圍繞一個實用主題講清重點，並留出時間回答大家的問題。" },
    { title: "連續系列課程", text: "按週或按月開展，讓參與者逐步學會可以帶回家使用的方法。" },
    { title: "大會或社區健康活動", text: "可以承接大型公開講座、分會場、圓桌分享或整組營養課程。" },
  ],
  deliveryEyebrow: "我們可以負責什麼", deliveryTitle: "不只是派一位講師，而是一套可以直接落地的課程。",
  deliveryIntro: "活動開始前先把範圍講清楚，主辦方會明確知道包含哪些內容。",
  delivery: ["根據參與人群設計主題", "安排註冊營養師講師", "準備容易看懂的課程材料", "現場提問與互動討論", "多語言和文化飲食內容", "小班課堂與大型會場協調"],
  languageNote: "根據主題和時間安排，課程可提供英語、普通話、粵語、福州話、客家話或西班牙語。",
  processEyebrow: "怎麼開始", processTitle: "先免費聊 15 分鐘，把需要說清楚。",
  process: ["告訴我們機構類型、參與人群和大概時間。", "我們建議課程形式、主題、語言和承辦範圍。", "方案確認後，由我們協調並完成現場或線上課程。"],
  finalTitle: "正在籌備社區課程、教會福利或大型健康活動？",
  finalText: "直接預約一次免費電話，告訴我們人數、形式、語言和時間。我們會進一步討論並準備合作方案。",
};

resources.es.translation.nav.community = "Programas comunitarios";
resources.es.translation.community = {
  eyebrow: "Programas para comunidades y organizaciones",
  contractBadge: "NutriAll planifica y ejecuta el programa completo",
  title: "Clases de nutrición contratadas y organizadas para su comunidad.",
  intro: "Iglesias, centros comunitarios, programas para mayores, organizaciones sin fines de lucro y equipos de beneficios pueden contratar a NutriAll para planificar e impartir educación nutricional, desde una clase hasta un gran evento.",
  imageAlt: "Una presentadora dirige un taller educativo para adultos de la comunidad",
  book: "Consulta gratuita",
  homeTitle: "¿Necesita clases de nutrición para sus miembros? Nosotros organizamos todo el programa.",
  homeText: "Cuéntenos a quién atiende, cuántas personas asistirán y qué desean aprender. Podemos encargarnos del tema, la dietista, los materiales y las preguntas en vivo.",
  homeFormat1: "Taller único", homeFormat2: "Serie de clases", homeFormat3: "Conferencia o feria de salud", homeAction: "Ver opciones",
  audiencesEyebrow: "Quién puede colaborar", audiencesTitle: "Para organizaciones que desean ofrecer un beneficio de salud realmente útil.",
  audiences: ["Iglesias y comunidades de fe", "Centros comunitarios y para mayores", "Organizaciones culturales y sin fines de lucro", "Equipos de beneficios y organizadores de eventos"],
  formatsEyebrow: "Formas de colaborar", formatsTitle: "Contrate una clase, una serie o un evento completo.",
  formatsIntro: "Adaptamos el alcance al público, lugar, horario y presupuesto.",
  formats: [
    { title: "Taller único", text: "Una clase enfocada con consejos prácticos y tiempo para preguntas." },
    { title: "Serie de clases", text: "Un programa continuo para desarrollar habilidades durante semanas o meses." },
    { title: "Conferencia o evento comunitario", text: "Una charla grande, sesión, panel o programa educativo para un evento abierto." },
  ],
  deliveryEyebrow: "De qué nos encargamos", deliveryTitle: "Un programa listo para ejecutar, no solo una ponente.",
  deliveryIntro: "Acordamos el alcance antes del evento para que su equipo sepa exactamente qué incluye.",
  delivery: ["Planificación de temas", "Dietista registrada", "Materiales fáciles de entender", "Preguntas y conversación", "Opciones multilingües y culturales", "Coordinación para grupos pequeños o grandes"],
  languageNote: "Según el tema y el horario, puede haber programas en inglés, mandarín, cantonés, fuzhounés, hakka o español.",
  processEyebrow: "Cómo empezar", processTitle: "Empiece con una llamada gratuita de 15 minutos.",
  process: ["Cuéntenos sobre su organización, público y fechas.", "Recomendamos formato, temas, idioma y alcance.", "Al aprobarse, coordinamos e impartimos el programa."],
  finalTitle: "¿Está organizando una clase, beneficio de iglesia o evento comunitario?",
  finalText: "Reserve una llamada gratuita y díganos qué necesita. Hablaremos del número de asistentes, formato, idioma, horario y próximos pasos.",
};

Object.assign(resources.en.translation.about, {
  storyEyebrow: "Founders' story",
  storyTitle: "Bringing culturally rooted, multilingual nutrition to life.",
  storyLead: "NutriAll grew from a barrier we kept seeing: families were being asked to improve their health without care that spoke their language, understood their food, or fit their budget.",
  storyBelief: "Nutrition guidance should never ask someone to give up their mother tongue, their culture, or their peace of mind.",
  storyParagraphs: [
    "We watched a grandmother nod politely through a clinic visit while understanding very little of the medical language because no one spoke Cantonese or Fuzhounese. The problem was not her willingness to learn. The care had not been built for her.",
    "We met mothers handed rigid diet sheets filled with foods they had never cooked, as if the dishes they grew up with were automatically unhealthy. We also saw working families walk away from preventive Medical Nutrition Therapy because the out-of-pocket cost felt impossible.",
    "NutriAll began when three dietitian co-founders came together around one urgent goal: remove those barriers and build a multilingual group practice that families could actually use.",
    "In the early days, we spent late nights learning insurance networks so eligible clients could use their benefits and understand costs before starting. We turned evidence-based nutrition science into everyday meals that respect traditional ingredients. We also welcomed and trained emerging clinicians from NYU, Columbia University, CUNY, and other institutions, helping prepare a more diverse and culturally responsive profession.",
    "Today, our team provides personalized one-to-one care in English, Mandarin, Cantonese, Fuzhounese, and Hakka. Speaking our clients' language, both literally and culturally, is still the heart of NutriAll. We are here to listen, celebrate your heritage, and walk beside you toward health that lasts.",
  ],
});

Object.assign(resources["zh-CN"].translation.about, {
  storyEyebrow: "创办人的故事",
  storyTitle: "让多语言、尊重文化的营养照护真正落地。",
  storyLead: "NutriAll 的起点，是我们一次又一次看到同一个问题：很多家庭想照顾好身体，却找不到听得懂、吃得惯、也负担得起的营养服务。",
  storyBelief: "营养建议不应该让任何人放弃自己的母语、饮食文化，或对生活的安心感。",
  storyParagraphs: [
    "我们见过一位奶奶在诊室里礼貌地点头，却因为没有人会说粤语或福州话，几乎听不懂那些医学术语。问题不是她不愿意学，而是这套服务从一开始就没有真正考虑她。",
    "我们也见过妈妈拿到一张严格的饮食单，上面全是她从来不会做的食物，仿佛从小吃到大的家乡菜都不健康。还有不少认真生活、努力工作的家庭，因为自费金额太高，只能放弃原本可以帮助预防和管理疾病的医学营养治疗（MNT）。",
    "NutriAll 就是在这样的背景下开始的。三位营养师共同创办了这家机构，希望把语言、文化和费用上的障碍一项项拆掉，让更多家庭真正用得上专业营养服务。",
    "刚开始时，我们常常花很多个晚上研究保险网络，帮助符合条件的客户使用保险，并在服务开始前把可能的费用讲清楚。我们把循证营养知识变成日常饭桌上做得到的方法，也尊重大家熟悉的传统食材。我们还接收并培养来自 NYU、Columbia University、CUNY 等院校的年轻临床人员，希望让未来的营养专业更加多元，也更懂不同文化。",
    "今天，我们的团队可以用英语、普通话、粤语、福州话和客家话提供一对一服务。真正听懂客户的语言，也理解语言背后的饮食和生活，依然是 NutriAll 最重要的事。我们会认真听你说，尊重你的传统，陪你一步步找到能够长期坚持的健康方式。",
  ],
});

Object.assign(resources["zh-TW"].translation.about, {
  storyEyebrow: "創辦人的故事",
  storyTitle: "讓多語言、尊重文化的營養照護真正落地。",
  storyLead: "NutriAll 的起點，是我們一次又一次看到同一個問題：很多家庭想照顧好身體，卻找不到聽得懂、吃得慣、也負擔得起的營養服務。",
  storyBelief: "營養建議不應該讓任何人放棄自己的母語、飲食文化，或對生活的安心感。",
  storyParagraphs: [
    "我們見過一位奶奶在診間裡禮貌地點頭，卻因為沒有人會說粵語或福州話，幾乎聽不懂那些醫學術語。問題不是她不願意學，而是這套服務從一開始就沒有真正考慮她。",
    "我們也見過媽媽拿到一張嚴格的飲食單，上面全是她從來不會做的食物，彷彿從小吃到大的家鄉菜都不健康。還有不少認真生活、努力工作的家庭，因為自費金額太高，只能放棄原本可以幫助預防和管理疾病的醫學營養治療（MNT）。",
    "NutriAll 就是在這樣的背景下開始的。三位營養師共同創辦了這家機構，希望把語言、文化和費用上的障礙一項項拆掉，讓更多家庭真正用得上專業營養服務。",
    "剛開始時，我們常常花很多個晚上研究保險網絡，幫助符合條件的客戶使用保險，並在服務開始前把可能的費用講清楚。我們把循證營養知識變成日常飯桌上做得到的方法，也尊重大家熟悉的傳統食材。我們還接收並培養來自 NYU、Columbia University、CUNY 等院校的年輕臨床人員，希望讓未來的營養專業更加多元，也更懂不同文化。",
    "今天，我們的團隊可以用英語、普通話、粵語、福州話和客家話提供一對一服務。真正聽懂客戶的語言，也理解語言背後的飲食和生活，依然是 NutriAll 最重要的事。我們會認真聽你說，尊重你的傳統，陪你一步步找到能夠長期堅持的健康方式。",
  ],
});

Object.assign(resources.es.translation.about, {
  storyEyebrow: "La historia de las fundadoras",
  storyTitle: "Nutrición multilingüe, conectada con la cultura y la vida real.",
  storyLead: "NutriAll nació de una barrera que veíamos una y otra vez: muchas familias querían cuidar su salud, pero no encontraban atención en su idioma, respetuosa de su comida y accesible para su presupuesto.",
  storyBelief: "La orientación nutricional nunca debería pedirle a alguien que renuncie a su lengua materna, su cultura o su tranquilidad.",
  storyParagraphs: [
    "Vimos a una abuela asentir con cortesía durante una consulta mientras entendía muy poco del lenguaje médico, porque nadie hablaba cantonés o fuzhounés. El problema no era su voluntad de aprender. La atención no había sido diseñada para ella.",
    "También conocimos a madres que recibían dietas rígidas llenas de alimentos que nunca habían cocinado, como si sus platos tradicionales fueran automáticamente poco saludables. Y vimos a familias trabajadoras renunciar a la terapia nutricional médica preventiva porque el costo de bolsillo era demasiado alto.",
    "NutriAll comenzó cuando tres dietistas cofundadoras se unieron con un objetivo urgente: derribar esas barreras y crear una práctica multilingüe que las familias realmente pudieran utilizar.",
    "Al principio pasamos muchas noches aprendiendo las redes de seguros para que los clientes elegibles pudieran usar sus beneficios y conocer los costos antes de empezar. Convertimos la ciencia nutricional en comidas cotidianas que respetan los ingredientes tradicionales. También recibimos y formamos a futuros profesionales de NYU, Columbia University, CUNY y otras instituciones.",
    "Hoy ofrecemos atención individual en inglés, mandarín, cantonés, fuzhounés y hakka. Hablar el idioma de nuestros clientes, de forma literal y cultural, sigue siendo el corazón de NutriAll. Estamos aquí para escuchar, celebrar su herencia y acompañarle hacia una salud duradera.",
  ],
});

i18n.use(LanguageDetector).use(initReactI18next).init({
  resources,
  fallbackLng: "en",
  supportedLngs: supportedLocales,
  load: "currentOnly",
  detection: { order: ["querystring", "localStorage", "navigator", "htmlTag"], lookupQuerystring: "lng", caches: ["localStorage"] },
  interpolation: { escapeValue: false },
  react: { useSuspense: false },
});

export default i18n;
