import {
  estimateTokens,
  estimateChars,
  exceedsTokenLimit,
  chunkContent,
  smartTruncate,
  createProcessingContext,
  TokenManager,
} from "~/lib/utils/token-manager";

describe("TokenManager", () => {
  describe("estimateTokens", () => {
    it("estimates tokens from text length", () => {
      expect(estimateTokens("hello")).toBe(2); // 5/4 = 1.25 -> ceil 2
      expect(estimateTokens("a".repeat(100))).toBe(25);
    });

    it("uses custom charsPerToken", () => {
      expect(estimateTokens("hello", 2)).toBe(3);
    });
  });

  describe("estimateChars", () => {
    it("converts tokens to character count", () => {
      expect(estimateChars(100)).toBe(400);
    });
  });

  describe("exceedsTokenLimit", () => {
    it("returns true when content exceeds limit", () => {
      expect(exceedsTokenLimit("a".repeat(1000), 100)).toBe(true);
    });

    it("returns false when content is within limit", () => {
      expect(exceedsTokenLimit("hello", 100)).toBe(false);
    });
  });

  describe("chunkContent", () => {
    it("returns single chunk when content fits", () => {
      const result = chunkContent("Short content", { maxInputTokens: 1000 });
      expect(result.totalChunks).toBe(1);
      expect(result.wasChunked).toBe(false);
      expect(result.chunks[0]!.content).toBe("Short content");
    });

    it("chunks long content at natural break points", () => {
      const longContent = "Introduction.\n\nArticle 1\nSection 1.1\nContent here.\n\nArticle 2\nMore content.";
      const result = chunkContent(longContent, {
        maxInputTokens: 5,
        chunkOverlap: 1,
      });
      expect(result.totalChunks).toBeGreaterThanOrEqual(1);
    });
  });

  describe("smartTruncate", () => {
    it("returns content as-is when under limit", () => {
      const content = "Short";
      const result = smartTruncate(content, 100);
      expect(result.truncated).toBe(content);
      expect(result.wasTruncated).toBe(false);
    });

    it("truncates while preserving end when over limit", () => {
      const content = "A".repeat(5000) + "IMPORTANT_END";
      const result = smartTruncate(content, 100, 50);
      expect(result.wasTruncated).toBe(true);
      expect(result.truncated).toContain("IMPORTANT_END");
    });
  });

  describe("createProcessingContext", () => {
    it("returns single strategy when not chunked", () => {
      const chunkResult = chunkContent("Short");
      const ctx = createProcessingContext(chunkResult);
      expect(ctx.needsChunking).toBe(false);
      expect(ctx.strategy).toBe("single");
    });
  });

  describe("TokenManager default export", () => {
    it("exports all utilities", () => {
      expect(TokenManager.estimateTokens).toBeDefined();
      expect(TokenManager.smartTruncate).toBeDefined();
    });
  });
});
