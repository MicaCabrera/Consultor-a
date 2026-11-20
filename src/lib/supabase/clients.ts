import "server-only";

import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { env } from "@/lib/env";

/**
 * Three ways to reach Supabase, all server-side:
 *
 * - publicClient   anon key, no session. Used by the public booking form,
 *                  which can only call the two exposed SQL functions.
 * - sessionClient  anon key + the visitor's auth cookies. Used by /admin;
 *                  RLS decides what an admin can read and change.
 * - serviceClient  service_role key, bypasses RLS. Only for the cron job.
 */

const noSession = { auth: { persistSession: false, autoRefreshToken: false } };

export function publicClient() {
  return createClient(env.supabaseUrl(), env.supabaseAnonKey(), noSession);
}

export async function sessionClient() {
  const store = await cookies();
  return createServerClient(env.supabaseUrl(), env.supabaseAnonKey(), {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (list) => {
        try {
          list.forEach(({ name, value, options }) => store.set(name, value, options));
        } catch {
          // Called from a Server Component, where cookies are read-only.
          // The proxy refreshes the session cookie on the next request.
        }
      },
    },
  });
}

export function serviceClient() {
  return createClient(env.supabaseUrl(), env.supabaseServiceRoleKey(), noSession);
}
