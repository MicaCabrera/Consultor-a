"use server";

import { redirect } from "next/navigation";
import { sessionClient } from "@/lib/supabase/clients";
import { bookingEnabled } from "@/lib/booking/feature";

export type LoginState = { error: string | null };

export async function signIn(_prev: LoginState, formData: FormData): Promise<LoginState> {
  if (!bookingEnabled()) redirect("/");
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { error: "Ingresá email y contraseña." };

  const supabase = await sessionClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.user) return { error: "Email o contraseña incorrectos." };

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", data.user.id)
    .maybeSingle();
  if (!profile?.is_admin) {
    await supabase.auth.signOut();
    return { error: "Esta cuenta no tiene acceso al panel." };
  }

  redirect("/admin");
}

export async function signOut() {
  if (!bookingEnabled()) redirect("/");
  const supabase = await sessionClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}
