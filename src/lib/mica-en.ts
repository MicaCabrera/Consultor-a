/**
 * Avi in English: a faithful translation of the Spanish script (mica.ts),
 * same paths, same rules — it informs and hands the visitor over to
 * WhatsApp; it never books, schedules or handles payments.
 */
import type { Choice, Step, StepId } from "./mica";

export const WA_EN = {
  general: "Hi, I found César Vidal Scasso’s website and would like to ask a question.",
  consultorias: "Hi, I’ve been looking at César Vidal Scasso’s strategic consulting sessions and would like to ask a question.",
  precio: "Hi, I’d like to ask about the price and how to book a strategic consulting session with César Vidal Scasso.",
  avanzar: "Hi, I’ve been looking at the strategic consulting sessions and would like to know more about how to go ahead and arrange a session.",
  tema: (topic: string) =>
    `Hi, I’d like to talk about a possible consulting session with César Vidal Scasso. My question is about ${topic}.`,
  consulta: (text: string) => `Hi, I found César Vidal Scasso’s website and would like to ask: ${text}`,
} as const;

const MAIN_CHOICES: Choice[] = [
  { label: "I’d like to learn about the consulting sessions.", to: "consultorias" },
  { label: "I have a challenge in my company.", to: "desafio" },
  { label: "I’d like to know the price.", to: "precio" },
  { label: "I want to go ahead with a session.", to: "avanzar" },
  { label: "I’d like to talk to someone.", to: "humano" },
  { label: "Frequently asked questions.", to: "faq" },
];

const CHALLENGE_CLOSING =
  "If you like, you can tell us a bit more about your situation and continue the conversation on WhatsApp.";

const challenge = (answer: string, topic: string): Step => ({
  say: [answer, CHALLENGE_CLOSING],
  cta: { label: "Chat on WhatsApp", whatsapp: WA_EN.tema(topic) },
});

const MORE_FAQ: Choice = { label: "See other questions.", to: "faq" };
const ASK_WHATSAPP: Choice = { label: "Ask on WhatsApp.", whatsapp: WA_EN.general };

