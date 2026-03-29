import { prisma } from "@/lib/db";
import { scrapeReference } from "@/lib/scraper";

export interface Change {
  type:
    | "title_changed"
    | "description_changed"
    | "section_added"
    | "section_removed"
    | "major_content_update";
  old?: string;
  new?: string;
  detail?: string;
}

export interface Insight {
  suggestion: string;
  priority: "high" | "medium" | "low";
}

export async function scanCompetitor(
  competitorId: string,
  hotelId: string
): Promise<{ changes: Change[]; insights: Insight[] }> {
  // 1. Fetch competitor and hotel with context
  const competitor = await prisma.competitor.findUnique({
    where: { id: competitorId },
  });

  if (!competitor) {
    throw new Error(`Competitor ${competitorId} not found`);
  }

  const hotel = await prisma.hotel.findUnique({
    where: { id: hotelId },
    include: { context: true },
  });

  if (!hotel) {
    throw new Error(`Hotel ${hotelId} not found`);
  }

  // 2. Scrape competitor URL
  const result = await scrapeReference(competitor.url);
  if (!result.success) {
    throw new Error("Could not reach competitor website");
  }

  // 3. Cast lastSnapshot
  const lastSnapshot = competitor.lastSnapshot as {
    title?: string;
    description?: string;
    headings?: string[];
    bodyExcerpt?: string;
  };

  // 4. First scan (no prior snapshot)
  const isFirstScan = !lastSnapshot || !lastSnapshot.title;

  if (isFirstScan) {
    const baselineInsights: Insight[] = [
      {
        suggestion: "Baseline captured. Future scans will detect changes.",
        priority: "low",
      },
    ];

    await prisma.competitorScan.create({
      data: {
        competitorId,
        changes: [] as any,
        insights: baselineInsights as any,
        snapshotBefore: {} as any,
        snapshotAfter: {
          title: result.title,
          description: result.description,
          headings: result.headings,
          bodyExcerpt: result.bodyExcerpt,
        } as any,
      },
    });

    await prisma.competitor.update({
      where: { id: competitorId },
      data: {
        lastSnapshot: {
          title: result.title,
          description: result.description,
          headings: result.headings,
          bodyExcerpt: result.bodyExcerpt,
        } as any,
        lastScanAt: new Date(),
      },
    });

    return { changes: [], insights: baselineInsights };
  }

  // 5. Detect changes
  const changes: Change[] = [];

  // Title
  if (lastSnapshot.title !== result.title) {
    changes.push({
      type: "title_changed",
      old: lastSnapshot.title,
      new: result.title,
    });
  }

  // Description
  if (lastSnapshot.description !== result.description) {
    changes.push({
      type: "description_changed",
      old: lastSnapshot.description,
      new: result.description,
    });
  }

  // Section headings added
  const prevHeadings = lastSnapshot.headings ?? [];
  const currHeadings = result.headings ?? [];

  for (const heading of currHeadings) {
    if (!prevHeadings.includes(heading)) {
      changes.push({
        type: "section_added",
        detail: heading,
      });
    }
  }

  // Section headings removed
  for (const heading of prevHeadings) {
    if (!currHeadings.includes(heading)) {
      changes.push({
        type: "section_removed",
        detail: heading,
      });
    }
  }

  // Body similarity check (first 500 chars)
  const oldBody = (lastSnapshot.bodyExcerpt ?? "").slice(0, 500);
  const newBody = (result.bodyExcerpt ?? "").slice(0, 500);

  if (oldBody && newBody) {
    const oldWords = new Set(oldBody.toLowerCase().split(/\s+/).filter(Boolean));
    const newWords = newBody.toLowerCase().split(/\s+/).filter(Boolean);
    const matchingWords = newWords.filter((w) => oldWords.has(w)).length;
    const totalWords = Math.max(oldWords.size, newWords.length, 1);
    const overlap = matchingWords / totalWords;

    if (overlap < 0.7) {
      changes.push({
        type: "major_content_update",
        detail: `Body content overlap: ${Math.round(overlap * 100)}%`,
      });
    }
  }

  // 6. No changes
  if (changes.length === 0) {
    await prisma.competitorScan.create({
      data: {
        competitorId,
        changes: [] as any,
        insights: [] as any,
        snapshotBefore: lastSnapshot as any,
        snapshotAfter: {
          title: result.title,
          description: result.description,
          headings: result.headings,
          bodyExcerpt: result.bodyExcerpt,
        } as any,
      },
    });

    await prisma.competitor.update({
      where: { id: competitorId },
      data: {
        lastSnapshot: {
          title: result.title,
          description: result.description,
          headings: result.headings,
          bodyExcerpt: result.bodyExcerpt,
        } as any,
        lastScanAt: new Date(),
      },
    });

    return { changes: [], insights: [] };
  }

  // 7. Call OpenRouter LLM for insights
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY is not set");
  }

  const contactInfo = (hotel.contactInfo as Record<string, unknown>) ?? {};
  const city = (contactInfo.city as string) || "";
  const brandVoice = hotel.context?.brandVoice || "";

  const changesBullets = changes
    .map((c) => {
      if (c.type === "title_changed") {
        return `- Title changed from "${c.old}" to "${c.new}"`;
      }
      if (c.type === "description_changed") {
        return `- Description changed from "${c.old}" to "${c.new}"`;
      }
      if (c.type === "section_added") {
        return `- New section added: "${c.detail}"`;
      }
      if (c.type === "section_removed") {
        return `- Section removed: "${c.detail}"`;
      }
      if (c.type === "major_content_update") {
        return `- Major content update (${c.detail})`;
      }
      return `- ${c.type}`;
    })
    .join("\n");

  const prompt = `Competitor "${competitor.name}" (${competitor.url}) changed:\n${changesBullets}\nOur hotel: ${hotel.name} (${hotel.category}) in ${city}. Brand: "${brandVoice}". Generate 2-3 suggestions. Return ONLY JSON: { "insights": [{ "suggestion": "...", "priority": "high|medium|low" }] }`;

  const llmRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "http://localhost:3000",
      "X-Title": "hotelCMS",
    },
    body: JSON.stringify({
      model: "nvidia/nemotron-3-super-120b-a12b:free",
      max_tokens: 1024,
      temperature: 0.7,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!llmRes.ok) {
    const err = await llmRes.text();
    throw new Error(`OpenRouter API error (${llmRes.status}): ${err}`);
  }

  const llmData = await llmRes.json();
  const rawContent: string = llmData.choices?.[0]?.message?.content ?? "";

  // Parse response — strip markdown fences if present
  let jsonText = rawContent;
  const fenceMatch = rawContent.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) {
    jsonText = fenceMatch[1].trim();
  }

  let insights: Insight[] = [];
  try {
    const parsed = JSON.parse(jsonText);
    insights = Array.isArray(parsed.insights) ? parsed.insights : [];
  } catch {
    insights = [];
  }

  // 8. Create scan record
  await prisma.competitorScan.create({
    data: {
      competitorId,
      changes: changes as any,
      insights: insights as any,
      snapshotBefore: lastSnapshot as any,
      snapshotAfter: {
        title: result.title,
        description: result.description,
        headings: result.headings,
        bodyExcerpt: result.bodyExcerpt,
      } as any,
    },
  });

  // 9. Update competitor snapshot
  await prisma.competitor.update({
    where: { id: competitorId },
    data: {
      lastSnapshot: {
        title: result.title,
        description: result.description,
        headings: result.headings,
        bodyExcerpt: result.bodyExcerpt,
      } as any,
      lastScanAt: new Date(),
    },
  });

  // 10. Return
  return { changes, insights };
}

export async function scanAllCompetitors(
  hotelId: string
): Promise<{ scanned: number; withChanges: number }> {
  const competitors = await prisma.competitor.findMany({
    where: { hotelId },
  });

  let scanned = 0;
  let withChanges = 0;

  for (const competitor of competitors) {
    try {
      const result = await scanCompetitor(competitor.id, hotelId);
      scanned++;
      if (result.changes.length > 0) {
        withChanges++;
      }
    } catch {
      // Skip failed competitors
    }
  }

  return { scanned, withChanges };
}
