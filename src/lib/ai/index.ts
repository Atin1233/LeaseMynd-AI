/**
 * Unified AI abstraction – Google AI Studio only
 */

export { createChatModel } from "./chat";
export { createGoogleEmbeddings, EMBEDDING_DIMENSION, EMBEDDING_MODEL } from "./embeddings";
export type { CreateChatModelOptions } from "./types";
export { DEFAULT_MODEL } from "./types";
