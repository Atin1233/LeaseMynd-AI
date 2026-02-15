import { NextResponse } from "next/server";
import { db } from "../../../server/db/index";
import { document } from "../../../server/db/schema";
import { eq } from "drizzle-orm";
import { getEmployerEmployeeUser } from "~/lib/auth/employer-employee";

export async function POST(_request: Request) {
    try {
        const userInfo = await getEmployerEmployeeUser();
        if (!userInfo) {
            return NextResponse.json(
                { error: "Invalid user." },
                { status: 400 }
            );
        }

        const companyId = userInfo.companyId;

        const docs = await db
            .select()
            .from(document)
            .where(eq(document.companyId, companyId));

        // Convert BigInt fields to numbers for JSON serialization
        const serializedDocs = docs.map((doc) => ({
            ...doc,
            id: Number(doc.id),
            companyId: Number(doc.companyId),
        }));

        return NextResponse.json(serializedDocs, { status: 200 });
    } catch (error: unknown) {
        console.error("Error fetching documents:", error);
        return NextResponse.json(
            { error: "Unable to fetch documents" },
            { status: 500 }
        );
    }
}