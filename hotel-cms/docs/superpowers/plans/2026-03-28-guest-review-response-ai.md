# Guest Review Response AI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a review response workbench where hotel managers paste guest reviews, AI drafts on-brand responses with sentiment-adjusted tone, and responses are tracked with analytics.

**Architecture:** New Review model stores reviews with sentiment, AI response, and status. Response generator calls LLM with tone-adjusted prompts based on star rating. API routes handle CRUD + regeneration + stats aggregation. CMS gets a Reviews tab with add form, response editor, filterable list, and stats cards.

**Tech Stack:** Prisma (Review model), OpenRouter LLM (response generation), Next.js server + client components.

---

### Task 1: Prisma schema — Review model

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Step 1: Add ReviewStatus enum and Review model**

Read `prisma/schema.prisma`. Add after CampaignStatus enum:

```prisma
enum ReviewStatus {
  pending
  responded
  skipped
}
```

Add Review model after CompetitorScan:

```prisma
model Review {
  id            String       @id @default(uuid())
  hotelId       String       @map("hotel_id")
  guestName     String       @map("guest_name")
  reviewText    String       @map("review_text")
  rating        Int
  source        String       @default("google")
  reviewDate    DateTime?    @map("review_date")
  sentiment     String       @default("neutral")
  aiResponse    String?      @map("ai_response")
  finalResponse String?      @map("final_response")
  status        ReviewStatus @default(pending)
  respondedAt   DateTime?    @map("responded_at")
  createdAt     DateTime     @default(now()) @map("created_at")

  hotel Hotel @relation(fields: [hotelId], references: [id], onDelete: Cascade)

  @@map("reviews")
}
```

Add `reviews Review[]` to Hotel model's relations.

- [ ] **Step 2: Run migration**

Run: `cd /home/vishesh/personal/cms/hotel-cms && npx prisma migrate dev --name add-reviews`

- [ ] **Step 3: Verify build**

Run: `npx next build 2>&1 | grep -E "✓|Error"`

---

### Task 2: AI response generation utility

**Files:**
- Create: `src/lib/reviews/generate-response.ts`

- [ ] **Step 1: Create response generator**

Export:

```typescript
export async function generateReviewResponse(
  review: { guestName: string; reviewText: string; rating: number; sentiment: string },
  hotel: { name: string; category: string; brandVoice: string }
): Promise<string>
```

Build a tone-specific prompt based on sentiment:

**Positive (sentiment === "positive"):**
```
Respond to this positive guest review for {hotel.name} ({hotel.category}).
Brand voice: "{hotel.brandVoice || "professional, welcoming"}"
Guest: {review.guestName} rated {review.rating}/5
Review: "{review.reviewText}"

Tone: warm, grateful, personal. Thank them by name. Reference specific things they praised. Invite them to return.
Keep under 150 words. Sign off as "The {hotel.name} Team".
Return ONLY the response text.
```

**Neutral (sentiment === "neutral"):**
Same structure but tone: "helpful, constructive, inviting. Acknowledge their feedback. Address any concerns. Highlight what makes the hotel special. Invite them to return."

**Negative (sentiment === "negative"):**
Same structure but tone: "empathetic, professional, solution-oriented. Apologize sincerely. Address specific complaints without being defensive. Offer to make it right. Provide contact email for follow-up."

Call OpenRouter: fetch `https://openrouter.ai/api/v1/chat/completions`, model `nvidia/nemotron-3-super-120b-a12b:free`, max_tokens 1024, temperature 0.7. Use `process.env.OPENROUTER_API_KEY`. Return the response text (strip markdown fences if present).

Also export a helper:

```typescript
export function deriveSentiment(rating: number): "positive" | "neutral" | "negative" {
  if (rating >= 4) return "positive";
  if (rating === 3) return "neutral";
  return "negative";
}
```

- [ ] **Step 2: Verify build**

Run: `npx next build 2>&1 | grep -E "✓|Error"`

---

### Task 3: API routes

**Files:**
- Create: `src/app/api/reviews/route.ts`
- Create: `src/app/api/reviews/[id]/route.ts`
- Create: `src/app/api/reviews/[id]/regenerate/route.ts`
- Create: `src/app/api/reviews/stats/route.ts`

- [ ] **Step 1: Create reviews list + create routes**

`GET /api/reviews?hotelId=xxx&status=pending` — requireAuth. requireHotelAccess on hotelId. Fetch reviews with optional filters (status, source, sentiment from query params). OrderBy createdAt desc. Return array.

