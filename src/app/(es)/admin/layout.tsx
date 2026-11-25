import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Panel de reservas — César Vidal Scasso",
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div data-theme="light" className="min-h-svh bg-bg-light text-fg-light">
      {children}
    </div>
  );
}
