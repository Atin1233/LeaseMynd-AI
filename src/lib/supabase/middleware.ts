import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  // Validate environment variables
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    console.error(
      "Missing Supabase environment variables in middleware. Please check your .env file."
    );
    // Return next response without auth check
    return NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({
    request,
  });

  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) =>
              request.cookies.set(name, value)
            );
            supabaseResponse = NextResponse.next({
              request,
            });
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options)
            );
          },
        },
      }
    );

    // Refreshing the auth token
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    // If auth check fails, continue without redirecting
    if (authError) {
      console.error("Auth error in middleware:", authError);
      // Continue to let the app handle the error
      return supabaseResponse;
    }

    // Define protected routes
    const protectedPaths = ["/dashboard", "/upload", "/lease"];
    const isProtectedPath = protectedPaths.some((path) =>
      request.nextUrl.pathname.startsWith(path)
    );

    // Redirect to login if accessing protected routes without auth
    if (isProtectedPath && !user) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("redirect", request.nextUrl.pathname);
      return NextResponse.redirect(url);
    }

    // Check passcode verification for authenticated users accessing protected routes
    if (isProtectedPath && user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("demo_passcode_verified")
        .eq("id", user.id)
        .single();

      // If passcode not verified, redirect to verification page
      if (!profile?.demo_passcode_verified) {
        const url = request.nextUrl.clone();
        url.pathname = "/verify-passcode";
        return NextResponse.redirect(url);
      }
    }

    // Redirect to dashboard if logged in and on auth pages
    const authPaths = ["/login", "/signup"];
    const isAuthPath = authPaths.some((path) =>
      request.nextUrl.pathname.startsWith(path)
    );

    // Check if user is on verify-passcode page and has already verified
    const isVerifyPasscodePath = request.nextUrl.pathname.startsWith("/verify-passcode");

    if (isAuthPath && user) {
      // Check passcode verification before redirecting to dashboard
      const { data: profile } = await supabase
        .from("profiles")
        .select("demo_passcode_verified")
        .eq("id", user.id)
        .single();

      if (profile?.demo_passcode_verified) {
        // User is verified, redirect to dashboard
        const url = request.nextUrl.clone();
        url.pathname = "/dashboard";
        return NextResponse.redirect(url);
      }
      // User not verified, let them stay on auth pages or they'll be redirected later
    }

    // If user is verified and tries to access verify-passcode, redirect to dashboard
    if (isVerifyPasscodePath && user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("demo_passcode_verified")
        .eq("id", user.id)
        .single();

      if (profile?.demo_passcode_verified) {
        const url = request.nextUrl.clone();
        url.pathname = "/dashboard";
        return NextResponse.redirect(url);
      }
    }

    return supabaseResponse;
  } catch (error) {
    console.error("Error in updateSession:", error);
    // Return next response on error to prevent breaking the app
    return NextResponse.next({ request });
  }
}

