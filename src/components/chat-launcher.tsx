"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useContent } from "@/components/locale-provider";

/**
 * The chat, kept off the first load. Until the page has loaded and is idle,
 * only a light HTML/CSS button is shown, in the same place and size as the
 * real launcher, with a soft two-tone green glow standing in for its animation. Then
 * the chat (its script, the conversation and the glow animation) loads; if
 * the visitor clicks the button before that, it loads right away and opens.
 */
const MicaChat = dynamic(() => import("@/components/mica-chat").then((m) => m.MicaChat), {
  ssr: false,
  loading: () => <Placeholder />,
});

function Placeholder({ onOpen }: { onOpen?: () => void }) {
  const { ui } = useContent();
  return (
    <button
      type="button"
      data-cursor="link"
      aria-label={ui.openChat}
      title={ui.openChatTitle}
      onClick={onOpen}
      className="fixed right-4 bottom-4 z-[70] flex h-16 w-16 items-center justify-center md:right-6 md:bottom-6 md:h-20 md:w-20"
    >
      <span
        aria-hidden
        className="block h-3/5 w-3/5 rounded-full blur-[2px]"
        // Same as the animated glow: a lit sphere in one green, luminous mint
        // where the light falls (top left), deep green at the edge.
        style={{
          background:
            "radial-gradient(circle at 36% 32%, #b6fbe6 0%, #30e6b0 42%, #0c785a 68%, rgba(12,120,90,0) 74%)",
        }}
      />
    </button>
  );
}

export function ChatLauncher() {
  const [load, setLoad] = useState(false);
  const [openNow, setOpenNow] = useState(false);

  useEffect(() => {
    if (load) return;
    let idle = 0;
    const go = () => setLoad(true);
    const onLoad = () => {
      idle = window.requestIdleCallback ? window.requestIdleCallback(go, { timeout: 3000 }) : window.setTimeout(go, 1500);
    };
    if (document.readyState === "complete") onLoad();
    else window.addEventListener("load", onLoad, { once: true });
    return () => {
      window.removeEventListener("load", onLoad);
      if (window.cancelIdleCallback) window.cancelIdleCallback(idle);
      window.clearTimeout(idle);
    };
  }, [load]);

  if (!load) {
    return (
      <Placeholder
        onOpen={() => {
          setOpenNow(true);
          setLoad(true);
        }}
      />
    );
  }
  return <MicaChat initialOpen={openNow} />;
}
