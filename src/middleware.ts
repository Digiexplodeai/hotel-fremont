import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const ALLOWED_ADMIN_ROLES = ["owner", "manager", "front_desk", "admin"];

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Only apply admin authentication guard to /admin and /admin/* routes
  // All other pages (/ and public routes) pass straight through with zero overhead
  if (!pathname.startsWith("/admin")) {
    return NextResponse.next();
  }

  const isLoginPage = pathname === "/admin/login";

  // Safely read Supabase environment variables without assuming they exist
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const isConfigured = Boolean(
    supabaseUrl &&
    anonKey &&
    supabaseUrl.startsWith("https://") &&
    !supabaseUrl.includes("your-project")
  );

  // If Supabase is missing or invalid, render a friendly error message instead of redirecting
  if (!isConfigured) {
    if (isLoginPage) {
      // Allow login page to render so it can display its own configuration state/error
      return NextResponse.next();
    }
    return new NextResponse(
      `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Admin Portal - Configuration Required | Hotel Fremont</title>
  <style>
    body { background: #0E0E10; color: #F7F3EC; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; padding: 20px; box-sizing: border-box; }
    .card { background: #151518; border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; padding: 32px; max-width: 480px; text-align: center; box-shadow: 0 20px 50px rgba(0,0,0,0.5); }
    h1 { color: #E02B1D; font-size: 20px; margin: 0 0 12px; }
    p { color: #A8A59E; font-size: 14px; line-height: 1.6; margin: 0 0 20px; }
    a { color: #C9A96E; text-decoration: none; font-size: 13px; }
  </style>
</head>
<body>
  <div class="card">
    <h1>Configuration Required</h1>
    <p>The Supabase authentication service is not configured. Missing or invalid NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables.</p>
    <a href="/">← Return to Homepage</a>
  </div>
</body>
</html>`,
      {
        status: 503,
        headers: { "content-type": "text/html; charset=utf-8" },
      }
    );
  }

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(supabaseUrl!, anonKey!, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options as CookieOptions)
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Helper to construct RELATIVE redirect responses preserving refreshed session cookies
  const createRelativeRedirect = (targetPath: string, searchParams?: Record<string, string>) => {
    const url = request.nextUrl.clone();
    url.pathname = targetPath;
    url.search = "";
    if (searchParams) {
      Object.entries(searchParams).forEach(([k, v]) => url.searchParams.set(k, v));
    }
    const redirectRes = NextResponse.redirect(url);
    response.cookies.getAll().forEach((cookie) => redirectRes.cookies.set(cookie));
    return redirectRes;
  };

  // Determine if the user is authenticated and authorized as an admin
  const metaRole = (user?.app_metadata?.role as string) || (user?.user_metadata?.role as string);
  const emailLower = user?.email?.toLowerCase() || "";
  const isAuthenticatedAdmin = Boolean(
    user && (
      (metaRole && ALLOWED_ADMIN_ROLES.includes(metaRole.toLowerCase())) ||
      emailLower === "hotelfremont1@gmail.com" ||
      emailLower === "admin@hotelfremont.in" ||
      emailLower === "owner@hotelfremont.in" ||
      emailLower === "sagarkiisha3@gmail.com" ||
      emailLower.endsWith("@hotelfremont.in")
    )
  );

  // Case 1: Unauthenticated or non-admin user
  if (!isAuthenticatedAdmin) {
    // /admin/login must NEVER redirect an unauthenticated user
    if (isLoginPage) {
      return response;
    }

    // unauthenticated user on /admin or /admin/* (except /admin/login) -> redirect ONCE to /admin/login
    if (pathname !== "/admin" && pathname !== "/admin/") {
      return createRelativeRedirect("/admin/login", { next: pathname });
    }
    return createRelativeRedirect("/admin/login");
  }

  // Case 2: Authenticated admin user
  if (isLoginPage) {
    // authenticated user on /admin/login -> redirect ONCE to /admin
    return createRelativeRedirect("/admin");
  }

  // Authenticated admin user on /admin or /admin/* -> proceed
  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api (API routes)
     * - static public files (.svg, .png, .jpg, .jpeg, .gif, .webp, .ico, .css, .js)
     */
    "/((?!_next/static|_next/image|favicon.ico|api|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)$).*)",
  ],
};
