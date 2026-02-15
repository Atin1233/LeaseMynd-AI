import { NextResponse } from "next/server";
import { db } from "~/server/db/index";
import { category } from "~/server/db/schema";
import { z } from "zod";
import { validateRequestBody } from "~/lib/validation";
import { getEmployerEmployeeUser } from "~/lib/auth/employer-employee";

const AddCategorySchema = z.object({
    CategoryName: z.string().min(1, "Category name is required").max(256, "Category name is too long"),
});


export async function POST(request: Request) {
    try {
        const validation = await validateRequestBody(request, AddCategorySchema);
        if (!validation.success) {
            return validation.response;
        }

        const userInfo = await getEmployerEmployeeUser();
        if (!userInfo || (userInfo.role !== "employer" && userInfo.role !== "owner")) {
            return NextResponse.json(
                { error: "Invalid user." },
                { status: 400 }
            );
        }

        const companyId = userInfo.companyId;

        const newCategoryId = await db.insert(category).values({
            name: validation.data.CategoryName,
            companyId: companyId,
        }).returning({ id: category.id });

        return NextResponse.json({ success: true, id: newCategoryId[0], name: validation.data.CategoryName });
    } catch (error: unknown) {
        console.error(error);
        return NextResponse.json({ error }, { status: 500 });
    }
}
