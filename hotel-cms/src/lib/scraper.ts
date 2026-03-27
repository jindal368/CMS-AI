export interface SiteReference {
  url: string;
  title: string;
  description: string;
  headings: string[];
  bodyExcerpt: string;
  success: boolean;
}

export async function scrapeReference(rawUrl: string): Promise<SiteReference> {
  const normalizedUrl = rawUrl.startsWith("http") ? rawUrl : `https://${rawUrl}`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(normalizedUrl, {
      signal: controller.signal,
      redirect: "follow",
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; HotelCMS/1.0)",
      },
    });

    clearTimeout(timeoutId);

    const html = await response.text();

    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : "";

    const descMatch = html.match(
      /<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i
    );
    const description = descMatch ? descMatch[1].trim() : "";

    const headingMatches = html.matchAll(/<h[1-3][^>]*>([^<]+)<\/h[1-3]>/gi);
    const headings: string[] = [];
    for (const match of headingMatches) {
      headings.push(match[1].trim());
      if (headings.length >= 10) break;
    }

    const bodyExcerpt = html
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 2000);

    return {
      url: normalizedUrl,
      title,
      description,
      headings,
      bodyExcerpt,
      success: true,
    };
  } catch {
    return {
      url: normalizedUrl,
      title: "",
      description: "",
      headings: [],
      bodyExcerpt: "",
      success: false,
    };
  }
}

export function extractUrlFromText(text: string): string | null {
  const match = text.match(
    /(?:https?:\/\/[^\s]+|(?:www\.)?[a-zA-Z0-9][-a-zA-Z0-9]*\.[a-z]{2,}(?:\/[^\s]*)?)/i
  );
  return match ? match[0] : null;
}
