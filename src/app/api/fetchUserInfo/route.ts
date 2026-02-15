import { NextResponse } from "next/server";
import { db } from "../../../server/db/index";
import { company } from "../../../server/db/schema";
import { and, eq } from "drizzle-orm";
import { getEmployerEmployeeUser } from "~/lib/auth/employer-employee";

export async function POST() {
    try {
        const userInfo = await getEmployerEmployeeUser();
        if (!userInfo) {
            return NextResponse.json({ error: "Invalid user." }, { status: 400 });
        }

        const companyId = userInfo.companyId;

        const [companyRecord] = await db
            .select()
            .from(company)
            .where(and(eq(company.id, Number(companyId))));

        if (!companyRecord) {
            return NextResponse.json(
                { error: "Company not found" },
                { status: 404 }
            );
        }

        const submissionDate = new Date(userInfo.createdAt).toLocaleString("en-US", {
            dateStyle: "medium",
            timeStyle: "short",
        });

        const serializedUserInfo = {
            ...userInfo,
            companyId: Number(userInfo.companyId),
        };

        return NextResponse.json(
            {
                ...serializedUserInfo,
                company: companyRecord.name,
                submissionDate: submissionDate,
            },
            { status: 200 }
        );
    } catch (error: unknown) {
        console.error("Error fetching user and company info:", error);
        return NextResponse.json(
            { error: "Unable to fetch user and company info" },
            { status: 500 }
        );
    }
}