export const STEPS_EN: Record<StepId, Step> = {
  welcome: {
    say: [
      "Hi! I’m Avi, César’s virtual assistant.",
      "I’m here to help you learn about his consulting sessions, how they can support you and the best way to move forward.",
      "What would you like to know?",
    ],
    choices: MAIN_CHOICES,
  },

  menu: {
    say: ["What would you like to know about?"],
    choices: MAIN_CHOICES,
  },

  consultorias: {
    say: [
      "The strategic consulting sessions are one-to-one meetings to analyse your organisation’s challenges, identify opportunities and define possible courses of action.",
      "They are designed for business owners, entrepreneurs, executives and professionals who need a strategic perspective to make decisions and move forward.",
      { title: "Which areas can he help you with?" },
      {
        list: [
          "Artificial intelligence and new technologies.",
          "Innovation and business transformation.",
          "Business development and new opportunities.",
          "Process optimisation and automation.",
          "Gaming and new technology industries.",
        ],
      },
      "Each session is adapted to the situation and needs of each person or organisation.",
    ],
    choices: [
      { label: "I’d like to know how it works.", to: "funcionamiento" },
      { label: "I’d like to talk about my case.", to: "desafio" },
    ],
  },
  funcionamiento: {
    say: [
      "The session is one-to-one and lasts 60 minutes. We work on your particular situation, analyse opportunities and identify possible actions to move forward.",
    ],
    choices: [{ label: "Ask on WhatsApp.", whatsapp: WA_EN.consultorias }],
  },

  desafio: {
    say: ["Great! To guide you better, tell me which topic you’d like to work on."],
    choices: [
      { label: "Adopting artificial intelligence.", to: "ia" },
      { label: "Optimising processes and automating tasks.", to: "procesos" },
      { label: "Developing new business opportunities.", to: "negocios" },
      { label: "Driving innovation projects.", to: "innovacion" },
      { label: "Solving technology challenges.", to: "tecnologia" },
      { label: "Another challenge.", to: "otro" },
    ],
  },
  ia: challenge(
    "We can look at how to bring artificial intelligence tools into your organisation, identify where they can be applied and assess which solutions can add value to your activity.",
    "adopting artificial intelligence"
  ),
  procesos: challenge(
    "We can identify processes that could be improved, spot repetitive tasks and explore ways to optimise how your organisation works.",
    "optimising processes and automating tasks"
  ),
  negocios: challenge(
    "We can work on new business models, market opportunities, services and strategies to drive growth.",
    "developing new business opportunities"
  ),
  innovacion: challenge(
    "We can analyse ideas, projects and opportunities to turn them into concrete initiatives aligned with your organisation’s goals.",
    "driving innovation projects"
  ),
  tecnologia: challenge(
    "We can assess technology needs, analyse alternatives and define possible implementation paths.",
    "solving technology challenges"
  ),
  otro: challenge(
    "Every organisation has its own challenges. What matters is understanding the context to find where the opportunity may be.",
    "another challenge in my organisation"
  ),

  precio: {
    say: [
      "The strategic consulting sessions last 60 minutes.",
      "The launch price is USD 120 or its equivalent in Argentine pesos.",
      "The session is designed to work on a specific situation, analyse opportunities and gain a strategic perspective to define next steps.",
      { title: "What’s included?" },
      {
        list: [
          "A one-to-one, 60-minute session with César Vidal Scasso.",
          "Analysis of the situation and the challenges raised.",
          "Strategic guidance.",
          "Recommendations and possible next steps.",
        ],
      },
      "To ask about booking, arrange a session or find out the current price in pesos, you can message us directly on WhatsApp.",
    ],
    choices: [{ label: "Ask on WhatsApp.", whatsapp: WA_EN.precio }],
  },

  avanzar: {
    say: [
      "Excellent! To go ahead, you can contact the team on WhatsApp.",
      "There they can learn more about what you need, answer your questions and arrange the next steps.",
    ],
    cta: { label: "Continue on WhatsApp", whatsapp: WA_EN.avanzar },
  },

  humano: {
    say: ["Of course! If you’d rather talk directly with someone from the team, you can message us on WhatsApp."],
    cta: { label: "Open WhatsApp", whatsapp: WA_EN.general },
  },

  faq: {
    say: ["Here are some of the most frequent questions:"],
    choices: [
      { label: "How long is a session?", to: "faqDuracion" },
      { label: "Who is the session with?", to: "faqConQuien" },
      { label: "Who is it for?", to: "faqPublico" },
      { label: "Do I need to know about artificial intelligence?", to: "faqIa" },
      { label: "How can I book a session?", to: "faqContratar" },
    ],
  },
  faqDuracion: {
    say: ["Each consulting session lasts 60 minutes."],
    choices: [MORE_FAQ, ASK_WHATSAPP],
  },
  faqConQuien: {
    say: ["The sessions are one-to-one and led by César Vidal Scasso."],
    choices: [MORE_FAQ, ASK_WHATSAPP],
  },
  faqPublico: {
    say: [
      "Business owners, entrepreneurs, SME owners, executives, managers and professionals looking for a strategic perspective to solve challenges or develop new opportunities.",
    ],
    choices: [MORE_FAQ, ASK_WHATSAPP],
  },
  faqIa: {
    say: ["No. The sessions adapt to the context, experience and needs of each person or organisation."],
    choices: [MORE_FAQ, ASK_WHATSAPP],
  },
  faqContratar: {
    say: ["You can message us directly on WhatsApp to talk about what you need and arrange the next steps."],
    cta: { label: "Continue on WhatsApp", whatsapp: WA_EN.avanzar },
    choices: [MORE_FAQ],
  },

  fallback: {
    say: ["To guide you better on that question, it’s best if we talk with you directly."],
    cta: { label: "Continue on WhatsApp", whatsapp: WA_EN.general },
  },
};

const KEYWORDS_EN: [RegExp, StepId][] = [
  [/\b(price|prices|cost|costs|how much|fee|fees|rate|usd|dollars)\b/, "precio"],
  [/\b(book|booking|hire|hiring)\b/, "faqContratar"],
  [/\b(long|length|duration|how much time)\b/, "faqDuracion"],
  [/\b(whatsapp|human|person|contact|phone)\b/, "humano"],
  [/\b(consulting|consultancy|session|sessions)\b/, "consultorias"],
];

export function matchFreeTextEn(text: string): StepId {
  const normalized = text.toLowerCase();
  for (const [pattern, step] of KEYWORDS_EN) {
    if (pattern.test(normalized)) return step;
  }
  return "fallback";
}

/** Chat window text. */
export const CHAT_UI_EN = {
  openChat: "Open chat",
  openChatTitle: "Open chat with Avi, virtual assistant",
  dialog: "Chat with Avi, virtual assistant",
  role: "Virtual assistant",
  online: "Online",
  whatsapp: "Talk on WhatsApp",
  restart: "Restart conversation",
  close: "Close chat",
  back: "Back to the main menu",
  typing: "Avi is typing",
  placeholder: "Type your question…",
  send: "Send message",
};

