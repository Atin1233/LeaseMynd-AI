import { NextResponse } from "next/server";

/**
 * GET /api/health
 * Diagnostic endpoint to check system health and configuration
 */
export async function GET() {
  const diagnostics: {
    status: "ok" | "error";
    timestamp: string;
    environment: {
      nodeEnv: string;
      hasSupabaseUrl: boolean;
      hasSupabaseAnonKey: boolean;
      hasSupabaseServiceKey: boolean;
      hasGoogleAIKey: boolean;
      hasStripeKey: boolean;
    };
    errors: string[];
    warnings: string[];
  } = {
    status: "ok",
    timestamp: new Date().toISOString(),
    environment: {
      nodeEnv: process.env.NODE_ENV || "unknown",
      hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasSupabaseAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      hasSupabaseServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      hasGoogleAIKey: !!process.env.GOOGLE_AI_API_KEY,
      hasStripeKey: !!process.env.STRIPE_SECRET_KEY,
    },
    errors: [],
    warnings: [],
  };

  // Check required environment variables
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    diagnostics.errors.push("NEXT_PUBLIC_SUPABASE_URL is missing");
    diagnostics.status = "error";
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    diagnostics.errors.push("NEXT_PUBLIC_SUPABASE_ANON_KEY is missing");
    diagnostics.status = "error";
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    diagnostics.errors.push("SUPABASE_SERVICE_ROLE_KEY is missing");
    diagnostics.status = "error";
  }

  if (!process.env.GOOGLE_AI_API_KEY) {
    diagnostics.errors.push("GOOGLE_AI_API_KEY is missing");
    diagnostics.status = "error";
  }

  // Check optional but recommended variables
  if (!process.env.STRIPE_SECRET_KEY) {
    diagnostics.warnings.push("STRIPE_SECRET_KEY is missing (Stripe features will be disabled)");
  }

  // Test Supabase connection if credentials are available
  if (
    diagnostics.environment.hasSupabaseUrl &&
    diagnostics.environment.hasSupabaseAnonKey
  ) {
    try {
      const { createClient } = await import("~/lib/supabase/server");
      const supabase = await createClient();
      const { error } = await supabase.auth.getUser();
      
      if (error && !error.message.includes("JWT")) {
        diagnostics.warnings.push(`Supabase connection issue: ${error.message}`);
      }
    } catch (error) {
      diagnostics.errors.push(
        `Failed to connect to Supabase: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
      diagnostics.status = "error";
    }
  }

  const statusCode = diagnostics.status === "error" ? 500 : 200;

  return NextResponse.json(diagnostics, { status: statusCode });
}
