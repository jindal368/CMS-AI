import { prisma } from "@/lib/db";

interface CreatedSection {
  hotelId: string;
  sectionId: string;
  pageId: string;
  locale: string;
}

export async function executeCampaign(
  campaignId: string
): Promise<{ deployed: number; failed: number }> {
  // 1. Fetch campaign with org
  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    include: { org: true },
  });

  if (!campaign) {
    throw new Error(`Campaign ${campaignId} not found`);
  }

  if (campaign.status !== "draft") {
    throw new Error("Campaign is not in draft status");
  }

  // 2. Determine target hotels
  const targetHotelIds = campaign.targetHotels as string[];

  const hotels = await prisma.hotel.findMany({
    where:
      targetHotelIds.length === 0
        ? { orgId: campaign.orgId }
        : { id: { in: targetHotelIds }, orgId: campaign.orgId },
    include: {
      theme: true,
      context: true,
      pages: {
        include: { sections: true },
      },
    },
    // contactInfo, category, name are top-level fields on the hotel model
  });

  // 3. Track created sections
  const createdSections: CreatedSection[] = [];
  let failed = 0;

  // 4. For each hotel
  for (const hotel of hotels) {
    try {
      // a. Extract relevant hotel data
      const contactInfo = hotel.contactInfo as Record<string, unknown>;
      const city = (contactInfo?.city as string) || "";
      const country = (contactInfo?.country as string) || "";
      const brandVoice =
        (hotel.context?.brandVoice as string | undefined) || "";
      const colorTokens = hotel.theme?.colorTokens as
        | Record<string, string>
        | undefined;
      const primary = colorTokens?.primary || "#e85d45";
      const accent = colorTokens?.accent || "#7c5cbf";

      // b. Find homepage: slug "/" with locale "en", or first page
      const homepage =
        hotel.pages.find((p) => p.slug === "/" && p.locale === "en") ||
        hotel.pages[0];

      // c. Skip if no homepage
      if (!homepage) {
        continue;
      }

      // d. Call OpenRouter
      const apiKey = process.env.OPENROUTER_API_KEY;
      if (!apiKey) {
        throw new Error("OPENROUTER_API_KEY is not set");
      }

      const prompt = `Create a promotional banner for a hotel website.
Campaign: "${campaign.title}"
Brief: "${campaign.brief}"
Hotel: ${hotel.name} (${hotel.category}) in ${city}, ${country}
Brand voice: "${brandVoice}"

Generate a promotional banner as complete HTML with inline styles. Use brand colors primary=${primary} accent=${accent}. Mention the hotel name. Include headline, description, CTA button linking to {booking}. All styles inline. Return ONLY HTML, no explanation.`;

      const res = await fetch(
        "https://openrouter.ai/api/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
            "HTTP-Referer": "http://localhost:3000",
            "X-Title": "hotelCMS",
          },
          body: JSON.stringify({
            model: "nvidia/nemotron-3-super-120b-a12b:free",
            max_tokens: 2048,
            temperature: 0.7,
            messages: [{ role: "user", content: prompt }],
          }),
        }
      );

      if (!res.ok) {
        const err = await res.text();
        throw new Error(`OpenRouter API error (${res.status}): ${err}`);
      }

      const data = await res.json();
      const rawContent: string = data.choices?.[0]?.message?.content ?? "";

      // e. Extract HTML (strip markdown fences if present)
      let html = rawContent;
      const fenceMatch = rawContent.match(/```(?:html)?\s*([\s\S]*?)```/);
      if (fenceMatch) {
        html = fenceMatch[1].trim();
      }

      // f. Create section
      const section = await prisma.section.create({
        data: {
          pageId: homepage.id,
          componentVariant: "hero_minimal",
          sortOrder: 1,
          isVisible: true,
          props: {} as any,
          customHtml: html,
          customMode: true,
        },
      });

      // g. Push to createdSections
      createdSections.push({
        hotelId: hotel.id,
        sectionId: section.id,
        pageId: homepage.id,
        locale: homepage.locale,
      });
    } catch {
      failed++;
    }
  }

  // 5. Update campaign status and store created sections
  await prisma.campaign.update({
    where: { id: campaignId },
    data: {
      status: "active",
      createdSections: createdSections as any,
    },
  });

  // 6. Return result
  return { deployed: createdSections.length, failed };
}
