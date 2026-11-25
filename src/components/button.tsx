import { cn } from "@/lib/utils";

/** ↗ for links that leave the site (e.g. WhatsApp), → for the ones within it. */
function Arrow({ out }: { out: boolean }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("btn-arrow relative h-[1.05em] w-[1.05em] shrink-0", out ? "btn-arrow-out" : "btn-arrow-in")}
    >
      {out ? <path d="M7 17 17 7M8.5 7H17v8.5" /> : <path d="M5 12h14M13 6l6 6-6 6" />}
    </svg>
  );
}

export function Button({
  href,
  children,
  variant = "solid",
  className,
  external = false,
}: {
  href: string;
  children: React.ReactNode;
  variant?: "solid" | "outline";
  className?: string;
  /** Opens in a new tab (e.g. WhatsApp). */
  external?: boolean;
}) {
  return (
    <a
      href={href}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      data-cursor="link"
      className={cn(
        "btn relative inline-flex items-center justify-center gap-3 px-7 py-3.5 text-[15px] font-medium tracking-tight",
        variant === "solid" ? "btn-primary" : "btn-secondary",
        className
      )}
    >
      <span className="relative">{children}</span>
      <Arrow out={external} />
    </a>
  );
}
