# Guest Review Response AI — Design Spec

**Goal:** Give hotel managers a review response workbench — paste a guest review, AI drafts an on-brand response with sentiment-adjusted tone, manager edits and copies it back to the review platform.

**Decisions:**
- Stored reviews with full history and analytics
- Auto-detect sentiment from star rating, adjust AI tone (positive/neutral/negative)
- Manual paste-in (no API integrations for v1)

---

## 1. Data Model

### New Prisma model

```prisma
enum ReviewStatus {
  pending
  responded
  skipped
}

model Review {
  id            String       @id @default(uuid())
  hotelId       String       @map("hotel_id")
  guestName     String       @map("guest_name")
  reviewText    String       @map("review_text")
  rating        Int          // 1-5
  source        String       @default("google") // google, tripadvisor, booking, expedia, other
  reviewDate    DateTime?    @map("review_date")
  sentiment     String       @default("neutral") // positive, neutral, negative
  aiResponse    String?      @map("ai_response")
  finalResponse String?      @map("final_response")
  status        ReviewStatus @default(pending)
  respondedAt   DateTime?    @map("responded_at")
  createdAt     DateTime     @default(now()) @map("created_at")

  hotel Hotel @relation(fields: [hotelId], references: [id], onDelete: Cascade)

  @@map("reviews")
}
```

Add `reviews Review[]` to Hotel model.

**Sentiment derivation:** rating 4-5 = "positive", 3 = "neutral", 1-2 = "negative". Computed on creation.

### Files
- Modify: `prisma/schema.prisma`
- Run migration

---

## 2. AI Response Generation

### Utility: `src/lib/reviews/generate-response.ts`

```typescript
async function generateReviewResponse(
  review: { guestName: string; reviewText: string; rating: number; sentiment: string },
  hotel: { name: string; category: string; brandVoice: string }
): Promise<string>
```

Calls OpenRouter LLM with sentiment-adjusted prompt:

**Positive (4-5 stars):**
```
Respond to this positive guest review for {hotelName} ({category}).
Brand voice: "{brandVoice}"
Guest: {guestName} rated {rating}/5
Review: "{reviewText}"

Tone: warm, grateful, personal. Thank them by name. Reference specific things they praised. Invite them to return.
Keep under 150 words. Sign off as "The {hotelName} Team".
Return ONLY the response text, no quotes or labels.
```

**Neutral (3 stars):**
```
Tone: helpful, constructive, inviting. Acknowledge feedback. Address concerns. Highlight what makes the hotel special. Invite return.
```

**Negative (1-2 stars):**
```
Tone: empathetic, professional, solution-oriented. Apologize sincerely. Address complaints without being defensive. Offer to make it right. Provide follow-up contact.
```

One LLM call per review. Model: nvidia/nemotron free. Max 1024 tokens.

### Files
- Create: `src/lib/reviews/generate-response.ts`

---

## 3. API Routes

### `POST /api/reviews` — Add review + generate response

Auth: requireHotelAccess + editor role. Accepts: `{ hotelId, guestName, reviewText, rating, source, reviewDate? }`. Computes sentiment from rating. Creates Review. Calls generateReviewResponse. Updates review.aiResponse. Returns review with response.

`export const maxDuration = 60`.

### `GET /api/reviews?hotelId=xxx&status=pending` — List reviews

Auth: requireHotelAccess. Optional filters: status, source, sentiment. Ordered by createdAt desc. Returns array.

### `GET /api/reviews/[id]` — Single review

Auth: requireAuth. Verify hotel access via review.hotelId.

### `PUT /api/reviews/[id]` — Update review (edit response, change status)

Auth: requireHotelAccess + editor role. Accepts: `{ finalResponse?, status?, aiResponse? }`. If status = "responded", set respondedAt = now(). Returns updated review.

### `POST /api/reviews/[id]/regenerate` — Regenerate AI response

Auth: requireHotelAccess + editor role. `export const maxDuration = 60`. Fetches review + hotel context. Calls generateReviewResponse again. Updates aiResponse. Returns new response.

### `DELETE /api/reviews/[id]` — Delete review

Auth: requireHotelAccess + editor role.

### `GET /api/reviews/stats?hotelId=xxx` — Analytics

Auth: requireHotelAccess. Returns: `{ total, avgRating, responseRate, pending, bySource: {google: N, ...}, bySentiment: {positive: N, ...}, thisMonth: { total, avgRating, responseRate } }`. Computed via Prisma aggregations.

### Files
- Create: `src/app/api/reviews/route.ts`
- Create: `src/app/api/reviews/[id]/route.ts`
- Create: `src/app/api/reviews/[id]/regenerate/route.ts`
- Create: `src/app/api/reviews/stats/route.ts`

---

## 4. CMS UI — Reviews Workbench

### New page: `/hotels/[id]/reviews`

Add "Reviews" to HotelTabs.

**Stats bar (top):**
- 4 glass cards: Total Reviews, Avg Rating (star display), Response Rate %, Pending count
- Fetch from /api/reviews/stats

**Add Review form (glass-card-static):**
- Guest name input
- Star rating: 5 clickable star buttons (filled = selected, empty = unselected). Click sets rating.
- Source: dropdown (Google, TripAdvisor, Booking.com, Expedia, Other)
- Review date: date input (optional)
- Review text: textarea (4 rows)
- "Generate Response" button (coral gradient) → POST /api/reviews → shows response below

**Response panel (appears after generation):**
- Sentiment badge (positive=teal "Positive ★★★★★", neutral=amber, negative=coral)
- AI response in editable textarea (pre-filled with aiResponse)
- Button row: "Regenerate" (purple outline), "Copy" (copies textarea to clipboard), "Mark Responded" (teal, saves finalResponse + status), "Skip" (gray)
- Success toast on copy/respond

**Reviews list:**
- Filter tabs: All | Pending | Responded | Skipped (with counts)
- Each review card (glass-card): guest name, star rating (colored), source badge, review excerpt (80 chars), sentiment badge, status badge, relative date
- Expandable: click to show full review text, AI response, final response (if different), responded date
- "Copy Response" button on each responded review for reuse

### Files
- Create: `src/app/(dashboard)/hotels/[id]/reviews/page.tsx`
- Modify: `src/components/hotel-tabs.tsx` — add Reviews tab

---

## Out of Scope
- Auto-pulling reviews from Google/TripAdvisor APIs (requires OAuth, complex)
- Publishing responses back to review platforms (requires platform APIs)
- Review sentiment analysis beyond star rating (NLP)
- Email notifications for new reviews
- Review response templates library
- Multi-language review responses (use existing i18n system for that)
