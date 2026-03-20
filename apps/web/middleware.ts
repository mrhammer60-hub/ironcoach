import { NextRequest, NextResponse } from "next/server";

const PUBLIC_PATHS = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/accept-invite",
  "/pricing",
  "/features",
  "/billing",
];

const MAIN_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "ironcoach.com";

export function middleware(req: NextRequest) {
  const hostname = req.headers.get("host") ?? "";
  const pathname = req.nextUrl.pathname;

  // Allow static files
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // ── 1. Extract subdomain ──────────────────────────────
  const isMainDomain =
    hostname === MAIN_DOMAIN ||
    hostname === `www.${MAIN_DOMAIN}` ||
    hostname.startsWith("localhost");

  const subdomain = isMainDomain
    ? null
    : hostname.replace(`.${MAIN_DOMAIN}`, "").replace(/:.*/, "");

  // ── 2. Subdomain → Branded Space ─────────────────────
  if (subdomain) {
    const url = req.nextUrl.clone();
    url.pathname = `/branded/${subdomain}${pathname}`;
    return NextResponse.rewrite(url);
  }

  // ── 3. Main domain: public paths ─────────────────────
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Marketing pages (root `/` is marketing landing)
  if (pathname === "/") {
    return NextResponse.next();
  }

  // ── 4. Auth-protected routes ─────────────────────────
  const token = req.cookies.get("ironcoach_access")?.value;

  if (!token) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  try {
    const payload = JSON.parse(
      Buffer.from(token.split(".")[1], "base64").toString(),
    );
    const role = payload.role as string;

    // Role-based redirect at root dashboard paths
    if (pathname === "/dashboard") {
      if (role === "ADMIN")
        return NextResponse.redirect(new URL("/admin/dashboard", req.url));
      if (role === "TRAINEE")
        return NextResponse.redirect(new URL("/trainee/today", req.url));
      return NextResponse.redirect(new URL("/coach/dashboard", req.url));
    }

    // Guard route groups
    if (pathname.startsWith("/coach") && role === "TRAINEE") {
      return NextResponse.redirect(new URL("/trainee/today", req.url));
    }
    if (
      pathname.startsWith("/trainee") &&
      role !== "TRAINEE"
    ) {
      return NextResponse.redirect(new URL("/coach/dashboard", req.url));
    }
    if (pathname.startsWith("/admin") && role !== "ADMIN") {
      return NextResponse.redirect(new URL("/coach/dashboard", req.url));
    }
  } catch {
    const response = NextResponse.redirect(new URL("/login", req.url));
    response.cookies.delete("ironcoach_access");
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
