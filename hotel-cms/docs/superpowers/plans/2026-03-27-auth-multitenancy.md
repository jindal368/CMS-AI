# Auth + Multi-Tenancy Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add org-based authentication with role-based access control so multiple hotel chains can use the CMS securely.

**Architecture:** New Prisma models (Organization, User, Session) with bcrypt password hashing. Auth helper library reads httpOnly cookies. Every API route and dashboard page checks session at the top. Login/register are separate pages outside the dashboard layout. Team management lets admins invite users with roles and hotel access.

**Tech Stack:** Prisma (schema), bcryptjs (password hashing), Next.js cookies API, httpOnly session cookies.

---

### Task 1: Prisma schema — add Organization, User, Session, UserRole

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Step 1: Add new models and enum to schema**

Add `UserRole` enum after existing enums. Add Organization, User, Session models after HotelContext. Add `orgId` and `org` relation to Hotel model.

UserRole enum: admin, editor, viewer.

Organization: id, name, slug (unique), apiKey (unique, uuid default), logo (optional), brandGuidelines (optional), createdAt. Has users and hotels relations. Maps to "organizations".

User: id, orgId (FK), email (unique), name, passwordHash, role (UserRole, default editor), hotelAccess (Json, default "[]"), lastLoginAt (optional), createdAt. Relation to org (cascade delete) and sessions. Maps to "users".

Session: id, userId (FK), token (unique), expiresAt, createdAt. Relation to user (cascade delete). Maps to "sessions".

Hotel: add `orgId String? @map("org_id")` and `org Organization? @relation(fields: [orgId], references: [id])`. Nullable for backward compatibility.

- [ ] **Step 2: Install bcryptjs**

Run: `cd /home/vishesh/personal/cms/hotel-cms && npm install bcryptjs @types/bcryptjs`

- [ ] **Step 3: Run migration**

Run: `npx prisma migrate dev --name add-auth-multitenancy`

- [ ] **Step 4: Verify build**

Run: `npx next build 2>&1 | grep -E "✓|Error"`

---

### Task 2: Auth library — session helpers

**Files:**
- Create: `src/lib/auth.ts`

- [ ] **Step 1: Create auth helper module**

Create `src/lib/auth.ts` with these exports:

```typescript
import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
```

Constants: `COOKIE_NAME = "hotelcms_session"`, `SESSION_EXPIRY_DAYS = 30`, `ROLE_HIERARCHY = { admin: 3, editor: 2, viewer: 1 }`.

**`getSessionFromRequest(request: NextRequest)`** — reads cookie from `request.cookies.get(COOKIE_NAME)`, looks up Session in DB with `include: { user: { include: { org: true } } }`, checks `expiresAt > new Date()`, returns `{ user, org }` or `null`. Deletes expired sessions.

**`requireAuth(request: NextRequest)`** — calls getSessionFromRequest, if null returns `Response.json({ error: "Unauthorized" }, { status: 401 })`. Returns `{ user, org, response: null }` on success, `{ user: null, org: null, response: Response }` on failure. Caller checks: `if (auth.response) return auth.response;`

**`requireRole(request: NextRequest, minRole: "admin" | "editor" | "viewer")`** — calls requireAuth, then checks `ROLE_HIERARCHY[user.role] >= ROLE_HIERARCHY[minRole]`. Returns 403 if insufficient.

**`requireHotelAccess(request: NextRequest, hotelId: string)`** — calls requireAuth, then: (1) fetches hotel by ID, checks `hotel.orgId === user.orgId` (or hotel.orgId is null for legacy data), (2) if user.role is admin → access granted, (3) else checks if hotelId is in user.hotelAccess array. Returns 403 if denied.

**`getSessionFromCookies()`** — for server components. Uses `await cookies()` from next/headers to get the token, same DB lookup logic. Returns `{ user, org }` or `null`.

**`getSessionOrRedirect()`** — calls getSessionFromCookies, if null calls `redirect("/login")`. Returns `{ user, org }`.

**`createSession(userId: string)`** — creates Session record with `token: crypto.randomUUID()`, `expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)`. Returns the token string.

**`setSessionCookie(token: string)`** — uses `(await cookies()).set(COOKIE_NAME, token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 30 * 24 * 60 * 60 })`.

**`clearSessionCookie()`** — uses `(await cookies()).delete(COOKIE_NAME)`.

- [ ] **Step 2: Verify build**

Run: `npx next build 2>&1 | grep -E "✓|Error"`

---

### Task 3: Auth API routes — register, login, logout, me

**Files:**
- Create: `src/app/api/auth/register/route.ts`
- Create: `src/app/api/auth/login/route.ts`
- Create: `src/app/api/auth/logout/route.ts`
- Create: `src/app/api/auth/me/route.ts`

- [ ] **Step 1: Create register route**

