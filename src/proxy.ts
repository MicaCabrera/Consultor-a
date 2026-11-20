import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { bookingEnabled } from "@/lib/booking/feature";

/**
 * Booking and admin routes only.
 *
 * While the booking system is switched off (BOOKING_ENABLED is not "true"),
 * every request to /reservar or /admin is sent back to the home page.
 *
 * When it is on, this keeps the Supabase session cookie fresh on /admin and
 * does an optimistic redirect to the login page. That is NOT the authorization
 * check: every admin page and action verifies the admin role on the server,
 * and RLS enforces it again in the database.
 */
export async function proxy(request: NextRequest) {
  if (!bookingEnabled()) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  let response = NextResponse.next({ request });
  if (!request.nextUrl.pathname.startsWith("/admin")) return response;

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY;
  if (!url || !key) return response;

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (list) => {
        list.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        list.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const onLogin = request.nextUrl.pathname.startsWith("/admin/login");
  if (!user && !onLogin) {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }
  if (user && onLogin && !request.nextUrl.searchParams.has("error")) {
    return NextResponse.redirect(new URL("/admin", request.url));
  }
  return response;
}

export const config = {
  matcher: ["/reservar/:path*", "/admin/:path*"],
};
