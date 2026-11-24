import { cn } from "@/lib/utils";

export function Section({
  id,
  theme = "dark",
  mist = false,
  className,
  children,
}: {
  id?: string;
  theme?: "dark" | "light";
  /** Dark section that shows the fixed mist background (MistBackground)
   *  instead of a flat colour: its background becomes transparent. */
  mist?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      data-theme={theme}
      data-mist={mist ? "" : undefined}
      // Inline, because the global [data-theme] rule paints a background too.
      style={mist ? { background: "transparent" } : undefined}
      className={cn(
        "relative transition-colors duration-500",
        theme === "dark" ? cn(!mist && "bg-bg-dark", "text-fg-dark") : "bg-bg-light text-fg-light",
        className
      )}
    >
      {children}
    </section>
  );
}
