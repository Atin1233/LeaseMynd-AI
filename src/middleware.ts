import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "~/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  try {
    return await updateSession(request);
  } catch (error) {
    console.error("Middleware error:", error);
    
    // Check if it's an environment variable issue
    if (
      !process.env.NEXT_PUBLIC_SUPABASE_URL ||
      !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ) {
      console.error(
        "Missing Supabase environment variables. Please check your .env file."
      );
      // Allow the request to continue but log the error
      // The app will show errors when trying to use Supabase
      return NextResponse.next();
    }
    
    // For other errors, log and continue
    console.error("Unexpected middleware error:", error);
    return NextResponse.next();
  }
}

export const config = {
    matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api routes that don't need auth
     * Feel free to modify this pattern to include more paths.
     */
    "/((?!_next/static|_next/image|favicon.ico|api/auth|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
    ],
};
