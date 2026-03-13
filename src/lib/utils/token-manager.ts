/**
 * Token Management Utility
 * 
 * Handles intelligent content chunking and token estimation for AI processing.
 * Designed to handle long lease documents that exceed model context limits.
 */

export interface TokenManagerConfig {
  /** Maximum tokens for input content (default: 25000 chars ≈ 6250 tokens) */
  maxInputTokens: number;
  /** Maximum tokens for output (default: 8192) */
  maxOutputTokens: number;
  /** Overlap between chunks for context continuity (default: 500 chars) */
  chunkOverlap: number;
  /** Estimated chars per token (default: 4) */
  charsPerToken: number;
}

export interface ContentChunk {
  /** Chunk index (0-based) */
  index: number;
  /** Chunk content */
  content: string;
  /** Start position in original content */
  startPos: number;
  /** End position in original content */
  endPos: number;
  /** Estimated token count */
  estimatedTokens: number;
  /** Whether this is the last chunk */
  isLast: boolean;
}

export interface ChunkingResult {
  /** Array of content chunks */
  chunks: ContentChunk[];
  /** Total chunks created */
  totalChunks: number;
  /** Original content length */
  originalLength: number;
  /** Whether content was chunked */
  wasChunked: boolean;
  /** Estimated total tokens in original */
  estimatedTotalTokens: number;
}

export interface MergeStrategy {
  /** How to merge chunk results */
  type: 'concatenate' | 'aggregate' | 'weighted';
  /** Custom merge function for aggregate type */
  mergeFn?: (results: unknown[]) => unknown;
}

const DEFAULT_CONFIG: TokenManagerConfig = {
  maxInputTokens: 6250, // ~25000 chars
  maxOutputTokens: 8192,
  chunkOverlap: 500,
  charsPerToken: 4,
};

/**
 * Estimate token count from text
 */
export function estimateTokens(text: string, charsPerToken = 4): number {
  return Math.ceil(text.length / charsPerToken);
}

/**
 * Estimate character count from tokens
 */
export function estimateChars(tokens: number, charsPerToken = 4): number {
  return tokens * charsPerToken;
}

/**
 * Check if content exceeds token limit
 */
export function exceedsTokenLimit(
  content: string, 
  maxTokens: number, 
  charsPerToken = 4
): boolean {
  return estimateTokens(content, charsPerToken) > maxTokens;
}

/**
 * Find natural break points in text (sentences, paragraphs, sections)
 */
function findNaturalBreakPoint(text: string, targetPos: number, searchRange = 500): number {
  const start = Math.max(0, targetPos - searchRange);
  const end = Math.min(text.length, targetPos + searchRange);
  const searchText = text.substring(start, end);
  
  // Priority 1: Article/Section breaks
  const articleMatch = searchText.match(/\n\s*(ARTICLE|Article|SECTION|Section)\s+[\dIVXLC]+/i);
  if (articleMatch && articleMatch.index !== undefined) {
    return start + articleMatch.index;
  }
  
  // Priority 2: Numbered section breaks (1.1, 2.3, etc.)
  const sectionMatch = searchText.match(/\n\s*\d+\.\d+[.\s]/);
  if (sectionMatch && sectionMatch.index !== undefined) {
    return start + sectionMatch.index;
  }
  
  // Priority 3: Paragraph breaks (double newline)
  const paragraphMatch = searchText.match(/\n\s*\n/);
  if (paragraphMatch && paragraphMatch.index !== undefined) {
    return start + paragraphMatch.index;
  }
  
  // Priority 4: Single newline
  const newlineMatch = searchText.match(/\n/);
  if (newlineMatch && newlineMatch.index !== undefined) {
    return start + newlineMatch.index;
  }
  
  // Priority 5: Sentence end
  const sentenceMatch = searchText.match(/[.!?]\s+/);
  if (sentenceMatch && sentenceMatch.index !== undefined) {
    return start + sentenceMatch.index + 1;
  }
  
  // Fallback: Use target position
  return targetPos;
}

/**
 * Chunk content intelligently at natural break points
 */
