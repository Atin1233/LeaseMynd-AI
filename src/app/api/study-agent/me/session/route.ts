import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

import { db } from "~/server/db";
import { studyAgentSessions } from "~/server/db/schema";
import { serializeBigInt } from "../../shared";

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null;
  }
  
  export async function POST(request: Request) {
    try {
      const { userId } = await auth();
      if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
  
      const body: unknown = await request.json().catch(() => ({} as unknown));
  
      const rawName = isRecord(body) ? body.name : undefined;
      const name =
        typeof rawName === "string" && rawName.trim().length > 0
          ? rawName.trim()
          : undefined;
  
      const [session] = await db
        .insert(studyAgentSessions)
        .values({ userId, name })
        .returning();
  
      return NextResponse.json({ session: serializeBigInt(session) });
    } catch (error) {
      console.error("Error creating study agent session", error);
      return NextResponse.json({ error: "Failed to create session" }, { status: 500 });
    }
  }