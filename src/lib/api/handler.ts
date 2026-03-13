/**
 * API route handler wrapper
 * Wraps route handlers with consistent error handling via api-utils.
 */

import type { NextRequest } from "next/server";
import { handleApiError } from "~/lib/api-utils";

export type ApiHandler = (
  request: NextRequest,
  context?: { params?: Promise<Record<string, string>> }
) => Promise<Response>;

/**
 * Wrap an API route handler with try/catch and standardized error responses.
 * Use for GET/POST/etc. route handlers that should return api-utils–style errors.
 *
 * @example
 *   export const GET = withApiHandler(async (req) => {
 *     // ...
 *     return NextResponse.json({ data });
 *   });
 */
export function withApiHandler(handler: ApiHandler): ApiHandler {
  return async (request, context) => {
    try {
      return await handler(request, context);
    } catch (error) {
      return handleApiError(error);
    }
  };
}
