/**
 * Avi, the site's virtual assistant: every message and path lives here.
 * All answers are written in advance — no AI, no external API. Avi informs
 * and hands the visitor over to WhatsApp; she never books, schedules or
 * handles payments. To change what Avi says, edit this file only.
 */

const WHATSAPP_NUMBER = "5491123136781";

/** WhatsApp link, optionally with a pre-filled message (URL-encoded). */
export function whatsappUrl(message?: string) {
  const base = `https://wa.me/${WHATSAPP_NUMBER}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}

/** Pre-filled WhatsApp messages, one per path. */
export const WA = {
  general: "Hola, llegué desde la web de César Vidal Scasso y quisiera hacer una consulta.",
  consultorias:
    "Hola, estuve viendo las consultorías estratégicas de César Vidal Scasso y quisiera hacer una consulta.",
  precio:
    "Hola, quisiera consultar por el valor y la contratación de una consultoría estratégica con César Vidal Scasso.",
  avanzar:
    "Hola, estuve viendo las consultorías estratégicas y me gustaría conocer más sobre cómo avanzar y coordinar una sesión.",
  tema: (tema: string) =>
    `Hola, quisiera conversar sobre una posible consultoría con César Vidal Scasso. Mi consulta está relacionada con ${tema}.`,
  consulta: (text: string) =>
    `Hola, llegué desde la web de César Vidal Scasso y quisiera hacer una consulta: ${text}`,
} as const;

/** A message block: a paragraph, a small title, or a bulleted list. */
export type Block = string | { title: string } | { list: string[] };

export type StepId =
  | "welcome"
  | "menu"
  | "consultorias"
  | "funcionamiento"
  | "desafio"
  | "ia"
  | "procesos"
  | "negocios"
  | "innovacion"
  | "tecnologia"
  | "otro"
  | "precio"
  | "avanzar"
  | "humano"
  | "faq"
  | "faqDuracion"
  | "faqConQuien"
  | "faqPublico"
  | "faqIa"
  | "faqContratar"
  | "fallback";

/** A reply button: goes to another step, or opens WhatsApp with a message. */
export type Choice = { label: string; to: StepId } | { label: string; whatsapp: string };

export type Step = {
  say: Block[];
  /** Highlighted WhatsApp button under the message. */
  cta?: { label: string; whatsapp: string };
  choices?: Choice[];
};

const MAIN_CHOICES: Choice[] = [
  { label: "Quiero conocer las consultorías.", to: "consultorias" },
  { label: "Tengo un desafío en mi empresa.", to: "desafio" },
  { label: "Quiero conocer el precio.", to: "precio" },
  { label: "Quiero avanzar con una consultoría.", to: "avanzar" },
  { label: "Quiero hablar con alguien.", to: "humano" },
  { label: "Preguntas frecuentes.", to: "faq" },
];

const CHALLENGE_CLOSING =
  "Si querés, podés contarnos un poco más sobre tu situación y continuar la conversación directamente por WhatsApp.";

/** A challenge answer, closing line and WhatsApp button about that topic. */
const challenge = (answer: string, tema: string): Step => ({
  say: [answer, CHALLENGE_CLOSING],
  cta: { label: "Conversar por WhatsApp", whatsapp: WA.tema(tema) },
});

const MORE_FAQ: Choice = { label: "Ver otras preguntas.", to: "faq" };
const ASK_WHATSAPP: Choice = { label: "Consultar por WhatsApp.", whatsapp: WA.general };

export const STEPS: Record<StepId, Step> = {
  welcome: {
    say: [
      "¡Hola! Soy Avi, la asistente virtual de César.",
      "Estoy acá para ayudarte a conocer sus consultorías, entender cómo pueden acompañarte y encontrar la mejor manera de avanzar.",
      "¿Qué te gustaría saber?",
    ],
    choices: MAIN_CHOICES,
  },

  // "Back to the main menu": the options again, without repeating the welcome.
  menu: {
    say: ["¿Sobre qué te gustaría saber?"],
    choices: MAIN_CHOICES,
  },

  // 1 · Consultorías
  consultorias: {
    say: [
      "Las consultorías estratégicas son encuentros individuales para analizar los desafíos de tu organización, identificar oportunidades y definir posibles caminos de acción.",
      "Son espacios pensados para empresarios, emprendedores, directivos y profesionales que necesitan una mirada estratégica para tomar decisiones y avanzar.",
      { title: "¿En qué áreas puede acompañarte?" },
      {
        list: [
          "Inteligencia artificial y nuevas tecnologías.",
          "Innovación y transformación de empresas.",
          "Desarrollo de negocios y nuevas oportunidades.",
          "Optimización de procesos y automatización.",
          "Gaming y nuevas industrias tecnológicas.",
        ],
      },
      "Cada encuentro se adapta a la realidad y las necesidades de cada persona u organización.",
    ],
    choices: [
      { label: "Quiero conocer cómo funciona.", to: "funcionamiento" },
      { label: "Quiero conversar sobre mi caso.", to: "desafio" },
    ],
  },
  funcionamiento: {
    say: [
      "El encuentro es individual y tiene una duración de 60 minutos. Se trabaja sobre tu situación particular, se analizan oportunidades y se identifican posibles acciones para avanzar.",
    ],
    choices: [{ label: "Consultar por WhatsApp.", whatsapp: WA.consultorias }],
  },

  // 2 · Desafíos
  desafio: {
    say: ["¡Perfecto! Para orientarte mejor, contame qué tema te gustaría trabajar."],
    choices: [
      { label: "Incorporar inteligencia artificial.", to: "ia" },
      { label: "Optimizar procesos y automatizar tareas.", to: "procesos" },
      { label: "Desarrollar nuevas oportunidades de negocio.", to: "negocios" },
      { label: "Impulsar proyectos de innovación.", to: "innovacion" },
      { label: "Resolver desafíos tecnológicos.", to: "tecnologia" },
      { label: "Otro desafío.", to: "otro" },
    ],
  },
  ia: challenge(
    "Podemos analizar cómo incorporar herramientas de inteligencia artificial en tu organización, identificar oportunidades de aplicación y evaluar qué soluciones pueden aportar valor a tu actividad.",
    "incorporar inteligencia artificial"
  ),
  procesos: challenge(
    "Podemos identificar procesos que podrían mejorarse, detectar tareas repetitivas y explorar alternativas para optimizar el funcionamiento de tu organización.",
    "optimizar procesos y automatizar tareas"
  ),
  negocios: challenge(
    "Podemos trabajar sobre nuevos modelos de negocio, oportunidades de mercado, servicios y estrategias para impulsar el crecimiento.",
    "desarrollar nuevas oportunidades de negocio"
  ),
  innovacion: challenge(
    "Podemos analizar ideas, proyectos y oportunidades para transformarlos en iniciativas concretas y alineadas con los objetivos de tu organización.",
    "impulsar proyectos de innovación"
  ),
  tecnologia: challenge(
    "Podemos evaluar necesidades tecnológicas, analizar alternativas y definir posibles caminos de implementación.",
    "resolver desafíos tecnológicos"
  ),
  otro: challenge(
    "Cada organización tiene sus propios desafíos. Lo importante es entender el contexto para identificar dónde puede estar la oportunidad.",
    "otro desafío de mi organización"
  ),

  // 3 · Precio
  precio: {
    say: [
      "Las consultorías estratégicas tienen una duración de 60 minutos.",
      "El valor de lanzamiento es de USD 120 o su equivalente en pesos argentinos.",
      "La propuesta está pensada para trabajar sobre una situación concreta, analizar oportunidades y obtener una mirada estratégica para definir próximos pasos.",
      { title: "¿Qué incluye?" },
      {
        list: [
          "Encuentro individual de 60 minutos con César Vidal Scasso.",
          "Análisis de la situación y los desafíos planteados.",
          "Orientación estratégica.",
          "Recomendaciones y posibles próximos pasos.",
        ],
      },
      "Para consultar por la contratación, coordinar una sesión o conocer el valor actualizado en pesos, podés escribirnos directamente por WhatsApp.",
    ],
    choices: [{ label: "Consultar por WhatsApp.", whatsapp: WA.precio }],
  },

  // 4 · Avanzar
  avanzar: {
    say: [
      "¡Excelente! Para avanzar, podés comunicarte con el equipo por WhatsApp.",
      "Allí podrán conocer mejor tu necesidad, responder tus consultas y coordinar los próximos pasos.",
    ],
    cta: { label: "Continuar por WhatsApp", whatsapp: WA.avanzar },
  },

  // 5 · Hablar con alguien
  humano: {
    say: [
      "¡Por supuesto! Si preferís conversar directamente con alguien del equipo, podés escribirnos por WhatsApp.",
    ],
    cta: { label: "Abrir WhatsApp", whatsapp: WA.general },
  },

  // Preguntas frecuentes
  faq: {
    say: ["Estas son algunas de las consultas más frecuentes:"],
    choices: [
      { label: "¿Cuánto dura una sesión?", to: "faqDuracion" },
      { label: "¿Con quién es la sesión?", to: "faqConQuien" },
      { label: "¿A quiénes está dirigida?", to: "faqPublico" },
      { label: "¿Es necesario tener conocimientos de inteligencia artificial?", to: "faqIa" },
      { label: "¿Cómo puedo contratar una consultoría?", to: "faqContratar" },
    ],
  },
  faqDuracion: {
    say: ["Cada consultoría tiene una duración de 60 minutos."],
    choices: [MORE_FAQ, ASK_WHATSAPP],
  },
  faqConQuien: {
    say: ["Las sesiones son individuales y están a cargo de César Vidal Scasso."],
    choices: [MORE_FAQ, ASK_WHATSAPP],
  },
  faqPublico: {
    say: [
      "A empresarios, emprendedores, dueños de pymes, directivos, gerentes y profesionales que buscan una mirada estratégica para resolver desafíos o desarrollar nuevas oportunidades.",
    ],
    choices: [MORE_FAQ, ASK_WHATSAPP],
  },
  faqIa: {
    say: [
      "No. Las consultorías se adaptan al contexto, la experiencia y las necesidades de cada persona u organización.",
    ],
    choices: [MORE_FAQ, ASK_WHATSAPP],
  },
  faqContratar: {
    say: [
      "Podés escribirnos directamente por WhatsApp para conversar sobre tu necesidad y coordinar los próximos pasos.",
    ],
    cta: { label: "Continuar por WhatsApp", whatsapp: WA.avanzar },
    choices: [MORE_FAQ],
  },

  // Free text that matches no path: no invented answers. The button's
  // message is replaced with what the visitor wrote (see the chat component).
  fallback: {
    say: [
      "Para poder orientarte mejor sobre esa consulta, lo ideal es que podamos conversar directamente con vos.",
    ],
    cta: { label: "Continuar por WhatsApp", whatsapp: WA.general },
  },
};

/**
 * Free text → a step, only for clear keywords of the paths above. Anything
 * else gets the fallback (WhatsApp); Avi never improvises an answer.
 */
const KEYWORDS: [RegExp, StepId][] = [
  [/\b(precio|precios|cuesta|cuestan|costo|costos|cuanto sale|valor|tarifa|usd|dolares)\b/, "precio"],
  [/\b(contratar|contrato|contratacion)\b/, "faqContratar"],
  [/\b(dura|duracion|cuanto tiempo)\b/, "faqDuracion"],
  [/\b(whatsapp|humano|persona|contacto|contactar|telefono)\b/, "humano"],
  [/\b(consultoria|consultorias)\b/, "consultorias"],
];

export function matchFreeText(text: string): StepId {
  const normalized = text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
  for (const [pattern, step] of KEYWORDS) {
    if (pattern.test(normalized)) return step;
  }
  return "fallback";
}
