import { writeFileSync } from "node:fs";

const localized = (en, zh, es) => ({ en, "zh-CN": zh, es });
const option = (id, en, zh, es) => ({ id, label: localized(en, zh, es) });
const question = (id, type, en, zh, es, extra = {}) => ({ id, type, title: localized(en, zh, es), ...extra });
const choice = (id, type, title, options, extra = {}) => question(id, type, ...title, { options, ...extra });
const rating = (id, title, minLabel, maxLabel, min = 1, max = 5) => question(id, "rating", ...title, {
  scaleMin: min,
  scaleMax: max,
  scaleMinLabel: localized(...minLabel),
  scaleMaxLabel: localized(...maxLabel),
});
const text = (id, type, title, extra = {}) => question(id, type, ...title, extra);

const agreement = [
  ["Strongly disagree", "非常不同意", "Totalmente en desacuerdo"],
  ["Disagree", "不同意", "En desacuerdo"],
  ["Neutral", "一般", "Neutral"],
  ["Agree", "同意", "De acuerdo"],
  ["Strongly agree", "非常同意", "Totalmente de acuerdo"],
];

const surveys = [
  {
    id: "srv_import_dsme_demographic",
    versionId: "svv_import_dsme_demographic_v1",
    slug: "dsme-demographic-survey",
    title: localized("DSME Demographic Survey", "糖尿病自我管理课程基本情况问卷", "Encuesta demográfica del programa DSME"),
    description: localized(
      "These questions help us understand who our classes are reaching. You may skip any question you prefer not to answer.",
      "这些问题帮助我们了解课程服务到哪些人。任何不想回答的问题都可以跳过。",
      "Estas preguntas nos ayudan a saber a quiénes llegan nuestras clases. Puede omitir cualquier pregunta que prefiera no responder.",
    ),
    questions: [
      choice("age", "single", ["What is your age?", "您的年龄是？", "¿Cuál es su edad?"], [
        option("18_24", "18-24", "18-24岁", "18-24"), option("25_34", "25-34", "25-34岁", "25-34"),
        option("35_44", "35-44", "35-44岁", "35-44"), option("45_54", "45-54", "45-54岁", "45-54"),
        option("55_64", "55-64", "55-64岁", "55-64"), option("65_plus", "65+", "65岁及以上", "65 o más"),
      ]),
      choice("gender", "single", ["What is your gender?", "您的性别是？", "¿Cuál es su género?"], [
        option("male", "Male", "男", "Hombre"), option("female", "Female", "女", "Mujer"),
        option("prefer_not", "Prefer not to answer", "不愿回答", "Prefiero no responder"), option("other", "Other", "其他", "Otro"),
      ]),
      text("gender_other", "short_text", ["Please specify your gender.", "请填写您的性别。", "Especifique su género."], { logic: { questionId: "gender", operator: "equals", value: "other" } }),
      choice("race_ethnicity", "multiple", ["What is your race or ethnicity? Select all that apply.", "您的种族或族裔是？可多选。", "¿Cuál es su raza u origen étnico? Seleccione todas las opciones que correspondan."], [
        option("american_indian", "American Indian or Alaska Native", "美洲印第安人或阿拉斯加原住民", "Indígena americano o nativo de Alaska"),
        option("asian", "Asian or Asian American", "亚洲人或亚裔美国人", "Asiático o asiático-americano"),
        option("black", "Black or African American", "黑人或非裔美国人", "Negro o afroamericano"),
        option("hispanic", "Hispanic or Latino", "西班牙裔或拉丁裔", "Hispano o latino"),
        option("mena", "Middle Eastern or North African", "中东或北非裔", "De Oriente Medio o del Norte de África"),
        option("pacific", "Native Hawaiian or other Pacific Islander", "夏威夷原住民或其他太平洋岛民", "Nativo de Hawái u otra isla del Pacífico"),
        option("white", "White", "白人", "Blanco"), option("another", "Another race", "其他种族", "Otra raza"),
      ]),
      text("race_other", "short_text", ["Please specify another race or ethnicity.", "请填写其他种族或族裔。", "Especifique otra raza u origen étnico."], { logic: { questionId: "race_ethnicity", operator: "contains", value: "another" } }),
      choice("primary_language", "single", ["What is the primary language you speak?", "您主要使用哪种语言？", "¿Cuál es el idioma que habla principalmente?"], [
        option("english", "English", "英语", "Inglés"), option("spanish", "Spanish", "西班牙语", "Español"),
        option("chinese", "Chinese (Mandarin or Cantonese)", "中文（普通话或粤语）", "Chino (mandarín o cantonés)"),
        option("korean", "Korean", "韩语", "Coreano"), option("vietnamese", "Vietnamese", "越南语", "Vietnamita"),
        option("other", "Other", "其他", "Otro"),
      ]),
      text("language_other", "short_text", ["Please specify your primary language.", "请填写您主要使用的语言。", "Especifique su idioma principal."], { logic: { questionId: "primary_language", operator: "equals", value: "other" } }),
      text("state", "short_text", ["Which state do you reside in?", "您居住在哪个州？", "¿En qué estado reside?"]),
      choice("education", "single", ["What is the highest level of education you have completed?", "您完成的最高教育程度是？", "¿Cuál es el nivel educativo más alto que ha completado?"], [
        option("no_high_school", "Did not complete high school", "未完成高中", "No completé la escuela secundaria"),
        option("high_school", "High school diploma or GED", "高中毕业或GED", "Diploma de secundaria o GED"),
        option("some_college", "Some college coursework", "上过大学但未获得学位", "Algunos estudios universitarios"),
        option("bachelors", "Bachelor's degree", "学士学位", "Licenciatura"),
        option("graduate", "Graduate degree or higher", "研究生学位或以上", "Posgrado o nivel superior"),
      ]),
      choice("insurance", "single", ["Do you currently have health insurance in the U.S.?", "您目前在美国有医疗保险吗？", "¿Actualmente tiene seguro médico en Estados Unidos?"], [
        option("yes", "Yes", "有", "Sí"), option("no", "No", "没有", "No"), option("unsure", "Unsure", "不确定", "No estoy seguro/a"),
      ]),
      choice("conditions", "multiple", ["Has a healthcare provider ever told you that you have any of the following conditions? Select all that apply.", "医疗人员是否曾告诉您有以下任何情况？可多选。", "¿Algún profesional de salud le ha dicho que tiene alguna de las siguientes condiciones? Seleccione todas las que correspondan."], [
        option("prediabetes", "Prediabetes", "前期糖尿病", "Prediabetes"), option("insulin_resistance", "Insulin resistance", "胰岛素抵抗", "Resistencia a la insulina"),
        option("type_1", "Type 1 diabetes", "1型糖尿病", "Diabetes tipo 1"), option("type_2", "Type 2 diabetes", "2型糖尿病", "Diabetes tipo 2"),
        option("high_blood_pressure", "High blood pressure", "高血压", "Presión arterial alta"), option("high_cholesterol", "High cholesterol", "高胆固醇", "Colesterol alto"),
        option("heart_disease", "Heart disease", "心脏病", "Enfermedad cardíaca"), option("none", "None of the above", "以上都没有", "Ninguna de las anteriores"),
      ]),
      choice("monitor_blood_sugar", "single", ["Do you currently monitor your blood sugar levels?", "您目前会监测血糖吗？", "¿Actualmente controla sus niveles de azúcar en la sangre?"], [
        option("daily", "Yes, daily", "会，每天", "Sí, diariamente"), option("weekly", "Yes, weekly", "会，每周", "Sí, semanalmente"),
        option("occasionally", "Occasionally", "偶尔", "Ocasionalmente"), option("no", "No", "不会", "No"),
      ]),
      choice("diabetes_medication", "single", ["Are you currently taking medication for diabetes?", "您目前在使用糖尿病药物吗？", "¿Actualmente toma medicamentos para la diabetes?"], [
        option("oral", "Yes, I take oral medication", "是，口服药物", "Sí, tomo medicamentos orales"),
        option("insulin", "Yes, I use injectable insulin", "是，使用注射胰岛素", "Sí, uso insulina inyectable"),
        option("glp1", "Yes, I use a GLP-1 receptor agonist (semaglutide, liraglutide, etc.)", "是，使用GLP-1受体激动剂（如司美格鲁肽、利拉鲁肽等）", "Sí, uso un agonista del receptor GLP-1 (semaglutida, liraglutida, etc.)"),
        option("no", "No", "没有", "No"),
      ]),
    ],
  },
  {
    id: "srv_import_pre_class",
    versionId: "svv_import_pre_class_v1",
    slug: "pre-class-survey",
    title: localized("Pre-class Survey", "课前问卷", "Encuesta previa al curso"),
    description: localized("Tell us what you already know and what you hope to learn so we can make the class more useful for you.", "请告诉我们您目前的了解和想学的内容，帮助我们让课程更适合您。", "Cuéntenos qué sabe y qué desea aprender para que la clase le resulte más útil."),
    questions: [
      choice("prior_course", "single", ["Have you previously attended a diabetes education course?", "您以前参加过糖尿病教育课程吗？", "¿Ha asistido anteriormente a un curso de educación sobre la diabetes?"], [option("yes", "Yes", "参加过", "Sí"), option("no", "No", "没有", "No")]),
      choice("situation", "single", ["Which of the following best describes your situation?", "以下哪项最符合您的情况？", "¿Cuál de las siguientes opciones describe mejor su situación?"], [
        option("type_1", "I have Type 1 diabetes", "我有1型糖尿病", "Tengo diabetes tipo 1"), option("type_2", "I have Type 2 diabetes", "我有2型糖尿病", "Tengo diabetes tipo 2"),
        option("prediabetes", "I have prediabetes", "我有前期糖尿病", "Tengo prediabetes"), option("insulin_resistance", "I have insulin resistance", "我有胰岛素抵抗", "Tengo resistencia a la insulina"),
        option("unsure", "I am not sure", "我不确定", "No estoy seguro/a"), option("support_person", "I do not have diabetes or prediabetes; I am attending for a family member or friend", "我没有糖尿病或前期糖尿病，是为家人或朋友来参加", "No tengo diabetes ni prediabetes; asisto por un familiar o amigo"),
      ]),
      choice("diagnosis_length", "single", ["How long ago were you diagnosed?", "您确诊多久了？", "¿Hace cuánto tiempo recibió el diagnóstico?"], [
        option("under_1", "Less than 1 year", "不到1年", "Menos de 1 año"), option("1_5", "1-5 years", "1-5年", "1-5 años"),
        option("over_5", "More than 5 years", "超过5年", "Más de 5 años"), option("not_diagnosed", "Not diagnosed", "尚未确诊", "Sin diagnóstico"),
      ]),
      rating("knowledge", ["How would you rate your knowledge about diabetes?", "您如何评价自己对糖尿病的了解？", "¿Cómo calificaría sus conocimientos sobre la diabetes?"], ["No knowledge at all", "完全不了解", "Ningún conocimiento"], ["Very knowledgeable", "非常了解", "Mucho conocimiento"]),
      rating("confidence", ["I am confident in managing my health through healthy eating, regular exercise, taking medication on time, and blood glucose monitoring.", "我有信心通过健康饮食、规律运动、按时用药和监测血糖来管理健康。", "Confío en poder cuidar mi salud mediante una alimentación saludable, ejercicio regular, medicamentos a tiempo y control de glucosa."], ["Not confident at all", "完全没信心", "Nada de confianza"], ["Very confident", "非常有信心", "Mucha confianza"]),
      choice("topics", "multiple", ["Which topics would you like to learn more about? Select all that apply.", "您想进一步了解哪些内容？可多选。", "¿Sobre qué temas le gustaría aprender más? Seleccione todos los que correspondan."], [
        option("healthy_eating", "Healthy eating and meal planning", "健康饮食与膳食计划", "Alimentación saludable y planificación de comidas"),
        option("carb_counting", "Carbohydrate counting", "碳水化合物计算", "Conteo de carbohidratos"), option("weight", "Weight management", "体重管理", "Control del peso"),
        option("exercise", "Exercise", "运动", "Ejercicio"), option("monitoring", "Blood glucose monitoring", "血糖监测", "Control de glucosa"),
        option("medication", "Medication", "药物", "Medicamentos"), option("complications", "Preventing complications", "预防并发症", "Prevención de complicaciones"),
        option("food_labels", "Reading food labels", "阅读食品标签", "Lectura de etiquetas de alimentos"), option("other", "Other", "其他", "Otro"),
      ]),
      text("topics_other", "short_text", ["What other topic would you like to learn about?", "您还想了解什么内容？", "¿Sobre qué otro tema le gustaría aprender?"], { logic: { questionId: "topics", operator: "contains", value: "other" } }),
    ],
  },
  {
    id: "srv_import_sessions_1_2",
    versionId: "svv_import_sessions_1_2_v1",
    slug: "sessions-1-2-survey",
    title: localized("Sessions 1–2 Survey", "第1-2节课程反馈", "Encuesta de las sesiones 1-2"),
    description: localized("Your feedback helps us make the diabetes education sessions clearer and more useful.", "您的反馈能帮助我们把糖尿病教育课程讲得更清楚、更实用。", "Sus comentarios nos ayudan a hacer las sesiones más claras y útiles."),
    questions: [
      rating("easy_to_understand", ["Today's lesson content was easy to understand.", "今天的课程内容容易理解。", "El contenido de la clase de hoy fue fácil de entender."], agreement[0], agreement[4]),
      rating("helpful", ["Today's lesson content was helpful to me or my family member.", "今天的课程内容对我或我的家人有帮助。", "El contenido de hoy fue útil para mí o para mi familiar."], agreement[0], agreement[4]),
      rating("apply_learning", ["I feel confident applying what I learned today.", "我有信心把今天学到的内容用起来。", "Me siento capaz de aplicar lo que aprendí hoy."], agreement[0], agreement[4]),
      rating("session_1", ["Through Session 1, I have a better understanding of diabetes and its risk factors.", "通过第1节课，我对糖尿病及其风险因素有了更多了解。", "Gracias a la sesión 1, comprendo mejor la diabetes y sus factores de riesgo."], agreement[0], agreement[4]),
      rating("session_2", ["Through Session 2, I have a better understanding of which foods affect blood sugar levels.", "通过第2节课，我更了解哪些食物会影响血糖。", "Gracias a la sesión 2, comprendo mejor qué alimentos afectan el nivel de azúcar en la sangre."], agreement[0], agreement[4]),
    ],
  },
  {
    id: "srv_import_sessions_3_4",
    versionId: "svv_import_sessions_3_4_v1",
    slug: "sessions-3-4-survey",
    title: localized("Sessions 3-4 Survey", "第3-4节课程反馈", "Encuesta de las sesiones 3-4"),
    description: localized("Your feedback helps us improve the next diabetes education sessions.", "您的反馈能帮助我们改进接下来的糖尿病教育课程。", "Sus comentarios nos ayudan a mejorar las próximas sesiones."),
    questions: [
      rating("easy_to_understand", ["Today's lesson content was easy to understand.", "今天的课程内容容易理解。", "El contenido de la clase de hoy fue fácil de entender."], agreement[0], agreement[4]),
      rating("helpful", ["Today's lesson content was helpful to me or my family member.", "今天的课程内容对我或我的家人有帮助。", "El contenido de hoy fue útil para mí o para mi familiar."], agreement[0], agreement[4]),
      rating("session_3", ["Through Session 3, I better understand why physical activity is important for blood sugar control.", "通过第3节课，我更了解运动对控制血糖的重要性。", "Gracias a la sesión 3, comprendo mejor la importancia de la actividad física para controlar la glucosa."], agreement[0], agreement[4]),
      rating("session_4", ["Through Session 4, I better understand how to monitor blood sugar and use medications and monitoring equipment correctly.", "通过第4节课，我更了解如何监测血糖，以及正确使用药物和监测设备。", "Gracias a la sesión 4, comprendo mejor cómo controlar la glucosa y usar correctamente los medicamentos y equipos de monitoreo."], agreement[0], agreement[4]),
      rating("physical_activity", ["I feel confident incorporating physical activity into my daily life.", "我有信心把运动融入日常生活。", "Me siento capaz de incorporar actividad física en mi vida diaria."], agreement[0], agreement[4]),
    ],
  },
  {
    id: "srv_import_sessions_5_6",
    versionId: "svv_import_sessions_5_6_v1",
    slug: "sessions-5-6-survey",
    title: localized("Sessions 5-6 Survey", "第5-6节课程反馈", "Encuesta de las sesiones 5-6"),
    description: localized("Your feedback helps us understand what was useful and what needs more explanation.", "您的反馈能帮助我们了解哪些内容有用、哪些地方还需要讲得更清楚。", "Sus comentarios nos ayudan a saber qué fue útil y qué necesita más explicación."),
    questions: [
      rating("easy_to_understand", ["Today's lesson content was easy to understand.", "今天的课程内容容易理解。", "El contenido de la clase de hoy fue fácil de entender."], agreement[0], agreement[4]),
      rating("helpful", ["Today's lesson content was helpful to me or my family member.", "今天的课程内容对我或我的家人有帮助。", "El contenido de hoy fue útil para mí o para mi familiar."], agreement[0], agreement[4]),
      rating("daily_life", ["I feel confident applying what I learned today to my daily life.", "我有信心把今天学到的内容用到日常生活中。", "Me siento capaz de aplicar en mi vida diaria lo que aprendí hoy."], agreement[0], agreement[4]),
      rating("session_5", ["Through Session 5, I feel more confident about preventing diabetes complications.", "通过第5节课，我对预防糖尿病并发症更有信心。", "Gracias a la sesión 5, me siento más capaz de prevenir las complicaciones de la diabetes."], agreement[0], agreement[4]),
      rating("session_6", ["Through Session 6, I know which people or resources can support me in managing diabetes.", "通过第6节课，我知道可以向哪些人或资源寻求糖尿病管理方面的支持。", "Gracias a la sesión 6, sé qué personas o recursos pueden apoyarme en el manejo de la diabetes."], agreement[0], agreement[4]),
    ],
  },
  {
    id: "srv_import_post_class",
    versionId: "svv_import_post_class_v1",
    slug: "post-class-survey",
    title: localized("Post Class Survey", "课程结束问卷", "Encuesta posterior al curso"),
    description: localized("Tell us what changed for you and how we can improve future diabetes education classes.", "请告诉我们课程给您带来了哪些改变，以及我们可以怎样改进今后的糖尿病教育课程。", "Cuéntenos qué cambió para usted y cómo podemos mejorar futuros cursos de educación sobre la diabetes."),
    questions: [
      rating("instructor", ["The instructor explained things clearly and answered my questions effectively.", "讲师解释得很清楚，也能有效回答我的问题。", "El instructor explicó con claridad y respondió eficazmente mis preguntas."], agreement[0], agreement[4]),
      rating("understanding", ["After completing the course, how would you rate your understanding of diabetes?", "完成课程后，您如何评价自己对糖尿病的了解？", "Después del curso, ¿cómo calificaría su comprensión de la diabetes?"], ["Not knowledgeable at all", "完全不了解", "Ningún conocimiento"], ["Very knowledgeable", "非常了解", "Mucho conocimiento"]),
      rating("health_confidence", ["I am now confident in managing my health through healthy eating, regular exercise, taking medication on schedule, and monitoring my blood glucose.", "现在，我有信心通过健康饮食、规律运动、按时用药和监测血糖来管理健康。", "Ahora confío en cuidar mi salud mediante alimentación saludable, ejercicio regular, medicamentos a tiempo y control de glucosa."], ["Not at all confident", "完全没信心", "Nada de confianza"], ["Very confident", "非常有信心", "Mucha confianza"]),
      rating("healthy_habit", ["I know how to add at least one healthy habit that helps control blood glucose to my daily life.", "我知道如何在日常生活中加入至少一种有助于控制血糖的健康习惯。", "Sé cómo incorporar a mi vida diaria al menos un hábito saludable que ayude a controlar la glucosa."], agreement[0], agreement[4]),
      rating("seek_support", ["I know how to seek help and support if diabetes-related issues arise.", "如果出现与糖尿病有关的问题，我知道如何寻求帮助和支持。", "Sé cómo buscar ayuda y apoyo si surge algún problema relacionado con la diabetes."], agreement[0], agreement[4]),
      rating("health_goal", ["I have set at least one specific health goal and plan to start working on it within the next month.", "我已经为自己设定了至少一个具体的健康目标，并计划在下个月开始行动。", "He establecido al menos una meta de salud específica y planeo comenzar a trabajar en ella durante el próximo mes."], agreement[0], agreement[4]),
      rating("care_team", ["I am more willing to proactively discuss my health concerns with my healthcare team.", "我现在更愿意主动和医疗团队沟通自己的健康问题。", "Estoy más dispuesto/a a hablar activamente con mi equipo de salud sobre mis inquietudes."], agreement[0], agreement[4]),
      rating("satisfaction", ["How satisfied are you overall with this diabetes education course?", "总体来说，您对这次糖尿病教育课程有多满意？", "En general, ¿qué tan satisfecho/a está con este curso de educación sobre la diabetes?"], ["Very dissatisfied", "非常不满意", "Muy insatisfecho/a"], ["Very satisfied", "非常满意", "Muy satisfecho/a"]),
      choice("helpful_session", "single", ["Which of the six sessions did you find most helpful?", "六节课中，哪一节对您帮助最大？", "¿Cuál de las seis sesiones le resultó más útil?"], [1, 2, 3, 4, 5, 6].map((number) => option(`session_${number}`, `Session ${number}`, `第${number}节`, `Sesión ${number}`))),
      rating("recommend", ["Would you recommend this diabetes education course to family or friends?", "您愿意把这门糖尿病教育课程推荐给家人或朋友吗？", "¿Recomendaría este curso de educación sobre la diabetes a familiares o amigos?"], ["Would not recommend", "不会推荐", "No lo recomendaría"], ["Definitely recommend", "一定会推荐", "Sin duda lo recomendaría"]),
    ],
  },
  {
    id: "srv_import_gerd_webinar",
    versionId: "svv_import_gerd_webinar_v1",
    slug: "gerd-nutrition-webinar-feedback",
    title: localized("Webinar Feedback on GERD and Nutrition Intervention", "胃食管反流与营养干预讲座反馈", "Comentarios sobre el seminario de ERGE e intervención nutricional"),
    description: localized("Thank you for joining us. Your feedback will help us plan clearer, more useful webinars.", "感谢您的参加。您的反馈将帮助我们准备更清楚、更实用的讲座。", "Gracias por acompañarnos. Sus comentarios nos ayudarán a preparar seminarios más claros y útiles."),
    questions: [
      choice("satisfaction", "single", ["How satisfied are you with the webinar on GERD and nutrition intervention?", "您对这次胃食管反流与营养干预讲座有多满意？", "¿Qué tan satisfecho/a está con el seminario sobre ERGE e intervención nutricional?"], [
        option("very_satisfied", "Very satisfied", "非常满意", "Muy satisfecho/a"), option("satisfied", "Satisfied", "满意", "Satisfecho/a"),
        option("neutral", "Neutral", "一般", "Neutral"), option("dissatisfied", "Dissatisfied", "不满意", "Insatisfecho/a"),
        option("very_dissatisfied", "Very dissatisfied", "非常不满意", "Muy insatisfecho/a"),
      ]),
      text("liked_most", "long_text", ["What did you like most about the webinar?", "这次讲座中，您最喜欢什么？", "¿Qué fue lo que más le gustó del seminario?"]),
      text("improve", "long_text", ["How can we improve future webinars?", "我们可以怎样改进今后的讲座？", "¿Cómo podemos mejorar futuros seminarios?"]),
      choice("future_topics", "multiple", ["Which topics would interest you for future webinars? Select all that apply.", "今后的讲座中，您对哪些主题感兴趣？可多选。", "¿Qué temas le interesarían para futuros seminarios? Seleccione todos los que correspondan."], [
        option("weight", "Weight management", "体重管理", "Control del peso"), option("diabetes", "Diabetes", "糖尿病", "Diabetes"),
        option("heart", "Heart health", "心脏健康", "Salud del corazón"), option("exercise", "Exercise and fitness nutrition", "运动与健身营养", "Nutrición para el ejercicio y la actividad física"),
        option("mental_health", "Mental health and relationship with food", "心理健康与饮食关系", "Salud mental y relación con la comida"),
        option("cancer", "Cancer and nutrition", "癌症与营养", "Cáncer y nutrición"), option("other", "Other", "其他", "Otro"),
      ]),
      text("future_topics_other", "short_text", ["What other topic would interest you?", "您还对什么主题感兴趣？", "¿Qué otro tema le interesaría?"], { logic: { questionId: "future_topics", operator: "contains", value: "other" } }),
      rating("recommend", ["How likely are you to recommend our webinars to a friend or family member?", "您有多大可能把我们的讲座推荐给朋友或家人？", "¿Qué probabilidad hay de que recomiende nuestros seminarios a un amigo o familiar?"], ["Not at all likely", "完全不可能", "Nada probable"], ["Extremely likely", "极有可能", "Extremadamente probable"], 0, 10),
      choice("email_list", "single", ["Would you like to receive email updates about future webinars?", "您愿意通过电子邮件接收今后讲座的消息吗？", "¿Le gustaría recibir por correo electrónico novedades sobre futuros seminarios?"], [option("yes", "Yes", "愿意", "Sí"), option("no", "No", "不愿意", "No")]),
      text("email", "email", ["Please provide your email address.", "请填写您的电子邮箱。", "Indique su correo electrónico."], { logic: { questionId: "email_list", operator: "equals", value: "yes" } }),
    ],
  },
];

