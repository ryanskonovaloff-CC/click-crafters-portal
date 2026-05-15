import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = getSafeNextPath(requestUrl.searchParams.get("next"));
  let exchangedSession = false;

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    exchangedSession = !error;
  }

  const response = NextResponse.redirect(new URL(next, requestUrl.origin));

  if (exchangedSession && new URL(next, requestUrl.origin).pathname === "/update-password") {
    response.cookies.set("cc_password_recovery", "1", {
      httpOnly: true,
      sameSite: "lax",
      secure: requestUrl.protocol === "https:",
      maxAge: 60 * 15,
      path: "/update-password"
    });
  }

  return response;
}

function getSafeNextPath(next: string | null) {
  if (!next) {
    return "/dashboard";
  }

  if (!next.startsWith("/") || next.startsWith("//")) {
    return "/dashboard";
  }

  try {
    const parsed = new URL(next, "https://portal.clickcrafters.click");
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return "/dashboard";
  }
}