export function chunkContent(
  content: string, 
  config: Partial<TokenManagerConfig> = {}
): ChunkingResult {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  const maxCharsPerChunk = cfg.maxInputTokens * cfg.charsPerToken;
  
  // If content fits in one chunk, return as-is
  if (content.length <= maxCharsPerChunk) {
    return {
      chunks: [{
        index: 0,
        content,
        startPos: 0,
        endPos: content.length,
        estimatedTokens: estimateTokens(content, cfg.charsPerToken),
        isLast: true,
      }],
      totalChunks: 1,
      originalLength: content.length,
      wasChunked: false,
      estimatedTotalTokens: estimateTokens(content, cfg.charsPerToken),
    };
  }
  
  const chunks: ContentChunk[] = [];
  let currentPos = 0;
  let chunkIndex = 0;
  
  while (currentPos < content.length) {
    // Calculate end position for this chunk
    let endPos = Math.min(currentPos + maxCharsPerChunk, content.length);
    
    // If not at the end, find a natural break point
    if (endPos < content.length) {
      endPos = findNaturalBreakPoint(content, endPos);
    }
    
    // Extract chunk content
    const chunkContent = content.substring(currentPos, endPos);
    
    // Add context header for non-first chunks
    let finalContent = chunkContent;
    if (chunkIndex > 0) {
      finalContent = `[Continuing from previous section...]\n\n${chunkContent}`;
    }
    
    chunks.push({
      index: chunkIndex,
      content: finalContent,
      startPos: currentPos,
      endPos,
      estimatedTokens: estimateTokens(finalContent, cfg.charsPerToken),
      isLast: endPos >= content.length,
    });
    
    // Move to next position with overlap
    currentPos = endPos - cfg.chunkOverlap;
    const lastChunk = chunks[chunks.length - 1];
    if (lastChunk && currentPos <= lastChunk.startPos) {
      currentPos = endPos; // Prevent infinite loop
    }
    chunkIndex++;
    
    // Safety limit
    if (chunkIndex > 50) {
      console.warn('[TokenManager] Hit chunk limit (50), stopping');
      break;
    }
  }
  
  // Mark last chunk
  if (chunks.length > 0) {
    chunks[chunks.length - 1]!.isLast = true;
  }
  
  return {
    chunks,
    totalChunks: chunks.length,
    originalLength: content.length,
    wasChunked: chunks.length > 1,
    estimatedTotalTokens: estimateTokens(content, cfg.charsPerToken),
  };
}

/**
 * Smart truncation that preserves important content
 * Prioritizes: beginning (parties, premises) + end (signatures, dates)
 */
export function smartTruncate(
  content: string, 
  maxChars: number,
  preserveEnd = 2000
): { truncated: string; wasTruncated: boolean; originalLength: number } {
  if (content.length <= maxChars) {
    return { truncated: content, wasTruncated: false, originalLength: content.length };
  }
  
  const startLength = maxChars - preserveEnd - 100; // 100 chars for truncation marker
  const start = content.substring(0, startLength);
  const end = content.substring(content.length - preserveEnd);
  
  const truncationMarker = `\n\n[... ${content.length - startLength - preserveEnd} characters omitted for brevity ...]\n\n`;
  
  return {
    truncated: start + truncationMarker + end,
    wasTruncated: true,
    originalLength: content.length,
  };
}

/**
 * Extract key sections from a lease document
 * Returns important sections that should always be included
 */
export function extractKeySections(content: string): {
  parties: string;
  premises: string;
  term: string;
  rent: string;
  other: string;
} {
  const sections = {
    parties: '',
    premises: '',
    term: '',
    rent: '',
    other: '',
  };
  
  // Extract parties section (usually in first 2000 chars)
  const partiesMatch = content.substring(0, 3000).match(
    /(landlord|lessor|owner).*?(tenant|lessee|renter)/is
  );
  if (partiesMatch) {
    sections.parties = partiesMatch[0].substring(0, 500);
  }
  
  // Extract premises/property section
  const premisesPatterns = [
    /(?:premises|property|space).*?(?:located|situated|at|address).*?(?:\n|$)/is,
    /(?:article|section)\s*\d*\s*-?\s*(?:premises|property)/is,
  ];
  for (const pattern of premisesPatterns) {
    const match = content.match(pattern);
    if (match) {
      sections.premises = match[0].substring(0, 500);
      break;
    }
  }
  
  // Extract term section
  const termPatterns = [
    /(?:term|commencement).*?(?:year|month|expir)/is,
    /(?:article|section)\s*\d*\s*-?\s*term/is,
  ];
  for (const pattern of termPatterns) {
    const match = content.match(pattern);
    if (match) {
      sections.term = match[0].substring(0, 500);
      break;
    }
  }
  
  // Extract rent section
  const rentPatterns = [
    /(?:base|monthly|annual)\s*rent.*?\$[\d,]+/is,
    /(?:article|section)\s*\d*\s*-?\s*rent/is,
  ];
  for (const pattern of rentPatterns) {
    const match = content.match(pattern);
    if (match) {
      sections.rent = match[0].substring(0, 500);
      break;
    }
  }
  
  return sections;
}

/**
 * Create a condensed summary of a lease for context
 */
