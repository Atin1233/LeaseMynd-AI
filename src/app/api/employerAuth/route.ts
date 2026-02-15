import { getEmployerEmployeeUser } from "~/lib/auth/employer-employee";
import {
  handleApiError,
  createSuccessResponse,
  createUnauthorizedError,
  createForbiddenError,
} from "~/lib/api-utils";

export async function GET() {
  try {
    const userInfo = await getEmployerEmployeeUser();
    if (!userInfo) {
      return createUnauthorizedError(
        "Authentication required. Please sign in to continue."
      );
    }

    if (userInfo.role === "employee") {
      return createForbiddenError(
        "Employer access required. Your account does not have the necessary permissions."
      );
    }

    if (userInfo.status !== "verified") {
      return createForbiddenError(
        "Account not verified. Please wait for administrator approval."
      );
    }

    return createSuccessResponse(
      {
        role: userInfo.role,
        name: userInfo.name,
        email: userInfo.email,
        userId: userInfo.userId,
      },
      "Authorization successful"
    );
  } catch (error: unknown) {
    console.error("Error during employer authorization check:", error);
    return handleApiError(error);
  }
}
