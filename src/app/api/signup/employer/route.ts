import { db } from "~/server/db/index";
import { users, company } from "~/server/db/schema";
import { and, eq } from "drizzle-orm";
import { handleApiError, createSuccessResponse, createValidationError } from "~/lib/api-utils";

type PostBody = {
    supabase_user_id?: string;
    supabaseUserId?: string;
    name: string;
    email: string;
    employerPasskey: string;
    companyName: string;
};

export async function POST(request: Request) {
    try {
        const body = (await request.json()) as PostBody;
        const { name, email, employerPasskey, companyName } = body;
        const userId = body.supabase_user_id ?? body.supabaseUserId;
        if (!userId) {
            return createValidationError(
                "supabase_user_id is required."
            );
        }

        let companyId: bigint;
        const [existingCompany] = await db
            .select()
            .from(company)
            .where(
                and(
                    eq(company.name, companyName),
                    eq(company.employerpasskey, employerPasskey)
                )
            );

        if (!existingCompany) {
            return createValidationError(
                "Invalid company name or passkey. Please check your credentials and try again."
            );
        }

        companyId = BigInt(existingCompany.id);

        await db.insert(users).values({
            userId,
            supabaseUserId: userId,
            name,
            email,
            companyId,
            status: "pending",
            role: "employer",
        });

        return createSuccessResponse(
            { userId, role: "employer" },
            "Employer account created successfully. Awaiting approval."
        );
    } catch (error: unknown) {
        console.error("Error during employer signup:", error);
        return handleApiError(error);
    }
}