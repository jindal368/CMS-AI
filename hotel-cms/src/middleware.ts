import { NextRequest, NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
  const hostname = request.headers.get("host")?.split(":")[0] || "";
  const pathname = request.nextUrl.pathname;

  // Skip localhost and loopback
  if (hostname === "localhost" || hostname === "127.0.0.1") {
    return NextResponse.next();
  }

  // Skip internal paths and static assets
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/site") ||
    pathname.startsWith("/preview") ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/register") ||
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/hotels") ||
    pathname.startsWith("/brand") ||
    pathname.startsWith("/team") ||
    pathname.startsWith("/campaigns") ||
    pathname.startsWith("/components") ||
    pathname.startsWith("/docs") ||
    pathname.startsWith("/guide") ||
    pathname.startsWith("/sitemap") ||
    pathname.startsWith("/robots") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Custom domain detected — resolve org slug via internal API
  try {
    const lookupUrl = new URL(`/api/domain-lookup?host=${hostname}`, request.url);
    const res = await fetch(lookupUrl);
    if (!res.ok) return NextResponse.next();

    const { orgSlug } = (await res.json()) as { orgSlug: string };

    // Rewrite to the public site route: /site/[orgSlug]/[...path]
    const url = request.nextUrl.clone();
    url.pathname = `/site/${orgSlug}${pathname}`;
    return NextResponse.rewrite(url);
  } catch {
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|api|docs|guide|site|preview|login|register|dashboard|hotels|components|team|campaigns|brand|sitemap|robots|.*\\..*).*)",
  ],
};
