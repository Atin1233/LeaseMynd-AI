/**
 * AIAssistant Services - Re-exports from centralized RAG module
 * 
 * This file maintains backward compatibility while using the centralized RAG module.
 * New code should import directly from "~/server/rag" instead.
 */

// Re-export from centralized RAG module
export {
  companyEnsembleSearch,
  createCompanyEnsembleRetriever,
  documentEnsembleSearch,
  createDocumentEnsembleRetriever,
  type CompanySearchOptions as CompanyEnsembleOptions,
  type DocumentSearchOptions as DocumentEnsembleOptions,
  type CompanySearchResult,
  type DocumentSearchResult,
  type SearchResult,
} from "~/server/rag";
