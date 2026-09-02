export const serviceGroups = [
  { id: "weight", items: ["weight-loss", "glp1", "medical-weight-loss"] },
  { id: "women", items: ["pcos", "pregnancy-postpartum", "menopause-nutrition", "thyroid-health"] },
  { id: "chronic", items: ["heart-health", "high-cholesterol", "kidney-health"] },
  { id: "food", items: ["digestive-health", "celiac-disease", "food-allergies", "eating-disorders"] },
  { id: "other", items: ["sports-nutrition", "cancer-nutrition"] },
];

export const servicePaths = {
  "weight-loss": "/one-to-one-weight-loss",
  glp1: "/glp1-care",
  "medical-weight-loss": "/medical-weight-loss",
  pcos: "/conditions/pcos",
  "pregnancy-postpartum": "/conditions/pregnancy-postpartum",
  "menopause-nutrition": "/conditions/menopause-nutrition",
  "thyroid-health": "/conditions/thyroid-health",
  "heart-health": "/conditions/heart-health",
  "high-cholesterol": "/conditions/high-cholesterol",
  "kidney-health": "/conditions/kidney-health",
  "digestive-health": "/conditions/digestive-health",
  "celiac-disease": "/conditions/celiac-disease",
  "food-allergies": "/conditions/food-allergies",
  "eating-disorders": "/conditions/eating-disorders",
  "sports-nutrition": "/conditions/sports-nutrition",
  "cancer-nutrition": "/conditions/cancer-nutrition",
};

