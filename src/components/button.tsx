import { cn } from "@/lib/utils";

export function Button({
  href,
  children,
  variant = "solid",
  className,
}: {
  href: string;
  children: React.ReactNode;
  variant?: "solid" | "outline";
  className?: string;
}) {
  return (
    <a
      href={href}
      data-cursor="link"
      className={cn(
        "btn relative inline-flex items-center justify-center px-5 py-2.5 text-sm font-medium tracking-tight",
        variant === "solid" ? "btn-primary" : "btn-secondary",
        className
      )}
    >
      {/* Hover: a short line runs once around the border (see .btn-trace) */}
      <svg aria-hidden className="btn-trace" width="100%" height="100%">
        <rect pathLength={100} />
      </svg>
      <span className="relative">{children}</span>
    </a>
  );
}
