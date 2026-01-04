/**
 * Study Agent Me API
 * Role: aggregated fetch of session, profile, preferences, goals, notes, pomodoro, messages.
 * Purpose: return the current user's study-agent state in one call.
 */

import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { and, asc, eq } from "drizzle-orm";

import { db } from "~/server/db";
import {
    studyAgentGoals,
    studyAgentMessages,
    studyAgentNotes,
    studyAgentPomodoroSettings,
    studyAgentPreferences,
    studyAgentProfile,
} from "~/server/db/schema";
import { resolveSessionForUser } from "~/server/study-agent/session";
import { parseSessionId, serializeBigInt } from "../shared";

export async function GET(request: Request) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const session = await resolveSessionForUser(userId, parseSessionId(request));

        if (!session) {
            // No session yet - user hasn't completed onboarding
            return NextResponse.json({
                session: null,
                profile: null,
                preferences: null,
                goals: [],
                notes: [],
                pomodoroSettings: null,
                messages: [],
            });
        }

        const sessionIdBigInt = BigInt(session.id || 0);

        const [profile] = await db
            .select()
            .from(studyAgentProfile)
            .where(
                and(
                    eq(studyAgentProfile.userId, userId),
                    eq(studyAgentProfile.sessionId, sessionIdBigInt)
                )
            );

        const [preferences] = await db
            .select()
            .from(studyAgentPreferences)
            .where(eq(studyAgentPreferences.sessionId, sessionIdBigInt));

        const goals = await db
            .select()
            .from(studyAgentGoals)
            .where(eq(studyAgentGoals.sessionId, sessionIdBigInt));

        const notes = await db
            .select()
            .from(studyAgentNotes)
            .where(eq(studyAgentNotes.sessionId, sessionIdBigInt));

        const [pomodoroSettings] = await db
            .select()
            .from(studyAgentPomodoroSettings)
            .where(eq(studyAgentPomodoroSettings.sessionId, sessionIdBigInt));

        const messages = await db
            .select()
            .from(studyAgentMessages)
            .where(eq(studyAgentMessages.sessionId, sessionIdBigInt))
            .orderBy(asc(studyAgentMessages.createdAt));

        return NextResponse.json({
            session: serializeBigInt(session),
            profile: serializeBigInt(profile) ?? null,
            preferences: preferences?.preferences ?? null,
            goals: goals.map((goal) => serializeBigInt({ ...goal, id: goal.id.toString() })),
            notes: notes.map((note) => serializeBigInt({ ...note, id: note.id.toString() })),
            pomodoroSettings: serializeBigInt(pomodoroSettings) ?? null,
            messages: messages.map((msg) => serializeBigInt({ ...msg, id: msg.id.toString() })),
        });
    } catch (error) {
        console.error("Error loading study agent data", error);
        return NextResponse.json(
            { error: "Failed to load study agent data" },
            { status: 500 }
        );
    }
}