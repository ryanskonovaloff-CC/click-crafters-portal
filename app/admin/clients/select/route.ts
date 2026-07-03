import { NextResponse } from "next/server";
import { normalizeClientSlug, SELECTED_CLIENT_COOKIE } from "@/lib/client-selection";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const slug = normalizeClientSlug(url.searchParams.get("client"));
  const redirectUrl = new URL("/dashboard", url.origin);
  const response = NextResponse.redirect(redirectUrl);

  if (slug) {
    response.cookies.set(SELECTED_CLIENT_COOKIE, slug, {
      httpOnly: true,
      maxAge: 60 * 60 * 24 * 90,
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production"
    });
  }

  return response;
}
