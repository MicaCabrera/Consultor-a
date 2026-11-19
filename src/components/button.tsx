import { cn } from "@/lib/utils";
import { RollText } from "@/components/roll-text";

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
        "btn inline-flex items-center justify-center px-5 py-2.5 text-sm font-medium tracking-tight",
        variant === "solid" ? "btn-primary" : "btn-secondary",
        className
      )}
    >
      {typeof children === "string" ? <RollText text={children} /> : children}
    </a>
  );
}
