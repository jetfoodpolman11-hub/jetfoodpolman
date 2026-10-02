import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

/**
 * Next.js 16 Proxy Convention (formerly Middleware)
 * Runs prior to route completion to refresh Supabase auth session and guard protected routes.
 */
export async function proxy(request: NextRequest) {
  // If Supabase environment is not configured (e.g., initial local dev with placeholders),
  // pass through safely without crashing
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder")
  ) {
    return NextResponse.next();
  }

  try {
    const { supabaseResponse, user } = await updateSession(request);
    const path = request.nextUrl.pathname;

    const isAdminRoute = path.startsWith("/admin");
    const isCourierRoute = path.startsWith("/courier");
    const isAdminLoginRoute = path === "/admin/login" || path === "/admin";
    const isLoginRoute = path === "/login";

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

    // If authenticated user visits login page
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
     * - favicon.ico (favicon file)
     * - public assets
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