function definitionFor(survey) {
  const baseQuestions = survey.questions.map((item) => ({
    id: item.id,
    type: item.type,
    title: item.title.en,
    description: item.description?.en || "",
    required: false,
    ...(item.options ? { options: item.options.map((entry) => ({ id: entry.id, label: entry.label.en })) } : {}),
    ...(item.scaleMin !== undefined ? {
      scaleMin: item.scaleMin,
      scaleMax: item.scaleMax,
      scaleMinLabel: item.scaleMinLabel.en,
      scaleMaxLabel: item.scaleMaxLabel.en,
    } : {}),
    ...(item.logic ? { logic: item.logic } : {}),
  }));
  const translations = Object.fromEntries(["zh-CN", "es"].map((language) => [language, {
    title: survey.title[language],
    description: survey.description[language],
    thankYouTitle: language === "zh-CN" ? "感谢您的反馈" : "Gracias por sus comentarios",
    thankYouMessage: language === "zh-CN" ? "您的回答已经提交。" : "Sus respuestas se enviaron correctamente.",
    pages: {
      page_1: {
        title: language === "zh-CN" ? "问卷问题" : "Preguntas",
        description: "",
        questions: Object.fromEntries(survey.questions.map((item) => [item.id, {
          title: item.title[language],
          description: item.description?.[language] || "",
          options: Object.fromEntries((item.options || []).map((entry) => [entry.id, entry.label[language]])),
          rows: {},
          columns: {},
          scaleMinLabel: item.scaleMinLabel?.[language] || "",
          scaleMaxLabel: item.scaleMaxLabel?.[language] || "",
        }])),
      },
    },
  }]));
  return {
    title: survey.title.en,
    description: survey.description.en,
    language: "en",
    defaultLanguage: "en",
    languages: ["en", "zh-CN", "es"],
    translations,
    pages: [{ id: "page_1", title: "Questions", description: "", questions: baseQuestions }],
    thankYouTitle: "Thank you for your feedback",
    thankYouMessage: "Your responses have been submitted.",
  };
}