`POST /api/reviews` — requireAuth + role >= editor. `export const maxDuration = 60`. Accepts: `{ hotelId, guestName, reviewText, rating, source, reviewDate? }`. Validate: rating 1-5, guestName and reviewText non-empty. Compute sentiment via `deriveSentiment(rating)`. Create Review. Fetch hotel with context (brandVoice). Call `generateReviewResponse`. Update review with aiResponse. Return review.

- [ ] **Step 2: Create single review routes**

`GET /api/reviews/[id]` — requireAuth. Fetch review, verify hotel access. Return.

`PUT /api/reviews/[id]` — requireAuth + role >= editor. Accepts `{ finalResponse?, status? }`. If status === "responded", set respondedAt = new Date(). Update. Return.

`DELETE /api/reviews/[id]` — requireAuth + role >= editor. Verify hotel access. Delete. Return { deleted: true }.

Params: `Promise<{ id: string }>`.

- [ ] **Step 3: Create regenerate route**

`POST /api/reviews/[id]/regenerate` — requireAuth + role >= editor. `export const maxDuration = 60`. Fetch review with hotel + context. Call generateReviewResponse. Update aiResponse. Return { aiResponse }.

- [ ] **Step 4: Create stats route**

`GET /api/reviews/stats?hotelId=xxx` — requireAuth. requireHotelAccess.

Compute via Prisma:
- total: count all reviews for hotel
- avgRating: aggregate avg on rating field, round to 1 decimal
- responded: count where status = "responded"
- responseRate: (responded / total * 100), rounded
- pending: count where status = "pending"
- bySource: groupBy source, count each
- bySentiment: groupBy sentiment, count each
- thisMonth: filter createdAt >= start of current month, compute total + avgRating + responseRate

Return as JSON object.

- [ ] **Step 5: Verify build**

Run: `npx next build 2>&1 | grep -E "✓|Error"`

---

### Task 4: Reviews workbench UI

**Files:**
- Create: `src/app/(dashboard)/hotels/[id]/reviews/page.tsx`
- Modify: `src/components/hotel-tabs.tsx`

- [ ] **Step 1: Create reviews page**

`src/app/(dashboard)/hotels/[id]/reviews/page.tsx` — server component, force-dynamic. getSessionOrRedirect. Fetch reviews for hotel, stats, and hotel context. Serialize. Pass to client wrapper.

**Create client wrapper `src/components/cms/ReviewsManager.tsx`:**

"use client". Props: `{ hotelId, reviews (serialized), stats, hotelName }`.

**Stats bar (top):** 4 small glass cards:
- Total Reviews (number)
- Avg Rating (stars display + number)
- Response Rate (percentage, colored: >80% teal, 50-80% amber, <50% coral)
- Pending (count, coral if > 0)

**Add Review form (glass-card-static, collapsible via "Add Review" button):**
- Guest name input
- Star rating: 5 star buttons. Click star N sets rating to N. Filled stars = selected (coral fill), empty = unselected. Visual feedback.
- Source: select dropdown (Google, TripAdvisor, Booking.com, Expedia, Other)
- Review date: date input (optional)
- Review text: textarea (4 rows)
- "Generate Response" button (coral gradient) — POST /api/reviews, show loading "Generating response..."

**Response panel (shows after generation, also when clicking a pending review):**
- Sentiment badge: positive (teal "Positive ★★★★★"), neutral (amber "Neutral ★★★"), negative (coral "Negative ★★")
- AI response in an editable textarea (pre-filled)
- Button row:
  - "Regenerate" (purple outline) — POST /api/reviews/[id]/regenerate, loading state, updates textarea
  - "Copy" (blue outline) — navigator.clipboard.writeText(textarea value), show "Copied!" toast
  - "Mark Responded" (teal) — PUT /api/reviews/[id] with { status: "responded", finalResponse: textarea value }, router.refresh()
  - "Skip" (gray) — PUT with { status: "skipped" }, router.refresh()

**Reviews list:**
- Filter tabs: All | Pending (count) | Responded | Skipped — client-side filter on status
- Each review card (glass-card):
  - Top row: guest name (bold), star rating (5 small stars colored), source badge (small pill), relative date
  - Sentiment badge (small, colored)
  - Review excerpt (truncated 100 chars)
  - Status badge: pending (purple), responded (teal), skipped (gray)
  - Expandable on click: full review text, AI response, final response (if different), responded date
  - "Copy Response" on responded reviews

- [ ] **Step 2: Add Reviews to hotel tabs**

Read `src/components/hotel-tabs.tsx`. Add `{ label: "Reviews", href: \`/hotels/\${hotelId}/reviews\` }` after Competitors tab.

- [ ] **Step 3: Verify build**

Run: `npx next build 2>&1 | grep -E "✓|Error"`

---