const en = {
  common: { learn: "See details", book: "Book a free 15-minute consultation", required: "Required", optional: "Optional" },
  services: {
    eyebrow: "Nutrition services", title: "NutriAll nutrition services", intro: "NutriAll dietitians work with weight, medications, digestive symptoms, women's health, chronic conditions, sports, and food concerns. A free 15-minute consultation can help you choose the right appointment.",
    groupNames: { weight: "Weight care", women: "Women's and hormone health", chronic: "Heart and kidney health", food: "Digestion and eating", other: "Other nutrition needs" },
    items: {
      "weight-loss": ["1:1 Weight Loss", "Meal planning, appetite, habits, and progress without a standard diet sheet."],
      glp1: ["GLP-1 Nutrition Support", "Protein, fluids, meal timing, and side-effect planning during GLP-1 treatment."],
      "medical-weight-loss": ["Medical Weight Loss", "Dietitian care coordinated with physician evaluation when medication may be appropriate."],
      pcos: ["PCOS", "Meals and routines for energy, insulin response, cholesterol, fertility, or weight goals."],
      "pregnancy-postpartum": ["Pregnancy & Postpartum", "Practical nutrition for pregnancy symptoms, recovery, feeding, and changing needs."],
      "menopause-nutrition": ["Menopause Nutrition", "Support for bone, heart, muscle, sleep, symptoms, and changing body composition."],
      "thyroid-health": ["Thyroid Health", "Meal, supplement, and medication-timing questions alongside medical thyroid care."],
      "heart-health": ["Heart Health", "Food changes for blood pressure, cholesterol, and cardiovascular risk."],
      "high-cholesterol": ["High Cholesterol", "Specific changes to saturated fat, soluble fiber, cooking, and restaurant meals."],
      "kidney-health": ["Kidney Health", "Nutrition based on kidney stage, labs, medicines, and dialysis status."],
      "digestive-health": ["Digestive Health", "Structured help for reflux, bloating, constipation, diarrhea, IBS, and food tolerance."],
      "celiac-disease": ["Celiac Disease", "Gluten-free eating, cross-contact, labels, eating out, and nutrient adequacy."],
      "food-allergies": ["Food Allergies", "Safe substitutions, label reading, cross-contact, and complete nutrition."],
      "eating-disorders": ["Eating Disorders", "Nutrition care coordinated with medical and mental-health treatment."],
      "sports-nutrition": ["Sports Nutrition", "Fueling, hydration, recovery, and practical plans for training schedules."],
      "cancer-nutrition": ["Cancer Nutrition", "Support for appetite, treatment side effects, strength, and adequate intake."],
    },
    diabetesTitle: "Need DSMES, pump, or CGM training?", diabetesText: "XT Diabetes Care provides structured diabetes education and device training. NutriAll can still help with everyday nutrition and related health goals.", diabetesAction: "See diabetes education options",
    finalTitle: "Need help choosing a service?",
  },
  inquiry: {
    eyebrow: "For organizations", title: "Tell us about the class or event you are planning.", intro: "This form is for churches, community centers, nonprofits, employers, and event organizers. We will reply with questions about scope, availability, and next steps.",
    fields: { organization: "Organization name", organizationType: "Organization type", contactName: "Contact person", email: "Work email", phone: "Phone", audienceSize: "Estimated attendance", audienceAge: "Audience age group", language: "Preferred language", topic: "Topics of interest", format: "Program format", delivery: "In person or online", date: "Preferred date or timeframe", location: "Location", budget: "Budget range", notes: "What would you like us to know?", consent: "I agree that NutriAll may contact me about this program request." },
    options: { organizationType: ["Church or faith community", "Community or senior center", "Nonprofit or cultural organization", "Employer or benefit team", "School or education program", "Other"], audienceAge: ["Children or teens", "Adults", "Older adults", "Mixed ages"], language: ["English", "Mandarin", "Cantonese", "Fuzhounese", "Hakka", "Spanish", "Multiple languages", "Not sure"], format: ["One-time workshop", "Multi-session series", "Conference or health event", "Not sure"], delivery: ["In person", "Online", "Either"] },
    submit: "Send program request", submitting: "Sending...", privacy: "We use this information only to respond to your program request.", privacyLink: "Read our privacy notice.", error: "The request could not be sent. Please review the form or try again.",
    thanksTitle: "We received your program request.", thanksText: "A NutriAll team member will review the audience, format, language, and timing you shared, then contact you about the next step.", back: "Return to community programs",
  },
  events: {
    eyebrow: "Community work", title: "Classes, health events, and professional presentations.", intro: "These photos show NutriAll educators teaching community members, meeting families at health events, and presenting culturally tailored diabetes education to other professionals.", cta: "Ask about a community program",
    captions: ["Community diabetes class", "Neighborhood family health fair", "Community nutrition booth", "Class at a senior community center", "Bilingual DSMES poster presentation", "ADCES conference presentation", "FNCE nutrition conference", "NutriAll community team", "Nutrition class at a senior center", "Diabetes education conference team", "ADCES professional conference", "NutriAll dietitians at FNCE"],
  },
  privacy: {
    eyebrow: "Privacy", title: "How we use information submitted on this website.", updated: "Last updated September 2, 2026", intro: "This notice covers website forms, consultation requests, program inquiries, surveys, and basic website analytics. It does not replace any separate notice provided when clinical care begins.",
    sections: [
      ["Information you provide", "Forms may ask for contact details, preferred language, age, scheduling preferences, insurance information, health interests, organization details, or survey answers. Optional fields are marked as optional."],
      ["Why we collect it", "We use submitted information to answer requests, check possible insurance benefits, arrange services, respond to organizations, send confirmations, and improve our programs."],
      ["Service providers", "We use service providers for hosting, email, forms, analytics, surveys, and scheduling. Kalix and WhatsApp have their own privacy practices when you leave this website."],
      ["Website analytics", "We record page visits and actions such as opening WhatsApp or Kalix. We do not place form answers, insurance member IDs, or dates of birth into analytics events."],
      ["Your choices", "You can leave optional fields blank. You may contact NutriAll to ask about information submitted through this website or to request a correction."],
      ["Security and medical emergencies", "We use reasonable safeguards, but no internet service can guarantee absolute security. Do not use website forms for urgent medical concerns. Call emergency services when immediate help is needed."],
    ], contact: "Privacy questions can be sent to xtdiabetescare@outlook.com.",
  },
  terms: {
    eyebrow: "Website terms", title: "Important information about using this website.", updated: "Last updated September 2, 2026",
    sections: [
      ["Educational information", "Website articles and guides provide general education. They do not diagnose a condition or replace care from a physician, registered dietitian, therapist, pharmacist, or emergency service."],
      ["Appointments and coverage", "Submitting a form does not create a clinician-patient relationship or guarantee an appointment, prescription, insurance payment, or specific cost. Coverage depends on eligibility, network rules, diagnosis, location, and the insurance plan."],
      ["Medication information", "Medication pages are educational. Prescribing, dose changes, and treatment decisions require evaluation by an authorized clinician."],
      ["Third-party services", "Links to Kalix, WhatsApp, XT Diabetes Care, medical sources, and other websites lead to services with their own terms and privacy practices."],
      ["Emergencies", "Do not wait for a website reply when symptoms are urgent. Call emergency services or seek immediate medical care."],
    ],
  },
  diabetes: {
    eyebrow: "Diabetes education", title: "Nutrition visits here. DSMES and device training through XT Diabetes Care.", intro: "NutriAll supports everyday eating, weight, digestive concerns, heart health, and other nutrition needs. XT Diabetes Care provides structured diabetes self-management education, insulin pump training, and CGM setup and report review.",
    nutriTitle: "Choose NutriAll for", nutriItems: ["Meal planning that fits your culture and routine", "Weight, heart, kidney, digestive, or other nutrition goals", "One-to-one visits with a registered dietitian"],
    xtTitle: "Choose XT Diabetes Care for", xtItems: ["DSMES diabetes education programs", "Insulin pump setup and training", "CGM setup, reports, and pattern review", "Referral support for healthcare practices"],
    action: "Visit XT Diabetes Care", note: "XT Diabetes Care is a separate website. Its scheduling, insurance, and privacy information applies after you leave NutriAll.",
  },
};