`POST /api/auth/register` — accepts `{ orgName, email, password, name }`. Validates with Zod (orgName min 2, email valid, password min 8, name min 1). Checks email not already taken. Hashes password with `bcryptjs.hash(password, 12)`. Generates slug from orgName: `orgName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")`. Creates Organization, then User with role=admin and hotelAccess=[]. Creates session via `createSession(user.id)`, sets cookie via `setSessionCookie(token)`. Returns `{ user: { id, email, name, role }, org: { id, name, slug } }` with status 201.

- [ ] **Step 2: Create login route**

`POST /api/auth/login` — accepts `{ email, password }`. Finds user by email with `include: { org: true }`. If not found, returns 401 "Invalid credentials". Compares password with `bcryptjs.compare(password, user.passwordHash)`. If mismatch, returns 401. Updates `lastLoginAt`. Creates session, sets cookie. Returns `{ user: { id, email, name, role }, org: { id, name, slug } }`.

- [ ] **Step 3: Create logout route**

`POST /api/auth/logout` — reads cookie token, deletes Session record where token matches, clears cookie. Returns 200 `{ success: true }`.

- [ ] **Step 4: Create me route**

`GET /api/auth/me` — calls `requireAuth(request)`. Returns `{ user: { id, email, name, role, hotelAccess }, org: { id, name, slug, logo } }`.

- [ ] **Step 5: Verify build**

Run: `npx next build 2>&1 | grep -E "✓|Error"`

---

### Task 4: Login and Register UI pages

**Files:**
- Create: `src/app/(auth)/layout.tsx`
- Create: `src/app/(auth)/login/page.tsx`
- Create: `src/app/(auth)/register/page.tsx`
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Create auth layout**

`src/app/(auth)/layout.tsx` — minimal layout. No sidebar, no topbar. Just a centered container on a gradient background (`linear-gradient(135deg, #f0eef5, #f8f7fa)`). Renders children centered vertically and horizontally with `min-h-screen flex items-center justify-center`.

- [ ] **Step 2: Create login page**

`src/app/(auth)/login/page.tsx` — "use client" component. Glassmorphism card (`glass-card-static` class, max-w-md). hotelCMS logo at top (gradient badge "H" + text). Email and password fields. "Sign In" button with loading state. Error message display. Link to `/register`. On submit: POST `/api/auth/login`, on success `router.push("/dashboard")`. Input styling matches dashboard theme.

- [ ] **Step 3: Create register page**

`src/app/(auth)/register/page.tsx` — "use client" component. Same glassmorphism card. Fields: Organization name, Your name, Email, Password, Confirm password. Client-side validation (passwords match, min 8 chars). On submit: POST `/api/auth/register`, on success `router.push("/dashboard")`. Link back to `/login`.

- [ ] **Step 4: Update root page redirect**

`src/app/page.tsx` — make it a server component that checks session: call `getSessionFromCookies()`. If session exists, `redirect("/dashboard")`. If not, `redirect("/login")`.

- [ ] **Step 5: Verify build**

Run: `npx next build 2>&1 | grep -E "✓|Error"`

---

### Task 5: Users API routes + seed data

**Files:**
- Create: `src/app/api/users/route.ts`
- Create: `src/app/api/users/[id]/route.ts`
- Modify: `prisma/seed/index.ts`

- [ ] **Step 1: Create users list + invite route**

`GET /api/users` — requireRole("admin"). Fetch all users in the admin's org. Return array of `{ id, email, name, role, hotelAccess, lastLoginAt, createdAt }`.

`POST /api/users` — requireRole("admin"). Accepts `{ email, name, role, hotelAccess }`. Generates a random 12-char temporary password. Hashes it. Creates user in the admin's org. Returns `{ user, temporaryPassword }` (password shown once to admin).

- [ ] **Step 2: Create user update + delete route**

`PUT /api/users/[id]` — requireRole("admin"). Accepts `{ role?, hotelAccess?, name? }`. Updates user. Validates user belongs to admin's org. Returns updated user.

`DELETE /api/users/[id]` — requireRole("admin"). Validates user belongs to admin's org. Prevents deleting yourself. Deletes user (cascades sessions). Returns `{ deleted: true }`.

- [ ] **Step 3: Update seed with default org + admin**

In `prisma/seed/index.ts`: after clearing data, before seeding hotels:
- Create Organization: name "Demo Hotel Group", slug "demo-hotel-group"
- Create admin User: email "admin@hotelcms.com", name "Admin", password "admin123" (hashed with bcryptjs), role admin, hotelAccess []
- Assign the seeded hotel's orgId to this organization
- Log: "Created org: Demo Hotel Group, admin: admin@hotelcms.com / admin123"

Add `organization` and `user` and `session` to the clear sequence at the top (after hotelContext, before schemaVersion).

- [ ] **Step 4: Re-seed and verify**

Run: `npx prisma db seed`

---

### Task 6: Dashboard auth integration