function sqlString(value) {
  return `'${String(value).replaceAll("'", "''")}'`;
}

const batches = [
  { filename: "0018_seed_existing_surveys_part_1.sql", surveys: surveys.slice(0, 3) },
  { filename: "0019_seed_existing_surveys_part_2.sql", surveys: surveys.slice(3) },
];

for (const batch of batches) {
  const statements = [];
  for (const survey of batch.surveys) {
    const definition = JSON.stringify(definitionFor(survey));
    statements.push(
      `INSERT OR IGNORE INTO surveys (id, title, slug, description, status, language, draft_definition, published_version_id, created_at, updated_at, published_at) VALUES (${sqlString(survey.id)}, ${sqlString(survey.title.en)}, ${sqlString(survey.slug)}, ${sqlString(survey.description.en)}, 'open', 'en', ${sqlString(definition)}, ${sqlString(survey.versionId)}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);`,
      `INSERT OR IGNORE INTO survey_versions (id, survey_id, version_number, definition, created_at) VALUES (${sqlString(survey.versionId)}, ${sqlString(survey.id)}, 1, ${sqlString(definition)}, CURRENT_TIMESTAMP);`,
    );
  }
  statements.push("");
  const output = new URL(`../worker/migrations/${batch.filename}`, import.meta.url);
  writeFileSync(output, statements.join("\n"), "utf8");
  console.log(`Generated ${output.pathname} with ${batch.surveys.length} multilingual surveys.`);
}
