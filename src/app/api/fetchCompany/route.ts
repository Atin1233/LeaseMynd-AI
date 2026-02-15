import { NextResponse } from "next/server";
import { db } from "../../../server/db/index";
import { company } from "../../../server/db/schema";
import { eq } from "drizzle-orm";
import { getEmployerEmployeeUser } from "~/lib/auth/employer-employee";

export async function GET() {
    try {
        const userInfo = await getEmployerEmployeeUser();
        if (!userInfo) {
            return NextResponse.json(
                { error: "Invalid user." },
                { status: 400 }
            );
        }

        const companyId = userInfo.companyId;

        const [companyRecord] = await db
            .select()
            .from(company)
            .where(eq(company.id, Number(companyId)));

        if (!companyRecord) {
            return NextResponse.json(
                { error: "Company not found." },
                { status: 404 }
            );
        }

        return NextResponse.json(companyRecord, { status: 200 });
    } catch (error: unknown) {
        console.error("Error fetching documents:", error);
        return NextResponse.json(
            { error: "Unable to fetch documents" },
            { status: 500 }
        );
    }
}