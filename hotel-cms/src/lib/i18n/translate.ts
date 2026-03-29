import { prisma } from "@/lib/db";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const MODEL = "nvidia/nemotron-3-super-120b-a12b:free";

/**
 * Returns true if a prop value should be included for translation.
 * Requires: string, length > 3, does not start with a reserved prefix.
 */
export function isTranslatableText(value: unknown): boolean {
  if (typeof value !== "string") return false;
  if (value.length <= 3) return false;
  const prefixes = ["http", "{{", "tel:", "mailto:", "#", "/"];
  for (const prefix of prefixes) {
    if (value.startsWith(prefix)) return false;
  }
  return true;
}

/**
 * Extract JSON from an LLM response that may be wrapped in markdown fences.
 */
function extractJson(raw: string): Record<string, string> {
  let jsonStr = raw;

  const fenceMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) {
    jsonStr = fenceMatch[1].trim();
  } else {
    const braceMatch = raw.match(/\{[\s\S]*\}/);
    if (braceMatch) {
      jsonStr = braceMatch[0];
    }
  }

  return JSON.parse(jsonStr) as Record<string, string>;
}

/**
 * Translate an entire hotel site into a target locale.
 *
 * For each page in the hotel's default locale:
 * - Upsert a page record with the target locale
 * - Replace all sections with translated copies
 *
 * Returns counts of translated pages and sections.
 */
export async function translateHotelSite(
  hotelId: string,
  targetLocale: string,
  targetLanguage: string
): Promise<{ pagesTranslated: number; sectionsTranslated: number }> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error(
      "OPENROUTER_API_KEY is not set. Get a key at https://openrouter.ai/keys"
    );
  }

  // 1. Fetch hotel to get its default locale
  const hotel = await prisma.hotel.findUnique({
    where: { id: hotelId },
    select: { id: true, defaultLocale: true, enabledLocales: true },
  });
  if (!hotel) throw new Error(`Hotel ${hotelId} not found`);

  const defaultLocale = hotel.defaultLocale ?? "en";

  // 2. Fetch all pages for the default locale, including ordered sections
  const sourcePages = await prisma.page.findMany({
    where: { hotelId, locale: defaultLocale },
    include: { sections: { orderBy: { sortOrder: "asc" } } },
  });

  let pagesTranslated = 0;
  let sectionsTranslated = 0;

  for (const sourcePage of sourcePages) {
    // 3a. Upsert the translated page
    const translatedPage = await prisma.page.upsert({
      where: {
        hotelId_slug_locale: {
          hotelId,
          slug: sourcePage.slug,
          locale: targetLocale,
        },
      },
      create: {
        hotelId,
        slug: sourcePage.slug,
        locale: targetLocale,
        pageType: sourcePage.pageType,
        sortOrder: sourcePage.sortOrder,
        metaTags: sourcePage.metaTags ?? {},
      },
      update: {
        pageType: sourcePage.pageType,
        sortOrder: sourcePage.sortOrder,
      },
    });

    // 3b. Remove any previously translated sections on this page
    await prisma.section.deleteMany({ where: { pageId: translatedPage.id } });

    // 3c. Collect all translatable strings from every section's props
    const textsToTranslate: Record<string, string> = {};

    for (let sIdx = 0; sIdx < sourcePage.sections.length; sIdx++) {
      const section = sourcePage.sections[sIdx];
      const props = (section.props as Record<string, unknown>) ?? {};

      for (const [key, value] of Object.entries(props)) {
        if (isTranslatableText(value)) {
          textsToTranslate[`${sIdx}_${key}`] = value as string;
        }
      }
    }

    // 3d. Call the LLM to translate (skip the API call if nothing to translate)
    let translations: Record<string, string> = {};

    if (Object.keys(textsToTranslate).length > 0) {
      const translationPrompt =
        `Translate these hotel website texts to ${targetLanguage}. ` +
        `Return ONLY valid JSON with same keys. Keep brand names, URLs, and {{tokens}} unchanged.\n` +
        JSON.stringify(textsToTranslate, null, 2);

      const res = await fetch(OPENROUTER_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "http://localhost:3000",
          "X-Title": "hotelCMS",
        },
        body: JSON.stringify({
          model: MODEL,
          max_tokens: 4096,
          messages: [{ role: "user", content: translationPrompt }],
          temperature: 0.3,
        }),
      });

      if (!res.ok) {
        const err = await res.text();
        throw new Error(`OpenRouter API error (${res.status}): ${err}`);
      }

      const data = await res.json();
      const content = data.choices?.[0]?.message?.content as string | undefined;
      if (!content) {
        throw new Error("No content in OpenRouter translation response");
      }

      // 3e. Parse the JSON, handling markdown fences
      try {
        translations = extractJson(content);
      } catch {
        // If parsing fails, fall back to original texts
        translations = { ...textsToTranslate };
      }
    }

    // 3f. Create translated section records
    for (let sIdx = 0; sIdx < sourcePage.sections.length; sIdx++) {
      const section = sourcePage.sections[sIdx];
      const originalProps = (section.props as Record<string, unknown>) ?? {};

      // Clone props and substitute translated values
      const translatedProps: Record<string, unknown> = { ...originalProps };
      for (const [key, value] of Object.entries(originalProps)) {
        const translationKey = `${sIdx}_${key}`;
        if (
          isTranslatableText(value) &&
          translations[translationKey] !== undefined
        ) {
          translatedProps[key] = translations[translationKey];
        }
      }

      await prisma.section.create({
        data: {
          pageId: translatedPage.id,
          sortOrder: section.sortOrder,
          isVisible: section.isVisible,
          componentVariant: section.componentVariant,
          props: translatedProps as Record<string, string>,
          customCss: section.customCss,
          customHtml: section.customHtml,
          customMode: section.customMode,
        },
      });

      sectionsTranslated++;
    }

    pagesTranslated++;
  }

  // 4. Add targetLocale to hotel.enabledLocales if not already present
  const enabledLocales = (hotel.enabledLocales as string[]) ?? ["en"];
  if (!enabledLocales.includes(targetLocale)) {
    await prisma.hotel.update({
      where: { id: hotelId },
      data: { enabledLocales: [...enabledLocales, targetLocale] },
    });
  }

  return { pagesTranslated, sectionsTranslated };
}
