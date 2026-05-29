import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { supabasePublishableKey, supabaseUrl } from "./lib/supabase/config";

const inactivityLimitMs = 24 * 60 * 60 * 1000;

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    supabaseUrl,
    supabasePublishableKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(
          cookiesToSet: {
            name: string;
            value: string;
            options: CookieOptions;
          }[]
        ) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });

          response = NextResponse.next({
            request,
          });

          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isAuthPage = request.nextUrl.pathname.startsWith("/login");
  const isCallbackPage = request.nextUrl.pathname.startsWith("/auth/callback");
  const isProtectedPage =
    request.nextUrl.pathname.startsWith("/dashboard") ||
    request.nextUrl.pathname.startsWith("/admin");

  if (!user && isProtectedPage) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (user && isAuthPage) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  if (user && isProtectedPage) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("last_seen_at")
      .eq("id", user.id)
      .maybeSingle();

    if (isInactive(profile?.last_seen_at)) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("reason", "inactive");
      const redirect = NextResponse.redirect(url);
      expireAuthCookies(request, redirect);
      return redirect;
    }

    await supabase
      .from("profiles")
      .update({ last_seen_at: new Date().toISOString() })
      .eq("id", user.id);
  }

  if (isCallbackPage) {
    return response;
  }

  return response;
}

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*", "/login", "/auth/callback"],
};

function isInactive(lastSeenAt: string | null | undefined) {
  if (!lastSeenAt) return false;
  const timestamp = new Date(lastSeenAt).getTime();
  if (!Number.isFinite(timestamp)) return false;
  return Date.now() - timestamp > inactivityLimitMs;
}

function expireAuthCookies(request: NextRequest, response: NextResponse) {
  request.cookies.getAll().forEach((cookie) => {
    if (cookie.name.startsWith("sb-") || cookie.name.includes("supabase") || cookie.name === "cc_password_recovery") {
      response.cookies.set(cookie.name, "", {
        path: "/",
        maxAge: 0
      });
    }
  });
}
