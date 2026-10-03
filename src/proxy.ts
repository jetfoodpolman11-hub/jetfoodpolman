import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { verifyMockSessionSignature } from "@/lib/auth/cookie-signer";

/**
 * Next.js 16 Proxy Convention (formerly Middleware)
 * Runs prior to route completion to refresh Supabase auth session and guard protected routes.
 */
export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const isAdminRoute = path.startsWith("/admin");
  const isCourierRoute = path.startsWith("/courier");
  const isAdminLoginRoute = path === "/admin/login" || path === "/admin";
  const isLoginRoute = path === "/login";

  // Check cryptographically signed mock session cookie first
  const mockRole = request.cookies.get("jf_mock_role")?.value;
  const mockCode = request.cookies.get("jf_mock_code")?.value || "JF-001";
  const mockSig = request.cookies.get("jf_mock_sig")?.value;

  const hasValidSignedMockSession =
    (mockRole === "ADMIN" || mockRole === "KURIR") &&
    verifyMockSessionSignature(
      mockRole,
      mockRole === "KURIR" ? mockCode : "",
      mockSig
    );

  // If valid signed session exists, enforce strict RBAC at the proxy perimeter
  if (hasValidSignedMockSession) {
    if (isAdminRoute && !isAdminLoginRoute && mockRole !== "ADMIN") {
      return NextResponse.redirect(new URL("/courier/dashboard", request.url));
    }
    if (isCourierRoute && mockRole !== "KURIR") {
      return NextResponse.redirect(new URL("/admin/dashboard", request.url));
    }
    return NextResponse.next();
  }

  // If Supabase environment is not configured (placeholder mode) and no valid signed session:
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder")
  ) {
    if (isAdminRoute && !isAdminLoginRoute) {
      const loginUrl = new URL("/admin/login", request.url);
      loginUrl.searchParams.set("redirectTo", path);
      return NextResponse.redirect(loginUrl);
    }
    if (isCourierRoute) {
      const loginUrl = new URL("/", request.url);
      loginUrl.searchParams.set("redirectTo", path);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  try {
    const { supabaseResponse, user } = await updateSession(request);

    // If unauthenticated user accesses protected admin routes (not login itself)
    if (isAdminRoute && !isAdminLoginRoute && !user) {
      const loginUrl = new URL("/admin/login", request.url);
      loginUrl.searchParams.set("redirectTo", path);
      return NextResponse.redirect(loginUrl);
    }

    // If unauthenticated user accesses protected courier routes
    if (isCourierRoute && !user) {
      const loginUrl = new URL("/", request.url);
      loginUrl.searchParams.set("redirectTo", path);
      return NextResponse.redirect(loginUrl);
    }

    // If authenticated user visits legacy login page
    if (isLoginRoute && user) {
      return NextResponse.redirect(new URL("/", request.url));
    }

    return supabaseResponse;
  } catch (error) {
    console.error("Proxy error during session update:", error);
    return NextResponse.next();
  }
}

export default proxy;

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, manifest.json, manifest.webmanifest, sw.js
     * - public assets
     */
    "/((?!_next/static|_next/image|favicon.ico|manifest\\.json|manifest\\.webmanifest|sw\\.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
