import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { normalizeClientSlug, SELECTED_CLIENT_COOKIE } from "@/lib/client-selection";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const slug = normalizeClientSlug(url.searchParams.get("client"));

  if (slug) {
    const cookieStore = await cookies();
    cookieStore.set(SELECTED_CLIENT_COOKIE, slug, {
      httpOnly: true,
      maxAge: 60 * 60 * 24 * 90,
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production"
    });
  }

  redirect("/dashboard");
}