const zh = {
  common: { learn: "查看详情", book: "免费预约 15 分钟咨询", required: "必填", optional: "选填" },
  services: {
    eyebrow: "营养服务", title: "NutriAll 营养咨询服务", intro: "NutriAll 提供减重、GLP-1、肠胃、女性健康、慢性病、运动和饮食相关的营养服务。拿不准该预约哪一项，可以先做一次免费的 15 分钟咨询。",
    groupNames: { weight: "体重管理", women: "女性与激素健康", chronic: "心脏与肾脏健康", food: "消化与进食", other: "其他营养需要" },
    items: {
      "weight-loss": ["1 对 1 减重", "根据饮食、食欲、作息和健康情况安排具体做法，不发一张统一食谱。"], glp1: ["GLP-1 营养支持", "处理蛋白质、补水、进食节奏和常见副作用。"], "medical-weight-loss": ["医学减重", "适合时，由营养师配合医生做评估和药物相关跟进。"],
      pcos: ["多囊（PCOS）", "围绕精力、胰岛素反应、血脂、生育或体重目标调整饮食。"], "pregnancy-postpartum": ["孕期与产后营养", "处理孕期不适、营养需要、产后恢复和喂养安排。"], "menopause-nutrition": ["更年期营养", "关注骨骼、心脏、肌肉、睡眠、症状和身体组成变化。"], "thyroid-health": ["甲状腺健康", "在医生治疗之外，处理饮食、补充剂和服药时间问题。"],
      "heart-health": ["心脏健康", "围绕血压、血脂和心血管风险调整每天的饮食。"], "high-cholesterol": ["高胆固醇", "具体处理饱和脂肪、可溶性纤维、做饭和外食。"], "kidney-health": ["肾脏健康", "根据肾病分期、化验、药物和透析情况制定饮食。"],
      "digestive-health": ["肠胃健康", "有步骤地处理反流、腹胀、便秘、腹泻、IBS 和食物耐受。"], "celiac-disease": ["乳糜泻", "学习无麸质饮食、交叉接触、食品标签、外食和营养补充。"], "food-allergies": ["食物过敏", "安排安全替代、看标签、防止交叉接触，同时保证营养。"], "eating-disorders": ["进食障碍", "营养治疗需要与医生和心理健康团队配合。"],
      "sports-nutrition": ["运动营养", "根据训练时间安排能量、补水和恢复。"], "cancer-nutrition": ["肿瘤营养", "处理胃口、治疗副作用、体力和摄入不足。"],
    }, diabetesTitle: "需要 DSMES、胰岛素泵或 CGM 培训？", diabetesText: "XT Diabetes Care 提供系统糖尿病教育和设备培训。日常饮食及相关健康问题仍可在 NutriAll 咨询。", diabetesAction: "查看糖尿病专项教育", finalTitle: "拿不准该选择哪项服务？",
  },
  inquiry: {
    eyebrow: "机构合作", title: "请告诉我们准备举办什么课程或活动。", intro: "这份表格供教会、社区中心、非营利机构、企业和活动主办方使用。我们会根据人数、形式、语言和时间进一步联系。",
    fields: { organization: "机构名称", organizationType: "机构类型", contactName: "联系人", email: "工作邮箱", phone: "联系电话", audienceSize: "预计人数", audienceAge: "参与者年龄", language: "希望使用的语言", topic: "希望讲解的主题", format: "课程形式", delivery: "线下或线上", date: "希望举办的日期或时间范围", location: "活动地点", budget: "预算范围", notes: "还有什么需要我们了解？", consent: "我同意 NutriAll 就本次课程合作申请联系我。" },
    options: { organizationType: ["教会或宗教社区", "社区中心或老人中心", "非营利或文化机构", "企业或员工福利团队", "学校或教育项目", "其他"], audienceAge: ["儿童或青少年", "成年人", "中老年人", "不同年龄都有"], language: ["英语", "普通话", "粤语", "福州话", "客家话", "西班牙语", "多种语言", "暂不确定"], format: ["单场讲座", "连续系列课程", "大会或健康活动", "暂不确定"], delivery: ["线下", "线上", "都可以"] },
    submit: "提交课程合作申请", submitting: "正在提交...", privacy: "这些资料只用于回复本次课程合作申请。", privacyLink: "查看隐私说明。", error: "暂时无法提交，请检查表格或稍后重试。",
    thanksTitle: "我们已经收到课程合作申请。", thanksText: "NutriAll 团队会查看参与人群、课程形式、语言和时间，并联系你讨论下一步。", back: "返回社区课程页面",
  },
  events: { eyebrow: "活动现场", title: "社区课程、健康活动和专业会议", intro: "这些照片记录了 NutriAll 在社区授课、参加健康活动，以及向同行介绍多语言糖尿病教育项目的现场。", cta: "咨询社区课程合作", captions: ["社区糖尿病课程", "社区家庭健康活动", "社区营养咨询摊位", "老人中心课程", "双语 DSMES 项目展示", "ADCES 专业会议展示", "FNCE 营养专业会议", "NutriAll 社区活动团队", "老人中心营养课程", "糖尿病教育会议团队", "ADCES 专业会议", "NutriAll 营养师参加 FNCE"] },
  privacy: {
    eyebrow: "隐私说明", title: "网站提交资料会怎样使用", updated: "更新日期：2026 年 9 月 2 日", intro: "本说明适用于网站表格、咨询申请、机构合作申请、问卷和基本访问统计。开始临床服务时提供的其他隐私文件仍然适用。",
    sections: [["你提交的资料", "表格可能收集联系方式、语言、年龄、方便联系的时间、保险资料、健康兴趣、机构资料或问卷回答。选填项目会明确标出。"], ["资料用途", "我们使用这些资料回复申请、查询可能的保险福利、安排服务、联系机构、发送确认信息和改进课程。"], ["第三方服务", "网站会使用托管、邮件、表格、统计、问卷和预约服务。离开本站进入 Kalix 或 WhatsApp 后，需要同时参考对方的隐私说明。"], ["网站统计", "我们会记录页面访问，以及打开 WhatsApp、Kalix 等操作。表格答案、保险会员号和出生日期不会写入访问统计。"], ["你的选择", "选填项目可以留空。你可以联系 NutriAll 查询、更正通过网站提交的资料。"], ["安全与紧急情况", "我们会采取合理的保护措施，但任何互联网服务都无法保证绝对安全。紧急医疗问题不要通过网站表格等待回复，请直接联系急救服务。"]], contact: "隐私问题请发送邮件至 xtdiabetescare@outlook.com。",
  },
  terms: { eyebrow: "网站使用说明", title: "使用本网站前需要了解的事项", updated: "更新日期：2026 年 9 月 2 日", sections: [["健康教育内容", "网站文章和指南用于一般健康教育，不能代替医生、注册营养师、心理治疗师、药师或急救服务的诊断和治疗。"], ["预约与保险", "提交表格不代表已经建立临床关系，也不保证预约、处方、保险报销或具体费用。实际情况取决于资格、网络、诊断、所在地和保险计划。"], ["药物内容", "药物页面用于一般说明。处方、剂量调整和治疗决定需要由有相应资格的临床人员评估。"], ["第三方服务", "Kalix、WhatsApp、XT Diabetes Care、医学资料和其他外部网站有各自的使用条款和隐私说明。"], ["紧急情况", "出现紧急症状时不要等待网站回复，请直接联系急救服务或立即就医。"]] },
  diabetes: { eyebrow: "糖尿病专项教育", title: "日常营养咨询在 NutriAll，DSMES 和设备培训由 XT Diabetes Care 提供。", intro: "NutriAll 可以处理日常饮食、体重、肠胃、心脏及其他营养问题。XT Diabetes Care 提供系统糖尿病自我管理教育、胰岛素泵培训，以及 CGM 安装和报告解读。", nutriTitle: "以下情况可以选择 NutriAll", nutriItems: ["把日常饮食放进文化和生活习惯", "同时处理体重、心脏、肾脏或肠胃问题", "与注册营养师进行一对一咨询"], xtTitle: "以下情况可以选择 XT Diabetes Care", xtItems: ["DSMES 糖尿病教育课程", "胰岛素泵安装与使用培训", "CGM 安装、报告和血糖规律分析", "医疗机构转诊支持"], action: "前往 XT Diabetes Care", note: "XT Diabetes Care 是独立网站。离开 NutriAll 后，以对方的预约、保险和隐私说明为准。" },
};

