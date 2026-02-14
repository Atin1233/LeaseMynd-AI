# AI Layer – Google AI Studio Only

All **chat** and **embeddings** use **Google AI** only.

- **Chat**: `createChatModel()` → `ChatGoogleGenerativeAI` (Gemini).
- **Embeddings**: `createGoogleEmbeddings()` → `GoogleGenerativeAIEmbeddings` (embedding-001, 768 dim).
- **Lease analysis**: `callGoogleAI` in `~/lib/google-ai/client`.

## Env

- `GOOGLE_AI_API_KEY` required for all AI usage.
