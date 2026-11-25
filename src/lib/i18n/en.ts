import type { Content } from "./es";

/**
 * English: a faithful translation of the Spanish copy (es.ts). Nothing here
 * says more than the Spanish does. Review before publishing.
 */
export const en: Content = {
  nav: [
    { label: "Home", href: "#inicio" },
    { label: "About", href: "#sobre-mi" },
    { label: "Expertise", href: "#especialidades" },
    { label: "Consulting", href: "#consultoria" },
    { label: "How it works", href: "#como-funciona" },
  ],

  hero: {
    eyebrow: "Strategic consulting · Technology · AI · Innovation",
    headingPrefix: "Is your business ready for",
    headingHighlight: "what’s next",
    headingSuffix: "?",
    description: "Discover how to apply new technologies, get ahead of change and create opportunities for growth.",
    cta: "Consulting",
  },

  intro: {
    heading: "Technology matters when it delivers results",
    name: { prefix: "I’m", highlight: "César Vidal Scasso", suffix: "" },
    photo: { src: "/about/foto.jpeg", alt: "César Vidal Scasso in a working meeting with his team" },
    paragraphs: [
      "I work where technology, innovation and business development meet, helping to spot opportunities and turn ideas into concrete projects.",
      "My approach combines strategic vision and technological know-how to analyse challenges, find room for improvement and map out a course of action.",
      "I believe adopting technology is not a goal in itself. What matters is understanding what each organisation needs and how to use the right tools to get there.",
    ],
    cta: "See my background",
  },

  specialties: {
    heading: "Thinking about the future to solve today’s challenges",
    description:
      "I support companies, organisations and entrepreneurs in identifying opportunities, adopting new technologies and developing innovative solutions to turn ideas into concrete projects and open up new opportunities for growth.",
    items: [
      {
        title: "Artificial intelligence",
        description:
          "Identifying and implementing AI-based solutions to transform processes, improve services and strengthen business models. From exploring tools to building concrete applications that create value.",
      },
      {
        title: "Automation and optimisation",
        description:
          "Analysing processes and operations to find tasks that can be simplified, automated or improved with technology. Designing solutions that cut time, make better use of resources and make organisations more efficient.",
      },
      {
        title: "Technology transformation",
        description:
          "Support in adopting new technologies and tools to evolve processes, services and ways of working. Assessing alternatives, planning implementations and developing transformation strategies.",
      },
      {
        title: "Innovation and new business",
        description:
          "Developing ideas, products and business models from new technological opportunities. Exploring innovation methods, gamification and emerging technologies to design experiences, validate proposals and create new projects.",
      },
      {
        title: "Strategy and project development",
        description:
          "Strategic advice for companies, startups and institutions looking to launch new initiatives or scale their operations. Analysing opportunities, setting goals and planning actions to turn ideas into sustainable projects.",
      },
    ],
  },

  consulting: {
    heading: "One hour to think through your next steps.",
    description:
      "A tailored working session to analyse a specific challenge in your company, project or professional activity. During the session we’ll work on your current situation, identify opportunities and assess possible solutions.",
    price: "USD 120",
    priceNote: "Launch price",
    cta: "Book my session",
  },

  audience: {
    eyebrow: "Who is it for?",
    heading: "A strategic perspective to drive change.",
    items: [
      {
        title: "Companies",
        description:
          "Companies and SMEs looking to innovate, streamline processes and find new opportunities for growth.",
      },
      {
        title: "Leadership",
        description:
          "Directors and managers who need to assess new technologies and make strategic decisions for their organisations.",
      },
      {
        title: "Teams",
        description:
          "Organisations looking to bring in gamification, automation and new tools to transform their processes.",
      },
      {
        title: "Startups",
        description:
          "Entrepreneurs who need to validate ideas, develop innovative products and build scalable business models.",
      },
      {
        title: "Professionals",
        description:
          "People who want to understand technology trends and make the most of new opportunities for innovation.",
      },
    ],
  },

  process: {
    eyebrow: "How it works",
    heading: "Good decisions start with a conversation.",
    steps: [
      {
        number: "01",
        title: "Tell us what you need",
        description:
          "Fill in the initial form with information about your company, your activity and the challenges you want to tackle.",
      },
      {
        number: "02",
        title: "Choose your time",
        description: "Pick one of the available slots to arrange your one-to-one, 60-minute consulting session.",
      },
      {
        number: "03",
        title: "Confirm your booking",
        description:
          "Receive the payment instructions and make the bank transfer to go ahead with booking your session.",
      },
      {
        number: "04",
        title: "Let’s prepare the meeting",
        description:
          "Once the payment has cleared, you’ll receive the confirmation of your slot and a short form to explore your needs in more depth.",
      },
      {
        number: "05",
        title: "Let’s take action",
        description:
          "We meet for 60 minutes to analyse your situation, identify opportunities and define recommendations and next steps.",
      },
    ],
  },

  about: {
    eyebrow: "About César",
    heading: "Experience, vision and technological know-how at the service of business.",
    paragraphs: [
      "Innovation takes more than knowing the tools: it means understanding the challenges organisations face, assessing opportunities and making decisions with perspective.",
      "Throughout my career I have worked on projects related to technology, artificial intelligence, innovation and business development.",
      "My aim is to bring that knowledge to those who need to make decisions, drive projects and prepare for the changes transforming the business world.",
    ],
    cta: "See professional background",
    placeholder:
      "This section is to be completed with his validated biography, experience, positions, organisations and key projects.",
  },

  finalCta: {
    heading: "Opportunities appear when you know where to look.",
    description:
      "Let’s explore together how technology can help you solve challenges and develop new opportunities for your business.",
    cta: "Book a session",
  },

  footer: {
    name: "César Vidal Scasso",
    description: "Strategic consulting in technology, artificial intelligence and innovation.",
    links: [
      { label: "Home", href: "#inicio" },
      { label: "About", href: "#sobre-mi" },
      { label: "Expertise", href: "#especialidades" },
      { label: "Consulting", href: "#consultoria" },
      { label: "Contact", href: "#contacto" },
    ],
    social: [
      { label: "LinkedIn", href: "https://www.linkedin.com/in/cesarvidalok/" },
      { label: "Instagram", href: "https://www.instagram.com/cesarvidalok/" },
    ],
    email: "cesarvidalscasso@gmail.com",
    copyright: "© 2026 César Vidal Scasso. All rights reserved.",
  },

  ui: {
    skipLink: "Skip to content",
    menu: "Menu",
    openMenu: "Open menu",
    close: "Close",
    sectionsNav: "Sections",
    footerNav: "Footer",
    hours: "Monday to Friday · 9 am to 12 pm",
    language: "Language",
    pauseVideo: "Pause the background video",
    playVideo: "Play the background video",
    openChat: "Open chat",
    openChatTitle: "Open chat with Avi, virtual assistant",
  },

  meta: {
    title: "César Vidal Scasso — Strategic consulting in technology and AI",
    description:
      "One-to-one, 60-minute consulting sessions on technology, artificial intelligence, innovation and business development.",
    ogLocale: "en_US",
    jobTitle: "Strategic consultant in technology, artificial intelligence and innovation",
    offerName: "One-to-one 60-minute consulting session (online)",
    serviceName: "One-to-one strategic consulting",
    serviceType: "Consulting in technology, artificial intelligence and innovation",
    catalogName: "Expertise",
  },
};