**Files:**
- Modify: `src/app/(dashboard)/layout.tsx`
- Modify: `src/components/sidebar-nav.tsx`
- Modify: `src/components/top-bar.tsx`

- [ ] **Step 1: Update dashboard layout to require auth**

In `src/app/(dashboard)/layout.tsx`: call `getSessionOrRedirect()` at the top. Pass `user` and `org` as props to `SidebarNav` and `TopBar` components. Since these are client components, serialize the data (plain objects, no Date instances).

- [ ] **Step 2: Update TopBar to show user info**

Read `src/components/top-bar.tsx` first. Change the hardcoded "Admin" text to show `user.name`. Add org name next to it. Replace the static avatar "A" with user's initial. Add a logout button (POST `/api/auth/logout`, then `router.push("/login")`). Accept `user` and `org` as props.

- [ ] **Step 3: Update Sidebar to show Team link for admins**

Read `src/components/sidebar-nav.tsx` first. Accept `user` prop. If `user.role === "admin"`, show a Team nav icon (people icon) linking to `/team`. Show org logo if `org.logo` is set.

- [ ] **Step 4: Verify build**

Run: `npx next build 2>&1 | grep -E "✓|Error"`

---

### Task 7: Protect existing API routes

**Files:**
- Modify: All API route files under `src/app/api/`

- [ ] **Step 1: Protect hotel routes**

`src/app/api/hotels/route.ts`:
- GET: add `requireAuth`. Filter results by `user.orgId` and `hotelAccess`.
- POST: add `requireRole("admin")`. Set `orgId` to `user.orgId` on the created hotel.

`src/app/api/hotels/[id]/route.ts`:
- GET: add `requireHotelAccess(id)`.
- PUT: add `requireHotelAccess(id)` + check role >= editor.
- DELETE: add `requireHotelAccess(id)` + check role === admin.

`src/app/api/hotels/[id]/theme/route.ts`:
- GET: add `requireHotelAccess(id)`.
- PUT: add `requireHotelAccess(id)` + role >= editor.

- [ ] **Step 2: Protect page, section, room, media routes**

For each of these route files, add auth at the top of each handler. For resources that belong to a hotel (pages→hotelId, sections→page→hotelId, rooms→hotelId, media→hotelId), resolve the hotelId first then call `requireHotelAccess`. Write operations require role >= editor.

Files: `api/pages/route.ts`, `api/pages/[id]/route.ts`, `api/sections/route.ts`, `api/sections/[id]/route.ts`, `api/sections/[id]/reorder/route.ts`, `api/rooms/route.ts`, `api/rooms/[id]/route.ts`, `api/media/route.ts`, `api/media/[id]/route.ts`, `api/media/upload/route.ts`.

- [ ] **Step 3: Protect version and AI routes**

`api/versions/route.ts`, `api/versions/[id]/route.ts`: requireAuth + requireHotelAccess.
`api/versions/[id]/publish,reject,rollback/route.ts`: requireRole("editor") + requireHotelAccess.
`api/ai/classify/route.ts`, `api/ai/execute/route.ts`: requireAuth + requireHotelAccess(hotelId from body).

- [ ] **Step 4: Verify build**

Run: `npx next build 2>&1 | grep -E "✓|Error"`

---

### Task 8: Team management page + invite modal

**Files:**
- Create: `src/app/(dashboard)/team/page.tsx`
- Create: `src/components/cms/InviteUserModal.tsx`

- [ ] **Step 1: Create Team page**

`src/app/(dashboard)/team/page.tsx` — server component with `export const dynamic = "force-dynamic"`. Calls `getSessionOrRedirect()`, checks role is admin (redirect to /dashboard if not). Fetches all users in org via Prisma. Fetches all hotels in org for the invite modal. Renders user list with: name, email, role badge (admin=coral, editor=purple, viewer=blue), hotel access count, last login relative time. Passes serialized data to a client wrapper for interactive actions. "Invite User" button opens InviteUserModal.

- [ ] **Step 2: Create InviteUserModal**

`src/components/cms/InviteUserModal.tsx` — "use client" modal. Props: `{ hotels: Array<{id, name}>, onClose, onInvited }`. Form fields: email, name, role (select: editor/viewer — can't invite admins), hotel access (multi-select checkboxes of available hotels). On submit: POST `/api/users`. On success: show the temporary password in a highlighted box ("Share this password with the user — it won't be shown again"). Copy-to-clipboard button. Close dismisses.

Also add inline edit/delete per user row in the team page — edit role via dropdown, edit hotel access via popover, delete with confirmation. All call PUT/DELETE `/api/users/[id]`.

- [ ] **Step 3: Verify build and full flow test**

Run: `npx next build 2>&1 | grep -E "✓|Error"`

Manual test: Register → create hotel → invite editor → logout → login as editor → verify can only see assigned hotels → verify cannot delete hotels or access team page.

---
