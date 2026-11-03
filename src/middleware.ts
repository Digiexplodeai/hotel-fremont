import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const pathname = request.nextUrl.pathname;
  const isAdminRoute = pathname.startsWith("/admin");
  const isAdminApi = pathname.startsWith("/api/admin");

  // Allow temporary r2-diagnose route in development without session cookies
  if (pathname === "/api/admin/r2-diagnose" && process.env.NODE_ENV !== "production") {
    return response;
  }

  if (!isAdminRoute && !isAdminApi) {
    return response;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const isLoginPage = pathname === "/admin/login";

  if (!supabaseUrl || !anonKey) {
    if (isAdminApi) {
      return NextResponse.json(
        { error: "Authentication service unconfigured." },
        { status: 503 }
      );
    }
    if (!isLoginPage) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
    return response;
  }

  const supabase = createServerClient(supabaseUrl, anonKey, {
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

  // If user is not authenticated:
  if (!user) {
    if (isAdminApi) {
      return NextResponse.json(
        { error: "Unauthorized: Admin authentication required." },
        { status: 401 }
      );
    }
    if (!isLoginPage) {
      const loginUrl = new URL("/admin/login", request.url);
      if (pathname !== "/admin") {
        loginUrl.searchParams.set("next", pathname);
      }
      return NextResponse.redirect(loginUrl);
    }
    return response;
  }

  // If user is authenticated and hits /admin/login, redirect to /admin
  if (isLoginPage) {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  return response;
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};

