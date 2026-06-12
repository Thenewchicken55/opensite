export interface ImageResult {
  url: string;
  alt: string;
  source: string;
}

export function extractTopics(prompt: string): string[] {
  const stopWords = new Set([
    "make", "a", "an", "the", "about", "for", "with", "of", "in", "on",
    "at", "to", "is", "and", "or", "but", "create", "wiki", "page", "add",
    "show", "me", "image", "images", "picture", "pictures", "photo", "photos",
    "write", "build", "generate", "give", "tell", "this", "that", "are",
    "was", "were", "been", "have", "has", "had", "do", "does", "did",
    "will", "would", "can", "could", "should", "may", "might", "shall",
    "need", "like", "want", "put", "set", "get", "use", "using", "used",
  ]);
  const cleaned = prompt.toLowerCase().replace(/[^a-z0-9\s]/g, " ");
  const words = cleaned.split(/\s+/).filter(Boolean);
  const unique = [...new Set(words)];
  return unique.filter((w) => w.length > 3 && !stopWords.has(w)).slice(0, 4);
}

export async function findImages(topic: string): Promise<ImageResult[]> {
  const results: ImageResult[] = [];

  try {
    const res = await fetch(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(topic)}`,
      { signal: AbortSignal.timeout(4000) },
    );
    if (res.ok) {
      const data = await res.json();
      if (data.thumbnail?.source) {
        results.push({ url: data.thumbnail.source, alt: data.title ?? topic, source: "Wikipedia" });
      }
      if (data.originalimage?.source) {
        results.push({ url: data.originalimage.source, alt: data.title ?? topic, source: "Wikipedia" });
      }
    }
  } catch {}

  try {
    const res = await fetch(
      `https://en.wikipedia.org/api/rest_v1/page/related/${encodeURIComponent(topic)}`,
      { signal: AbortSignal.timeout(4000) },
    );
    if (res.ok) {
      const data = await res.json();
      const pages = data.pages ?? [];
      for (const page of pages.slice(0, 3)) {
        if (page.thumbnail?.source) {
          results.push({ url: page.thumbnail.source, alt: page.title ?? topic, source: "Wikipedia" });
        }
      }
    }
  } catch {}

  return results;
}

export function buildImageHint(topics: string[]): string {
  if (topics.length === 0) return "";
  return `For reference, here are images found related to "${topics.join(", ")}":\n${topics
    .map((t) => `- ${t}: use inline SVG or check Wikipedia for "${t}"`)
    .join("\n")}`;
}
