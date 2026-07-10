import { NextResponse } from "next/server";
import { getActiveClient, getSessionProfile } from "@/lib/data";

const ACTIVE_CLIENT_COOKIE = "cc_active_client_id";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const clientKey = requestUrl.searchParams.get("client");
  const next = getSafeNextPath(requestUrl.searchParams.get("next"));
  const { profile } = await getSessionProfile();

  if (profile.role !== "admin") {
    return NextResponse.redirect(new URL("/dashboard", requestUrl.origin));
  }

  const { clients } = await getActiveClient();
  const selectedClient = clients.find((client) => client.id === clientKey || client.slug === clientKey);
  const response = NextResponse.redirect(new URL(next, requestUrl.origin));

  if (selectedClient) {
    response.cookies.set(ACTIVE_CLIENT_COOKIE, selectedClient.id, {
      httpOnly: true,
      sameSite: "lax",
      secure: requestUrl.protocol === "https:",
      path: "/",
      maxAge: 60 * 60 * 24 * 365
    });
  }

  return response;
}

function getSafeNextPath(next: string | null) {
  if (!next || !next.startsWith("/") || next.startsWith("//")) {
    return "/dashboard";
  }

  return next;
}
