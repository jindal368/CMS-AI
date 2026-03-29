const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const MODEL = "nvidia/nemotron-3-super-120b-a12b:free";

export interface ReviewInput {
  guestName: string;
  reviewText: string;
  rating: number;
  sentiment: string;
}

export interface HotelInput {
  name: string;
  category: string;
  brandVoice: string;
}

export function deriveSentiment(
  rating: number
): "positive" | "neutral" | "negative" {
  if (rating >= 4) return "positive";
  if (rating === 3) return "neutral";
  return "negative";
}

function buildToneInstructions(sentiment: "positive" | "neutral" | "negative"): string {
  switch (sentiment) {
    case "positive":
      return "Tone: warm, grateful, personal. Thank them by name. Reference specific things they praised. Invite them to return.";
    case "neutral":
      return "Tone: helpful, constructive, inviting. Acknowledge their feedback. Address any concerns. Highlight what makes the hotel special. Invite them to return.";
    case "negative":
      return "Tone: empathetic, professional, solution-oriented. Apologize sincerely. Address specific complaints without being defensive. Offer to make it right. Provide contact email for follow-up.";
  }
}

function buildPrompt(review: ReviewInput, hotel: HotelInput): string {
  const sentiment = deriveSentiment(review.rating);
  const toneInstructions = buildToneInstructions(sentiment);
  const brandVoice = hotel.brandVoice || "professional, welcoming";

  return `Respond to this ${sentiment} guest review for ${hotel.name} (${hotel.category}).
Brand voice: "${brandVoice}"
Guest: ${review.guestName} rated ${review.rating}/5
Review: "${review.reviewText}"

${toneInstructions}
Keep under 150 words. Sign off as "The ${hotel.name} Team".
Return ONLY the response text, no quotes or labels.`;
}

function stripMarkdownFences(text: string): string {
  // Remove opening and closing markdown code fences
  return text.replace(/^```(?:\w+)?\s*/m, "").replace(/\s*```\s*$/m, "").trim();
}

export async function generateReviewResponse(
  review: ReviewInput,
  hotel: HotelInput
): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error(
      "OPENROUTER_API_KEY is not set. Get a key at https://openrouter.ai/keys"
    );
  }

  const prompt = buildPrompt(review, hotel);

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
      max_tokens: 1024,
      temperature: 0.7,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenRouter API error (${res.status}): ${err}`);
  }

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("No content in OpenRouter response");
  }

  return stripMarkdownFences(content);
}
