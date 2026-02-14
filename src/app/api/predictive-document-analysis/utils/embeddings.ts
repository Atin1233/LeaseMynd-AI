import { createGoogleEmbeddings } from "~/lib/ai";

const embeddingCache = new Map<string, number[]>();

export async function getEmbeddings(text: string): Promise<number[]> {
    if (embeddingCache.has(text)) {
        return embeddingCache.get(text)!;
    }

    try {
        const embeddings = createGoogleEmbeddings();
        const [embedding] = await embeddings.embedDocuments([text]);
        const result = embedding ?? [];

        embeddingCache.set(text, result);
        return result;
    } catch (error) {
        console.error("Error getting embeddings:", error);
        return [];
    }
}

export async function batchGetEmbeddings(texts: string[]): Promise<number[][]> {
    const uniqueTexts = [...new Set(texts)];

    try {
        const embeddings = createGoogleEmbeddings();
        const results = await embeddings.embedDocuments(uniqueTexts);
        const embeddingMap = new Map(uniqueTexts.map((text, i) => [text, results[i]]));

        embeddingMap.forEach((embedding, text) => {
            embeddingCache.set(text, embedding ?? []);
        });

        return texts.map((text) => embeddingMap.get(text) ?? []);
    } catch (error) {
        console.error("Error getting batch embeddings:", error);
        return texts.map(() => []);
    }
}

export function clearEmbeddingCache(): void {
    embeddingCache.clear();
}

export function getEmbeddingCacheStats() {
    return {
        size: embeddingCache.size,
        entries: Array.from(embeddingCache.keys()).slice(0, 5),
    };
}
