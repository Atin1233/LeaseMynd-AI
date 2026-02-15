import {db} from "~/server/db";
import {company, users} from "~/server/db/schema";
import {eq} from "drizzle-orm";
import {handleApiError, createSuccessResponse, createValidationError} from "~/lib/api-utils";

type PostBody = {
    supabase_user_id?: string;
    supabaseUserId?: string;
    companyName: string;
    name: string;
    email: string;
    employerPasskey: string;
    employeePasskey: string;
    numberOfEmployees: string;
};

export async function POST(request: Request) {
    try {
        const body = (await request.json()) as PostBody;
        const { name, email, companyName, employerPasskey, employeePasskey, numberOfEmployees } = body;
        const userId = body.supabase_user_id ?? body.supabaseUserId;
        if (!userId) {
            return createValidationError(
                "supabase_user_id is required."
            );
        }

        // Check if company already exists
        const [existingCompany] = await db
            .select()
            .from(company)
            .where(eq(company.name, companyName));

        if (existingCompany) {
            return createValidationError(
                "Company already exists. Please use a different company name."
            );
        }


        const [newCompany] = await db
            .insert(company)
            .values({
                name: companyName,
                employerpasskey: employerPasskey,  // MUST match the property name in createTable
                employeepasskey: employeePasskey,  // Ditto
                numberOfEmployees: numberOfEmployees || "0",
            })
            .returning({ id: company.id });

        if(!newCompany) {
            return createValidationError(
                "Could not create company. Please try again later."
            );
        }

        const companyId = BigInt(newCompany.id);


        await db.insert(users).values({
            userId,
            supabaseUserId: userId,
            companyId,
            name,
            email,
            status: "verified",
            role: "owner",
        });

        return createSuccessResponse(
            { userId, role: "owner" },
            "Company and owner account created successfully."
        );
    }
    catch (error: unknown) {
        console.error("Error during employer company signup:", error);
        return handleApiError(error);
    }
}
