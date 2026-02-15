import { NextResponse } from "next/server";

/**
 * Repair guide search API.
 * Disabled: implement with Google AI if needed.
 */
export async function POST() {
  return NextResponse.json(
    { error: "Repair guide search is not implemented." },
    { status: 501 }
  );
}
