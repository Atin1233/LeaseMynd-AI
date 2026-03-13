import {
  classifyError,
  ErrorType,
  sleep,
  createErrorResponse,
} from "~/lib/utils/error-handler";

describe("ErrorHandler", () => {
  describe("classifyError", () => {
    it("classifies rate limit errors", () => {
      const result = classifyError(new Error("429 Too Many Requests"));
      expect(result.type).toBe(ErrorType.RATE_LIMIT);
      expect(result.retryable).toBe(true);
      expect(result.retryDelay).toBe(60000);
    });

    it("classifies authentication errors", () => {
      const result = classifyError(new Error("401 Unauthorized"));
      expect(result.type).toBe(ErrorType.AUTH);
      expect(result.retryable).toBe(false);
    });

    it("classifies network errors", () => {
      const result = classifyError(new Error("Connection timeout"));
      expect(result.type).toBe(ErrorType.NETWORK);
      expect(result.retryable).toBe(true);
    });

    it("classifies parse errors", () => {
      const result = classifyError(new Error("Invalid JSON syntax"));
      expect(result.type).toBe(ErrorType.PARSE);
      expect(result.retryable).toBe(true);
    });

    it("classifies unknown errors", () => {
      const result = classifyError(new Error("Something weird happened"));
      expect(result.type).toBe(ErrorType.UNKNOWN);
    });

    it("handles non-Error input", () => {
      const result = classifyError("string error");
      expect(result.original).toBeInstanceOf(Error);
    });
  });

  describe("sleep", () => {
    it("resolves after delay", async () => {
      const start = Date.now();
      await sleep(50);
      const elapsed = Date.now() - start;
      expect(elapsed).toBeGreaterThanOrEqual(45);
    });
  });

  describe("createErrorResponse", () => {
    it("returns standardized response structure", () => {
      const error = new Error("Test error");
      const response = createErrorResponse(error);
      expect(response).toHaveProperty("error");
      expect(response).toHaveProperty("code");
      expect(response).toHaveProperty("status");
      expect(response.status).toBeGreaterThanOrEqual(400);
    });
  });
});
