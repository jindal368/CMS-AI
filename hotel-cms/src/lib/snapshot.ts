import { updateSnapshot } from "@/lib/hotel-context";

/**
 * Capture a hotel page's rendered HTML by fetching the preview route.
 */
export async function capturePageSnapshot(
  hotelId: string,
  pageSlug: string,
  baseUrl: string = "http://localhost:3000"
): Promise<string> {
  try {
    const resolvedSlug = pageSlug === "/" ? "home" : pageSlug;
    const res = await fetch(`${baseUrl}/preview/${hotelId}/${resolvedSlug}`, {
      cache: "no-store",
    });
    if (!res.ok) return "";
    const html = await res.text();
    await updateSnapshot(hotelId, pageSlug, html);
    return html;
  } catch {
    return "";
  }
}
