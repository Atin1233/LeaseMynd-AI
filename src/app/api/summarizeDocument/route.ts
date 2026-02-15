import { NextResponse } from "next/server";

/**
 * Summarize document API.
 * Disabled: implement with Google AI if needed.
 */
export async function POST() {
  return NextResponse.json(
    { error: "Summarize document is not implemented." },
    { status: 501 }
  );
}
