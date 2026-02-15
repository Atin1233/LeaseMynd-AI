import { db } from "../../../server/db/index";
import { users } from "../../../server/db/schema";
import { eq } from "drizzle-orm";
import { getEmployerEmployeeUser } from "~/lib/auth/employer-employee";
import {
    handleApiError,
    createSuccessResponse,
    createUnauthorizedError,
    createForbiddenError,
    createNotFoundError,
    createValidationError
} from "~/lib/api-utils";

type PostBody = {
    employeeId: string;
}

export async function POST(request: Request) {
    try {
        const userInfo = await getEmployerEmployeeUser();
        if (!userInfo) {
            return createUnauthorizedError("Authentication required. Please sign in to continue.");
        }

        if (userInfo.role !== "employer" && userInfo.role !== "owner") {
            return createForbiddenError("Insufficient permissions. Only employers and owners can remove employees.");
        }

        const { employeeId } = (await request.json()) as PostBody;

        if (!employeeId) {
            return createValidationError("Employee ID is required.");
        }

        await db.delete(users).where(eq(users.id, Number(employeeId)));

        return createSuccessResponse(
            { employeeId },
            "Employee removed successfully"
        );
    } catch (error: unknown) {
        console.error("Error removing employee:", error);
        return handleApiError(error);
    }
}

