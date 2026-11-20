"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useSafeReducedMotion } from "@/lib/use-reduced-motion";
import { MicaAnimation } from "@/components/mica-animation";
import {
  STEPS,
  WA,
  matchFreeText,
  whatsappUrl,
  type Block,
  type Choice,
  type StepId,
} from "@/lib/mica";

type Message =
  // `asked`: the free text that led to the fallback, sent along to WhatsApp.
  | { id: number; from: "mica"; step: StepId; asked?: string }
  | { id: number; from: "visitor"; text: string };

const EASE = [0.16, 1, 0.3, 1] as const;
// Pause before Mica answers, so replies arrive one at a time.
const TYPING_MS = 650;

const START: Message[] = [{ id: 0, from: "mica", step: "welcome" }];

/**
 * Floating assistant "Mica": a button fixed bottom-right that opens the chat.
 * The conversation lives in this component's state, so closing and reopening
 * the window keeps it until the visitor restarts it (or leaves the page).
 */
export function MicaChat() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>(START);
  const [typing, setTyping] = useState(false);
  const [draft, setDraft] = useState("");
  const nextId = useRef(1);
  const timer = useRef<number | undefined>(undefined);

  const reduce = useSafeReducedMotion();
  const panelId = useId();
  const launcherRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const logRef = useRef<HTMLDivElement>(null);

  const reply = useCallback(
    (visitorText: string, step: StepId, asked?: string) => {
      window.clearTimeout(timer.current);
      setMessages((m) => [...m, { id: nextId.current++, from: "visitor", text: visitorText }]);
      setTyping(true);
      timer.current = window.setTimeout(() => {
        setTyping(false);
        setMessages((m) => [...m, { id: nextId.current++, from: "mica", step, asked }]);
      }, reduce ? 0 : TYPING_MS);
    },
    [reduce]
  );

  const onChoice = (choice: Choice) => {
    if ("to" in choice) reply(choice.label, choice.to);
  };

  const onSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const text = draft.trim();
    if (!text || typing) return;
    setDraft("");
    const step = matchFreeText(text);
    reply(text, step, step === "fallback" ? text : undefined);
  };

  const restart = () => {
    window.clearTimeout(timer.current);
    setTyping(false);
    setDraft("");
    setMessages(START);
  };

  const close = useCallback(() => {
    setOpen(false);
    launcherRef.current?.focus();
  }, []);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  // Esc closes. On phones the chat covers the screen: lock the page behind it.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    const small = window.matchMedia("(max-width: 639px)").matches;
    const previous = document.body.style.overflow;
    if (small) document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      if (small) document.body.style.overflow = previous;
    };
  }, [open, close]);

  // Keep the newest message in view.
  useEffect(() => {
    const log = logRef.current;
    if (log) log.scrollTo({ top: log.scrollHeight, behavior: reduce ? "auto" : "smooth" });
  }, [messages, typing, open, reduce]);

  const lastMicaIndex = messages.findLastIndex((m) => m.from === "mica");

  return (
    <>
      {/* Launcher */}
      <AnimatePresence>
        {!open && (
          <motion.button
            ref={launcherRef}
            type="button"
            data-cursor="link"
            aria-label="Abrir chat con Mica, asistente virtual"
            aria-expanded={false}
            aria-controls={panelId}
            onClick={() => setOpen(true)}
            initial={{ opacity: 0, scale: 0.8, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{
              duration: reduce ? 0 : 0.5,
              ease: EASE,
              delay: reduce ? 0 : 0.2,
            }}
            className="group fixed right-4 bottom-4 z-[70] flex h-20 w-20 items-center justify-center md:right-6 md:bottom-6"
          >
            <MicaAnimation className="h-full w-full transition-transform duration-300 group-hover:scale-110" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Window */}
      <AnimatePresence>
        {open && (
          <motion.div
            id={panelId}
            role="dialog"
            aria-label="Chat con Mica, asistente virtual"
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: 24, scale: 0.98 }}
            transition={{ duration: reduce ? 0 : 0.45, ease: EASE }}
            style={{ transformOrigin: "bottom right" }}
            className={cn(
              "fixed z-[70] flex flex-col overflow-hidden bg-bg-dark/90 text-fg-dark shadow-[0_24px_80px_rgba(0,0,0,0.45)] ring-1 ring-white/10 backdrop-blur-2xl",
              // Phones: (almost) the whole screen. Larger: a window bottom-right.
              "inset-0 h-[100dvh] sm:inset-auto sm:right-6 sm:bottom-6 sm:h-[min(620px,calc(100dvh-48px))] sm:w-[390px] md:right-8 md:bottom-8"
            )}
          >
            {/* Header */}
            <div className="flex items-center gap-3 bg-white/[0.04] px-5 py-4">
              <div className="min-w-0 flex-1 leading-tight">
                <p className="font-semibold">Mica</p>
                <p className="flex items-center gap-1.5 text-xs whitespace-nowrap text-muted-dark">
                  Asistente virtual
                  <span aria-hidden>·</span>
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inset-0 animate-ping rounded-full bg-accent opacity-60 motion-reduce:animate-none" />
                    <span className="relative h-1.5 w-1.5 rounded-full bg-accent" />
                  </span>
                  En línea
                </p>
              </div>
              <HeaderButton href={whatsappUrl(WA.general)} label="Hablar por WhatsApp">
                <WhatsAppIcon className="h-[18px] w-[18px]" />
              </HeaderButton>
              <HeaderButton onClick={restart} label="Reiniciar conversación">
                <RestartIcon className="h-[18px] w-[18px]" />
              </HeaderButton>
              <HeaderButton onClick={close} label="Cerrar chat">
                <CloseIcon className="h-[18px] w-[18px]" />
              </HeaderButton>
            </div>

            {/* Conversation */}
            <div
              ref={logRef}
              role="log"
              aria-live="polite"
              className="flex-1 space-y-4 overflow-y-auto overscroll-contain px-5 py-5 [scrollbar-width:thin]"
              data-lenis-prevent
            >
              {messages.map((m, i) => (
                <motion.div
                  key={m.id}
                  initial={reduce ? false : { opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, ease: EASE }}
                >
                  {m.from === "visitor" ? (
                    <VisitorBubble text={m.text} />
                  ) : (
                    <MicaTurn
                      step={m.step}
                      asked={m.asked}
                      active={i === lastMicaIndex && !typing}
                      showBack={m.step !== "welcome" && m.step !== "menu"}
                      onChoice={onChoice}
                      onBack={() => reply("Volver al menú principal", "menu")}
                    />
                  )}
                </motion.div>
              ))}
              <AnimatePresence>
                {typing && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex w-fit items-center gap-1 bg-white/[0.06] px-4 py-3"
                    aria-label="Mica está escribiendo"
                  >
                    {[0, 1, 2].map((d) => (
                      <motion.span
                        key={d}
                        className="h-1.5 w-1.5 rounded-full bg-muted-dark"
                        animate={reduce ? undefined : { opacity: [0.3, 1, 0.3] }}
                        transition={{ duration: 1, repeat: Infinity, delay: d * 0.15 }}
                      />
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Input */}
            <form
              onSubmit={onSubmit}
              className="flex items-center gap-2 bg-white/[0.04] px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
            >
              <label className="sr-only" htmlFor={`${panelId}-input`}>
                Escribí tu mensaje
              </label>
              <input
                id={`${panelId}-input`}
                ref={inputRef}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Escribí tu consulta…"
                autoComplete="off"
                maxLength={500}
                className="min-w-0 flex-1 bg-white/[0.06] px-4 py-3 text-base text-fg-dark placeholder:text-muted-dark focus:bg-white/[0.09] focus:outline-none sm:text-sm"
              />
              <button
                type="submit"
                data-cursor="link"
                disabled={!draft.trim() || typing}
                aria-label="Enviar mensaje"
                className="flex h-11 w-11 shrink-0 items-center justify-center bg-accent text-bg-dark transition-opacity disabled:opacity-40"
              >
                <SendIcon className="h-[18px] w-[18px]" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

/** One answer from Mica: its text and, if it is the latest one, its buttons. */
function MicaTurn({
  step,
  asked,
  active,
  showBack,
  onChoice,
  onBack,
}: {
  step: StepId;
  asked?: string;
  active: boolean;
  showBack: boolean;
  onChoice: (choice: Choice) => void;
  onBack: () => void;
}) {
  const { say, cta, choices } = STEPS[step];
  return (
    <div className="flex max-w-[92%] flex-col items-start gap-3">
      <div className="space-y-3 bg-white/[0.06] px-4 py-3 text-[14px] leading-relaxed text-fg-dark/90">
        {say.map((block, i) => (
          <MessageBlock key={i} block={block} />
        ))}
      </div>

      {cta && (
        <WhatsAppButton message={asked ? WA.consulta(asked) : cta.whatsapp} primary>
          {cta.label}
        </WhatsAppButton>
      )}

      {active && (choices?.length || showBack) ? (
        <div className="flex flex-col items-start gap-2">
          {choices?.map((choice) =>
            "to" in choice ? (
              <button
                key={choice.label}
                type="button"
                data-cursor="link"
                onClick={() => onChoice(choice)}
                className="bg-accent/10 px-3.5 py-2 text-left text-[13px] text-accent transition-colors hover:bg-accent hover:text-bg-dark"
              >
                {choice.label}
              </button>
            ) : (
              <WhatsAppButton key={choice.label} message={choice.whatsapp}>
                {choice.label}
              </WhatsAppButton>
            )
          )}
          {showBack && (
            <button
              type="button"
              data-cursor="link"
              onClick={onBack}
              className="px-1 py-1.5 text-[12px] text-muted-dark underline-offset-4 transition-colors hover:text-fg-dark hover:underline"
            >
              ← Volver al menú principal
            </button>
          )}
        </div>
      ) : null}
    </div>
  );
}

/** Opens WhatsApp in a new tab with a pre-filled message. */
function WhatsAppButton({
  message,
  primary = false,
  children,
}: {
  message: string;
  primary?: boolean;
  children: React.ReactNode;
}) {
  return (
    <a
      href={whatsappUrl(message)}
      target="_blank"
      rel="noopener noreferrer"
      data-cursor="link"
      className={cn(
        "inline-flex items-center gap-2 transition-colors",
        primary
          ? "bg-accent px-4 py-2.5 text-[13px] font-semibold text-bg-dark hover:bg-accent/85"
          : "bg-accent/10 px-3.5 py-2 text-[13px] text-accent hover:bg-accent hover:text-bg-dark"
      )}
    >
      <WhatsAppIcon className={primary ? "h-4 w-4" : "h-3.5 w-3.5"} />
      {children}
    </a>
  );
}

function MessageBlock({ block }: { block: Block }) {
  if (typeof block === "string") return <p>{block}</p>;
  if ("title" in block) return <p className="pt-1 font-semibold text-fg-dark">{block.title}</p>;
  return (
    <ul className="space-y-1">
      {block.list.map((item) => (
        <li key={item} className="flex gap-2">
          <span aria-hidden className="text-accent">
            ⊹
          </span>
          {item}
        </li>
      ))}
    </ul>
  );
}

function VisitorBubble({ text }: { text: string }) {
  return (
    <div className="flex justify-end">
      <p className="max-w-[85%] bg-accent px-4 py-2.5 text-[14px] leading-relaxed break-words text-bg-dark">
        {text}
      </p>
    </div>
  );
}

function HeaderButton({
  label,
  onClick,
  href,
  children,
}: {
  label: string;
  onClick?: () => void;
  href?: string;
  children: React.ReactNode;
}) {
  const className =
    "flex h-9 w-9 shrink-0 items-center justify-center text-muted-dark transition-colors hover:bg-white/[0.08] hover:text-fg-dark";
  if (href) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={label}
        title={label}
        data-cursor="link"
        className={className}
      >
        {children}
      </a>
    );
  }
  return (
    <button type="button" onClick={onClick} aria-label={label} title={label} data-cursor="link" className={className}>
      {children}
    </button>
  );
}

/* Icons (inline, stroke follows currentColor) */

function SendIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M5 12h13M13 6l6 6-6 6" />
    </svg>
  );
}

function RestartIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M4 12a8 8 0 1 0 2.4-5.7M4 4v4h4" />
    </svg>
  );
}

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" className={className} aria-hidden>
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2c-1.5 0-3-.4-4.3-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.2-.4.7-1.4.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.4.1-.6.3-.2.2-.8.8-.8 2s.8 2.3.9 2.5c.1.2 1.6 2.5 4 3.5 1.5.6 2 .7 2.8.6.4-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.1-1.2l-.5-.3z" />
    </svg>
  );
}
