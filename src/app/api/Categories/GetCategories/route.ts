import { NextResponse } from "next/server";
import { db } from "../../../../server/db";
import { category } from "../../../../server/db/schema";
import { eq } from "drizzle-orm";
import { getEmployerEmployeeUser } from "~/lib/auth/employer-employee";

export async function GET(_request: Request) {
    try {
        const userInfo = await getEmployerEmployeeUser();
        if (!userInfo) {
            return NextResponse.json(
                { error: "Invalid user." },
                { status: 400 }
            );
        }

        if (!userInfo) {
            return NextResponse.json(
                { error: "Invalid user." },
                { status: 400 }
            );
        } else if (userInfo.role !== "employer" && userInfo.role !== "owner") {
            return NextResponse.json(
                { error: "Invalid user role." },
                { status: 400 }
            );
        }

        const companyId = userInfo.companyId;

        const categories = await db
            .select()
            .from(category)
            .where(eq(category.companyId, companyId));
            
        // Convert BigInt fields to numbers for JSON serialization
        const serializedCategories = categories.map((category) => ({
            ...category,
            id: Number(category.id),
            companyId: Number(category.companyId),
        }));

        return NextResponse.json(serializedCategories, { status: 200 });
    } catch (error: unknown) {
        console.error("Error fetching documents:", error);
        return NextResponse.json(
            { error: "Unable to fetch documents" },
            { status: 500 }
        );
    }
}