export function createCondensedContext(
  content: string, 
  maxChars = 5000
): string {
  const keySections = extractKeySections(content);
  
  const parts: string[] = [
    '=== KEY LEASE TERMS ===',
  ];
  
  if (keySections.parties) {
    parts.push(`\nPARTIES:\n${keySections.parties}`);
  }
  if (keySections.premises) {
    parts.push(`\nPREMISES:\n${keySections.premises}`);
  }
  if (keySections.term) {
    parts.push(`\nTERM:\n${keySections.term}`);
  }
  if (keySections.rent) {
    parts.push(`\nRENT:\n${keySections.rent}`);
  }
  
  const summary = parts.join('\n');
  
  if (summary.length > maxChars) {
    return summary.substring(0, maxChars) + '\n[...truncated...]';
  }
  
  return summary;
}

/**
 * Merge results from chunked analysis
 */
export function mergeChunkResults<T>(
  results: T[],
  strategy: MergeStrategy = { type: 'aggregate' }
): T | T[] {
  if (results.length === 0) {
    throw new Error('No results to merge');
  }
  
  if (results.length === 1) {
    return results[0]!;
  }
  
  switch (strategy.type) {
    case 'concatenate':
      // For string results, concatenate them
      if (typeof results[0] === 'string') {
        return results.join('\n\n') as unknown as T;
      }
      return results;
      
    case 'aggregate':
      // For object results, merge arrays and take best values
      if (typeof results[0] === 'object' && results[0] !== null) {
        return aggregateObjectResults(results as Record<string, unknown>[]) as T;
      }
      return results;
      
    case 'weighted':
      // Use custom merge function if provided
      if (strategy.mergeFn) {
        return strategy.mergeFn(results) as T;
      }
      return results;
      
    default:
      return results;
  }
}

/**
 * Aggregate object results from multiple chunks
 */
function aggregateObjectResults(
  results: Record<string, unknown>[]
): Record<string, unknown> {
  const merged: Record<string, unknown> = {};
  
  for (const result of results) {
    for (const [key, value] of Object.entries(result)) {
      if (!(key in merged)) {
        merged[key] = value;
      } else if (Array.isArray(value) && Array.isArray(merged[key])) {
        // Merge arrays, deduplicate by title if objects have title field
        const existingArray = merged[key] as unknown[];
        const existingTitles = new Set(
          existingArray
            .filter((item): item is Record<string, unknown> => 
              typeof item === 'object' && item !== null && 'title' in item
            )
            .map(item => item.title)
        );
        
        for (const item of value) {
          if (
            typeof item === 'object' && 
            item !== null && 
            'title' in item &&
            existingTitles.has((item as Record<string, unknown>).title)
          ) {
            continue; // Skip duplicate
          }
          existingArray.push(item);
        }
      } else if (typeof value === 'number' && typeof merged[key] === 'number') {
        // For scores, take the minimum (most conservative)
        if (key.includes('score') || key.includes('Score')) {
          merged[key] = Math.min(value, merged[key] as number);
        } else {
          // For counts, take the maximum
          merged[key] = Math.max(value, merged[key] as number);
        }
      }
      // For other types, keep the first value (already set)
    }
  }
  
  return merged;
}

/**
 * Create processing context for multi-chunk analysis
 */
export function createProcessingContext(
  chunkResult: ChunkingResult
): {
  needsChunking: boolean;
  strategy: 'single' | 'sequential' | 'parallel';
  estimatedCalls: number;
  estimatedTime: string;
} {
  if (!chunkResult.wasChunked) {
    return {
      needsChunking: false,
      strategy: 'single',
      estimatedCalls: 1,
      estimatedTime: '30-60 seconds',
    };
  }
  
  const numChunks = chunkResult.totalChunks;
  
  // For 2-3 chunks, process sequentially
  if (numChunks <= 3) {
    return {
      needsChunking: true,
      strategy: 'sequential',
      estimatedCalls: numChunks,
      estimatedTime: `${numChunks * 30}-${numChunks * 60} seconds`,
    };
  }
  
  // For more chunks, could parallelize (but watch rate limits)
  return {
    needsChunking: true,
    strategy: 'parallel',
    estimatedCalls: numChunks,
    estimatedTime: `${Math.ceil(numChunks / 2) * 30}-${Math.ceil(numChunks / 2) * 60} seconds`,
  };
}

export const TokenManager = {
  estimateTokens,
  estimateChars,
  exceedsTokenLimit,
  chunkContent,
  smartTruncate,
  extractKeySections,
  createCondensedContext,
  mergeChunkResults,
  createProcessingContext,
  DEFAULT_CONFIG,
};

export default TokenManager;
