import { Suspense } from "react";
import { LoginForm } from "./login-form";

async function Form({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  return <LoginForm forbidden={error === "forbidden"} />;
}

export default function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  return (
    <main className="flex min-h-svh items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm">
        <p className="text-lg font-semibold tracking-tight">
          <span className="mr-[0.3em] text-accent">⊹</span>CVS
        </p>
        <h1 className="mt-8 text-3xl font-medium tracking-tight">Panel de reservas</h1>
        <p className="mt-2 text-sm text-muted">Acceso solo para administración.</p>
        <div className="mt-8">
          {/* searchParams is request data: stream it behind a boundary. */}
          <Suspense fallback={<div className="h-64 animate-pulse bg-current/5" />}>
            <Form searchParams={searchParams} />
          </Suspense>
        </div>
      </div>
    </main>
  );
}
