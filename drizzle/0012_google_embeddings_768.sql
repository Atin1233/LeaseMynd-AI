-- Google AI Studio embeddings: vector dimension 1536 → 768
-- Existing embeddings are dropped; re-upload documents to re-embed with Google.

-- pdr_ai_v2_pdf_chunks
ALTER TABLE "pdr_ai_v2_pdf_chunks" DROP COLUMN IF EXISTS "embedding";
ALTER TABLE "pdr_ai_v2_pdf_chunks" ADD COLUMN "embedding" vector(768);

-- agent_ai_chatbot_memory (if exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'pdr_ai_v2_agent_ai_chatbot_memory') THEN
    ALTER TABLE "pdr_ai_v2_agent_ai_chatbot_memory" DROP COLUMN IF EXISTS "embedding";
    ALTER TABLE "pdr_ai_v2_agent_ai_chatbot_memory" ADD COLUMN "embedding" vector(768);
  END IF;
END $$;
