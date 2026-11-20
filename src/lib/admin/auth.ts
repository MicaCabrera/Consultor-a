import "server-only";

import { redirect } from "next/navigation";
import { connection } from "next/server";
import { sessionClient } from "@/lib/supabase/clients";
import { bookingEnabled } from "@/lib/booking/feature";

/**
 * The real admin check (data access layer). Call it at the top of every admin
 * page and server action. RLS enforces the same rule in the database.
 */
export async function requireAdmin() {
  // Decide at request time, never baked into a prerendered page.
  await connection();
  if (!bookingEnabled()) redirect("/");
  const supabase = await sessionClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile?.is_admin) redirect("/admin/login?error=forbidden");

  return { supabase, user };
}
