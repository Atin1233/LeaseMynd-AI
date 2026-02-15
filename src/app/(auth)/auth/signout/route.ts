// @ts-nocheck - Supabase type inference issues
import { createClient } from "~/lib/supabase/server";
import { type NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    await supabase.auth.signOut();
  }

  return NextResponse.redirect(new URL("/login", req.url), {
    status: 302,
  });
}

