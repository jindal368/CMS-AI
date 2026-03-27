# Functional Hotel CMS Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the Hotel CMS fully functional so users can create and manage hotel websites end-to-end through the dashboard UI.

**Architecture:** All API routes already exist and are tested. Each task creates a "use client" form/modal component and wires it into the existing server-rendered dashboard pages. Forms call existing REST API routes via fetch(), then use `router.refresh()` to revalidate server data.

**Tech Stack:** Next.js 16 App Router, React "use client" components, Tailwind CSS (dark theme), fetch() to REST APIs, `useRouter().refresh()` for server revalidation.

**Design System:** bg-[#0c0b0f], cards bg-[#16141c], elevated bg-[#1e1b27], borders border-[#2a2635], text text-[#e8e6f0], muted text-[#6b6880], coral #f27059, teal #3dd9b6, purple #a78bfa, amber #f5b731, blue #5b9cf5.

---

### Task 1: CreateHotelModal + wire into /hotels page

**Files:**
- Create: `src/components/cms/CreateHotelModal.tsx`
- Create: `src/components/cms/HotelActions.tsx` (client wrapper for buttons on hotels list page)
- Modify: `src/app/(dashboard)/hotels/page.tsx` — replace static "Create Hotel" button with `<HotelActions />`

- [ ] **Step 1: Create CreateHotelModal.tsx**

"use client" modal with form fields: name (text), category (select: luxury/boutique/business/resort/budget), phone, email, address, city, country. On submit: POST `/api/hotels` with body `{ name, category, contactInfo: { phone, email, address, city, country } }`. On success: `router.push('/hotels/' + newHotel.id)`. Loading state on submit button. Close on backdrop click or X button.

- [ ] **Step 2: Create HotelActions.tsx**

"use client" component that renders the "Create Hotel" button and controls modal open/close state. Renders `<CreateHotelModal>` when open.

- [ ] **Step 3: Wire into hotels page**

Modify `src/app/(dashboard)/hotels/page.tsx` — import `HotelActions` and replace the static `<button>Create Hotel</button>` with `<HotelActions />`. Also make each hotel card a working `<Link>` to `/hotels/[id]` (verify this already works).

- [ ] **Step 4: Verify manually**

Navigate to `/hotels`, click "Create Hotel", fill form, submit. Should create hotel and redirect to its detail page.

---

### Task 2: EditHotelForm + DeleteHotel on /hotels/[id] page

**Files:**
- Create: `src/components/cms/EditHotelForm.tsx`
- Create: `src/components/cms/DeleteHotelButton.tsx`
- Modify: `src/app/(dashboard)/hotels/[id]/page.tsx` — add edit/delete functionality

- [ ] **Step 1: Create EditHotelForm.tsx**

"use client" component. Receives current hotel data as props. Renders inline-editable fields: name, category, phone, email, address, city, country, SEO title, SEO description. Toggle between "view" and "edit" mode. On save: PUT `/api/hotels/[id]` with changed fields. Show save status (saving/saved/error). `router.refresh()` on success.

- [ ] **Step 2: Create DeleteHotelButton.tsx**

"use client" component. Red "Delete Hotel" button with two-click confirmation (first click shows "Are you sure?", second click deletes). DELETE `/api/hotels/[id]`. On success: `router.push('/hotels')`.

- [ ] **Step 3: Wire into hotel detail page**

Modify `src/app/(dashboard)/hotels/[id]/page.tsx` — replace the static hotel header with `<EditHotelForm hotel={serializedHotel} />` and add `<DeleteHotelButton hotelId={id} hotelName={hotel.name} />` in the header area.

- [ ] **Step 4: Verify manually**

Navigate to `/hotels/[id]`, edit hotel name, save, verify it updates. Click delete, confirm, verify redirect.

---

### Task 3: CreatePageModal + wire into hotel detail page

**Files:**
- Create: `src/components/cms/CreatePageModal.tsx`
- Create: `src/components/cms/PageActions.tsx`
- Modify: `src/app/(dashboard)/hotels/[id]/page.tsx` — wire page creation and page links

- [ ] **Step 1: Create CreatePageModal.tsx**

"use client" modal with fields: pageType (select: home/rooms/gallery/contact/about/dining/spa/events/custom), slug (auto-generated from pageType, editable), locale (default "en"), metaTags.title, metaTags.description. On submit: POST `/api/pages` with `{ hotelId, slug, pageType, locale, metaTags }`. On success: `router.refresh()` + close modal.

- [ ] **Step 2: Create PageActions.tsx**

"use client" wrapper with "Add Page" button + modal state. Also renders delete buttons per page row (DELETE `/api/pages/[id]`).

- [ ] **Step 3: Wire into hotel detail page**

In the Pages tab of `src/app/(dashboard)/hotels/[id]/page.tsx`, add `<PageActions>` for the add button. Each page in the list should link to `/hotels/[id]/pages/[pageId]` (the page builder). Add a delete icon per page row.

- [ ] **Step 4: Verify manually**

Create a new page, see it appear in the list, click into it to open page builder.

---

### Task 4: Room CRUD — CreateRoomModal + EditRoomModal + Delete

**Files:**
- Create: `src/components/cms/CreateRoomModal.tsx`
- Create: `src/components/cms/EditRoomModal.tsx`
- Create: `src/components/cms/RoomActions.tsx`
- Modify: `src/app/(dashboard)/hotels/[id]/rooms/page.tsx` — wire room management

- [ ] **Step 1: Create CreateRoomModal.tsx**

"use client" modal with fields: name, description (textarea), basePrice (number), currency (select: INR/USD/EUR/GBP), amenities (tag input — type and press Enter to add chips, click X to remove), maxGuests (number). On submit: POST `/api/rooms` with `{ hotelId, name, description, pricing: { basePrice, currency }, amenities, maxGuests }`. `router.refresh()` on success.

- [ ] **Step 2: Create EditRoomModal.tsx**

Same form as create but pre-populated with existing room data. On submit: PUT `/api/rooms/[id]`. Include delete button inside the modal (DELETE `/api/rooms/[id]`).

- [ ] **Step 3: Create RoomActions.tsx**

"use client" component managing modal states. "Add Room" button opens create modal. Each room card gets an "Edit" button opening edit modal with that room's data.

- [ ] **Step 4: Wire into rooms page**

Modify `src/app/(dashboard)/hotels/[id]/rooms/page.tsx` — serialize room data and pass to `<RoomActions>`. Replace static grid with interactive cards that have edit buttons.

- [ ] **Step 5: Verify manually**

Create room, edit room price, delete room — all from the rooms tab.

---

### Task 5: ThemeEditor — functional color picker + typography + save

**Files:**
- Create: `src/components/cms/ThemeEditor.tsx`
- Modify: `src/app/(dashboard)/hotels/[id]/theme/page.tsx` — replace display with editor

- [ ] **Step 1: Create ThemeEditor.tsx**

"use client" component. Receives current theme data (or null for new). Sections:
- **Colors**: 5 color inputs (primary, secondary, accent, bg, text) using `<input type="color">` with hex text display
- **Typography**: headingFont (text input), bodyFont (text input), scale (select: small/medium/large)
- **Spacing**: radio buttons (compact/balanced/spacious)
- **Template**: select (luxury/boutique/business/resort)
- **Live preview swatch**: renders a mini-preview strip showing the colors/fonts

On save: PUT `/api/hotels/[id]/theme` with `{ colorTokens, typography, spacing, baseTemplate }`. Save status indicator. `router.refresh()` on success.

- [ ] **Step 2: Wire into theme page**

Modify `src/app/(dashboard)/hotels/[id]/theme/page.tsx` — serialize theme data and pass to `<ThemeEditor hotelId={id} theme={serializedTheme} />`.

- [ ] **Step 3: Verify manually**

Change colors, save, refresh page — theme should persist. Create theme for hotel without one.

---

### Task 6: MediaUpload — drag-and-drop upload + delete

**Files:**
- Create: `src/components/cms/MediaUpload.tsx`
- Create: `src/components/cms/MediaActions.tsx`
- Modify: `src/app/(dashboard)/hotels/[id]/media/page.tsx` — wire upload and delete

- [ ] **Step 1: Create MediaUpload.tsx**

"use client" component. Drag-and-drop zone + file input fallback. On drop/select: POST `/api/media/upload` as FormData with `file` + `hotelId`. Show upload progress (indeterminate spinner since we can't track Sharp processing). On success: `router.refresh()`. Support multiple file upload (sequential processing with progress counter "Uploading 2/5...").

- [ ] **Step 2: Create MediaActions.tsx**

"use client" wrapper component. Manages upload modal/zone visibility. Also provides delete handler per media card: DELETE `/api/media/[id]`, `router.refresh()` on success.

- [ ] **Step 3: Wire into media page**

Modify `src/app/(dashboard)/hotels/[id]/media/page.tsx` — replace static Upload buttons with `<MediaActions>`. Wire delete functionality into `<MediaCard>` via callback props or by wrapping each card.

- [ ] **Step 4: Verify manually**

Upload an image, see it appear in the grid with generated variants. Delete an image.

---

### Task 7: Version management — publish/reject/rollback from versions tab

**Files:**
- Create: `src/components/cms/VersionActions.tsx`
- Modify: `src/app/(dashboard)/hotels/[id]/versions/page.tsx` — wire version actions

- [ ] **Step 1: Create VersionActions.tsx**

"use client" component. Receives version list as props. Renders each version as a timeline card with action buttons:
- Draft versions: "Publish" (POST `/api/versions/[id]/publish`) + "Reject" (POST `/api/versions/[id]/reject`)
- Published versions: "Rollback to this" (POST `/api/versions/[id]/rollback`)
- Status badges: draft=purple, published=teal, rejected=coral, rolled_back=amber
- Loading state per button. `router.refresh()` on success.

- [ ] **Step 2: Wire into versions page**

Modify `src/app/(dashboard)/hotels/[id]/versions/page.tsx` — serialize version data and pass to `<VersionActions>`.

- [ ] **Step 3: Verify manually**

Publish a draft, reject a draft, rollback to a previous version.

---

### Task 8: Wire "Create Hotel" → full website creation flow

**Files:**
- Modify: `src/components/cms/CreateHotelModal.tsx` — add post-creation setup step

- [ ] **Step 1: Add post-creation page scaffolding**

After hotel creation, auto-create 4 default pages (home, rooms, gallery, contact) by calling POST `/api/pages` for each. Show progress: "Creating hotel... Creating pages... Done!". Then redirect to the new hotel's detail page.

- [ ] **Step 2: Verify end-to-end**

Create new hotel → default pages created → navigate to page builder → add sections → preview site at `/preview/[hotelId]/home`.

---