const es = {
  common: { learn: "Ver detalles", book: "Reservar consulta gratuita de 15 minutos", required: "Obligatorio", optional: "Opcional" },
  services: {
    eyebrow: "Servicios de nutrición", title: "Servicios de nutrición de NutriAll", intro: "Las dietistas de NutriAll atienden necesidades de peso, GLP-1, digestión, salud de la mujer, enfermedades crónicas, deporte y alimentación. Una consulta gratuita de 15 minutos puede ayudarle a elegir la cita correcta.",
    groupNames: { weight: "Control del peso", women: "Salud hormonal y de la mujer", chronic: "Salud cardíaca y renal", food: "Digestión y alimentación", other: "Otras necesidades" },
    items: {
      "weight-loss": ["Pérdida de peso 1:1", "Planificación de comidas, apetito y hábitos sin una dieta estándar."], glp1: ["Apoyo nutricional con GLP-1", "Proteína, líquidos, horarios y manejo de efectos secundarios."], "medical-weight-loss": ["Pérdida de peso médica", "Nutrición coordinada con evaluación médica cuando corresponda."], pcos: ["SOP (PCOS)", "Alimentación para energía, respuesta a la insulina, colesterol, fertilidad o peso."], "pregnancy-postpartum": ["Embarazo y posparto", "Nutrición para síntomas, recuperación y necesidades cambiantes."], "menopause-nutrition": ["Nutrición en la menopausia", "Apoyo para huesos, corazón, músculo, sueño y síntomas."], "thyroid-health": ["Salud tiroidea", "Comidas, suplementos y horarios de medicamentos junto con atención médica."], "heart-health": ["Salud cardíaca", "Cambios alimentarios para presión arterial, colesterol y riesgo cardiovascular."], "high-cholesterol": ["Colesterol alto", "Grasas saturadas, fibra soluble, cocina y comidas fuera de casa."], "kidney-health": ["Salud renal", "Nutrición según etapa, análisis, medicamentos y diálisis."], "digestive-health": ["Salud digestiva", "Ayuda estructurada para reflujo, hinchazón, estreñimiento, diarrea e IBS."], "celiac-disease": ["Enfermedad celíaca", "Alimentación sin gluten, contacto cruzado, etiquetas y nutrición completa."], "food-allergies": ["Alergias alimentarias", "Sustituciones seguras, etiquetas, contacto cruzado y nutrición."], "eating-disorders": ["Trastornos alimentarios", "Atención nutricional coordinada con tratamiento médico y psicológico."], "sports-nutrition": ["Nutrición deportiva", "Energía, hidratación y recuperación según el entrenamiento."], "cancer-nutrition": ["Nutrición oncológica", "Apoyo para apetito, efectos del tratamiento, fuerza e ingesta."],
    }, diabetesTitle: "¿Necesita DSMES, capacitación de bomba o CGM?", diabetesText: "XT Diabetes Care ofrece educación estructurada y capacitación de dispositivos. NutriAll atiende la nutrición diaria y otras metas de salud.", diabetesAction: "Ver educación sobre diabetes", finalTitle: "¿Necesita ayuda para elegir un servicio?",
  },
  inquiry: { eyebrow: "Para organizaciones", title: "Cuéntenos sobre la clase o el evento que está organizando.", intro: "Este formulario es para iglesias, centros comunitarios, organizaciones, empresas y eventos. Le responderemos sobre alcance, disponibilidad y próximos pasos.", fields: { organization: "Organización", organizationType: "Tipo de organización", contactName: "Persona de contacto", email: "Correo de trabajo", phone: "Teléfono", audienceSize: "Asistencia estimada", audienceAge: "Edad del público", language: "Idioma preferido", topic: "Temas de interés", format: "Formato", delivery: "Presencial o en línea", date: "Fecha o período preferido", location: "Lugar", budget: "Presupuesto", notes: "Información adicional", consent: "Acepto que NutriAll me contacte sobre esta solicitud." }, options: { organizationType: ["Iglesia o comunidad de fe", "Centro comunitario o para mayores", "Organización cultural o sin fines de lucro", "Empresa o beneficios", "Escuela o programa educativo", "Otro"], audienceAge: ["Niños o adolescentes", "Adultos", "Adultos mayores", "Edades mixtas"], language: ["Inglés", "Mandarín", "Cantonés", "Fuzhounés", "Hakka", "Español", "Varios idiomas", "No estoy seguro"], format: ["Taller único", "Serie de clases", "Conferencia o evento de salud", "No estoy seguro"], delivery: ["Presencial", "En línea", "Cualquiera"] }, submit: "Enviar solicitud", submitting: "Enviando...", privacy: "Usamos estos datos solo para responder a esta solicitud.", privacyLink: "Lea el aviso de privacidad.", error: "No se pudo enviar. Revise el formulario o inténtelo de nuevo.", thanksTitle: "Recibimos su solicitud.", thanksText: "El equipo revisará el público, formato, idioma y horario, y se comunicará para hablar del siguiente paso.", back: "Volver a programas comunitarios" },
  events: { eyebrow: "Trabajo comunitario", title: "Clases, eventos de salud y presentaciones profesionales", intro: "Estas fotos muestran a las educadoras de NutriAll enseñando, conversando con familias y presentando educación bilingüe sobre diabetes.", cta: "Consultar sobre un programa", captions: ["Clase comunitaria de diabetes", "Feria de salud familiar", "Puesto de nutrición comunitaria", "Clase en un centro para mayores", "Presentación bilingüe de DSMES", "Presentación en ADCES", "Conferencia FNCE", "Equipo comunitario de NutriAll", "Clase de nutrición para mayores", "Equipo en una conferencia de diabetes", "Conferencia profesional ADCES", "Dietistas de NutriAll en FNCE"] },
  privacy: { eyebrow: "Privacidad", title: "Cómo usamos la información enviada en este sitio", updated: "Actualizado el 2 de septiembre de 2026", intro: "Este aviso cubre formularios, solicitudes, encuestas y analítica básica del sitio.", sections: [["Información que proporciona", "Los formularios pueden pedir contacto, idioma, edad, horario, seguro, intereses de salud, datos de organización o respuestas de encuestas."], ["Cómo la usamos", "Usamos la información para responder, revisar posibles beneficios, coordinar servicios, enviar confirmaciones y mejorar programas."], ["Proveedores", "Usamos proveedores de alojamiento, correo, formularios, analítica, encuestas y reservas. Kalix y WhatsApp tienen sus propias políticas."], ["Analítica", "Registramos visitas y acciones como abrir WhatsApp o Kalix. Las respuestas, el número de seguro y la fecha de nacimiento no se guardan en eventos analíticos."], ["Sus opciones", "Puede dejar en blanco campos opcionales y contactarnos para consultar o corregir datos enviados."], ["Seguridad y emergencias", "Aplicamos medidas razonables, pero ningún servicio de internet garantiza seguridad absoluta. No use formularios para urgencias médicas."]], contact: "Preguntas de privacidad: xtdiabetescare@outlook.com." },
  terms: { eyebrow: "Términos del sitio", title: "Información importante sobre el uso de este sitio", updated: "Actualizado el 2 de septiembre de 2026", sections: [["Información educativa", "Los artículos son educación general y no sustituyen diagnóstico o tratamiento profesional."], ["Citas y cobertura", "Enviar un formulario no garantiza una cita, receta, pago del seguro ni costo específico."], ["Medicamentos", "Las recetas y cambios de dosis requieren evaluación de un profesional autorizado."], ["Servicios externos", "Kalix, WhatsApp, XT Diabetes Care y otros sitios tienen sus propios términos y políticas."], ["Emergencias", "No espere una respuesta del sitio ante síntomas urgentes. Busque atención inmediata."]] },
  diabetes: { eyebrow: "Educación sobre diabetes", title: "Nutrición con NutriAll. DSMES y dispositivos con XT Diabetes Care.", intro: "NutriAll atiende alimentación diaria, peso, digestión, corazón y otras necesidades. XT Diabetes Care ofrece educación DSMES, bombas de insulina y configuración e interpretación de CGM.", nutriTitle: "Elija NutriAll para", nutriItems: ["Alimentación adaptada a cultura y rutina", "Peso, corazón, riñón, digestión u otras metas", "Consultas individuales con dietista registrada"], xtTitle: "Elija XT Diabetes Care para", xtItems: ["Programas DSMES", "Capacitación de bombas de insulina", "Configuración e informes de CGM", "Apoyo para referidos médicos"], action: "Visitar XT Diabetes Care", note: "XT Diabetes Care es otro sitio. Sus reglas de citas, seguro y privacidad se aplican al salir de NutriAll." },
};

export function getExpansionContent(language = "en") {
  if (language.toLowerCase().startsWith("zh")) return zh;
  if (language.toLowerCase().startsWith("es")) return es;
  return en;
}
