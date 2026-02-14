import { search, SafeSearchType } from "duck-duck-scrape";

export type WebSearchResult = {
    title: string;
    url: string;
    snippet: string;
    relevanceScore?: number;
};

/**
 * Web search using DuckDuckGo (no external AI/search API).
 * Replaces Tavily for Google‑only migration.
 */
export async function performWebSearch(
    query: string,
    maxResults = 5
): Promise<WebSearchResult[]> {
    try {
        const { results } = await search(query, {
            safeSearch: SafeSearchType.OFF,
        });

        if (!results || !Array.isArray(results)) {
            return [];
        }

        return results
            .slice(0, maxResults)
            .map((r) => ({
                title: r.title ?? "Untitled",
                url: r.url ?? "",
                snippet: r.description ?? r.title ?? "",
            }))
            .filter((item) => item.url && item.title);
    } catch (error) {
        console.error("Web search error:", error);
        return [];
    }
}
