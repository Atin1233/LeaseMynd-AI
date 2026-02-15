/**
 * Shared PDF processing utilities
 * Used by upload-lease and uploadDocument to avoid duplicate logic.
 */

import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import type { Document } from "langchain/document";

export interface PDFChunkOptions {
  chunkSize?: number;
  chunkOverlap?: number;
}

const DEFAULT_CHUNK_SIZE = 1000;
const DEFAULT_CHUNK_OVERLAP = 200;

/**
 * Load and parse a PDF from a local file path.
 * Returns LangChain documents with page metadata (loc.pageNumber).
 */
export async function loadPdfFromPath(filePath: string): Promise<Document[]> {
  const loader = new PDFLoader(filePath);
  const docs = await loader.load();
  return docs;
}

/**
 * Split documents into chunks using a recursive text splitter.
 * Same config used by both lease and document upload flows.
 */
export async function splitPdfIntoChunks(
  documents: Document[],
  options: PDFChunkOptions = {}
): Promise<Document[]> {
  const chunkSize = options.chunkSize ?? DEFAULT_CHUNK_SIZE;
  const chunkOverlap = options.chunkOverlap ?? DEFAULT_CHUNK_OVERLAP;

  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize,
    chunkOverlap,
  });

  return splitter.splitDocuments(documents);
}

/**
 * Sanitize chunk content (remove null bytes, ensure non-empty).
 */
export function sanitizeChunkContent(raw: string): string {
  return raw.replace(/\0/g, "").trim() || " ";
}
