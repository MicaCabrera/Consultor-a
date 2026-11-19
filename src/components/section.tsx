import { cn } from "@/lib/utils";

export function Section({
  id,
  theme = "dark",
  className,
  children,
}: {
  id?: string;
  theme?: "dark" | "light";
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      data-theme={theme}
      className={cn(
        "relative transition-colors duration-500",
        theme === "dark" ? "bg-bg-dark text-fg-dark" : "bg-bg-light text-fg-light",
        className
      )}
    >
      {children}
    </section>
  );
}
