# Auth + Multi-Tenancy — Design Spec

**Goal:** Add organization-based authentication and multi-tenancy so multiple hotel chains can use the CMS with role-based access control per property.

**Target user:** Hotel management companies managing 5-50 properties. B2B SaaS at $99/month.

**Decisions:**
- Simple API key auth (email + password, no OAuth) — upgrade to Clerk/Auth0 later
- Org → Hotels + Users with role (admin/editor/viewer) + hotel access list
- No email sending — admin shares credentials directly (B2B, small teams)

---

## 1. Data Model

### New Prisma models

```prisma
model Organization {
  id              String   @id @default(uuid())
  name            String
  slug            String   @unique
  apiKey          String   @unique @default(uuid()) @map("api_key")
  logo            String?
  brandGuidelines String?  @map("brand_guidelines")
  createdAt       DateTime @default(now()) @map("created_at")

  users  User[]
  hotels Hotel[]

  @@map("organizations")
}

model User {
  id           String    @id @default(uuid())
  orgId        String    @map("org_id")
  email        String    @unique
  name         String
  passwordHash String    @map("password_hash")
  role         UserRole  @default(editor)
  hotelAccess  Json      @default("[]") @map("hotel_access") // array of hotel IDs, [] = all for admins
  lastLoginAt  DateTime? @map("last_login_at")
  createdAt    DateTime  @default(now()) @map("created_at")

  org      Organization @relation(fields: [orgId], references: [id], onDelete: Cascade)
  sessions Session[]

  @@map("users")
}

model Session {
  id        String   @id @default(uuid())
  userId    String   @map("user_id")
  token     String   @unique
  expiresAt DateTime @map("expires_at")
  createdAt DateTime @default(now()) @map("created_at")

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("sessions")
}

enum UserRole {
  admin
  editor
  viewer
}
```

### Modified model

Hotel gets a new field:
```prisma
model Hotel {
  // ... existing fields ...
  orgId String? @map("org_id")
  org   Organization? @relation(fields: [orgId], references: [id])
}
```

`orgId` is nullable for backward compatibility with existing seeded data.

### Role behavior

- **admin** — Full access to all hotels in org. Can create/delete hotels, manage users, manage billing.
- **editor** — Edit content on assigned hotels (pages, sections, rooms, media, theme, AI prompts). Cannot delete hotels or manage users.
- **viewer** — Read-only access to assigned hotels. Can view preview and version history. Cannot edit.

### hotelAccess field

JSON array of hotel UUIDs. Semantics:
- `[]` (empty array) — admin: all hotels. editor/viewer: no hotels (must be assigned).
- `["uuid1", "uuid2"]` — user can access only these hotels.

---

## 2. Auth Flow

### Registration

`POST /api/auth/register`

Accepts: `{ orgName, email, password, name }`

1. Hash password with bcrypt (12 rounds)
2. Generate org slug from name (lowercase, hyphenated)
3. Create Organization
4. Create User with role=admin, hotelAccess=[]
5. Create Session with random UUID token, 30-day expiry
6. Set httpOnly cookie `hotelcms_session` with token
7. Return `{ user, org, token }`

### Login

`POST /api/auth/login`

Accepts: `{ email, password }`

1. Find user by email (include org)
2. Verify password with bcrypt.compare
3. Create Session, set cookie
4. Update user.lastLoginAt
5. Return `{ user, org, token }`

### Session helper

`src/lib/auth.ts`:

```typescript
async function getSession(request): Promise<{ user, org } | null>
// Reads cookie, looks up session, checks expiry, returns user+org or null

async function requireAuth(request): Promise<{ user, org }>
// Calls getSession, returns 401 if null

async function requireRole(request, minRole: "admin" | "editor" | "viewer"): Promise<{ user, org }>
// Calls requireAuth, checks role hierarchy (admin > editor > viewer), returns 403 if insufficient

async function requireHotelAccess(request, hotelId: string): Promise<{ user, org }>
// Calls requireAuth, checks hotel belongs to user's org, checks hotelAccess list (or admin), returns 403 if denied
```

For server components (dashboard pages):
```typescript
async function getSessionFromCookies(): Promise<{ user, org } | null>
// Reads cookies() from next/headers, same logic

async function getSessionOrRedirect(): Promise<{ user, org }>
// Calls getSessionFromCookies, redirects to /login if null
```

### Logout

`POST /api/auth/logout`
- Delete session record
- Clear cookie
- Return 200

### Password hashing

Use bcryptjs (pure JS, no native deps): `npm install bcryptjs @types/bcryptjs`

---

## 3. Protecting Existing Routes

### API routes

Every existing route gets auth at the top of its handler:

| Route | Auth requirement |
|-------|-----------------|
| `POST /api/hotels` | requireRole("admin") |
| `GET /api/hotels` | requireAuth, filter by org + hotelAccess |
| `GET/PUT/DELETE /api/hotels/[id]` | requireHotelAccess(id). DELETE requires admin. |
| `GET/PUT /api/hotels/[id]/theme` | requireHotelAccess(id). PUT requires editor+. |
| `GET/POST /api/pages` | requireAuth. POST requires editor+ on the page's hotel. |
| `GET/PUT/DELETE /api/pages/[id]` | requireHotelAccess (resolved from page→hotel). Writes require editor+. |
| `POST /api/sections`, `GET/PUT/DELETE /api/sections/[id]` | requireHotelAccess (resolved from section→page→hotel). Writes require editor+. |
| `POST /api/rooms`, `GET/PUT/DELETE /api/rooms/[id]` | requireHotelAccess. Writes require editor+. |
| `GET/POST /api/media`, `GET/PUT/DELETE /api/media/[id]`, `POST /api/media/upload` | requireHotelAccess. Writes require editor+. |
| `GET /api/versions`, `GET /api/versions/[id]` | requireHotelAccess. |
| `POST /api/versions/[id]/publish,reject,rollback` | requireRole("editor") + requireHotelAccess. |
| `POST /api/ai/classify`, `POST /api/ai/execute` | requireAuth + requireHotelAccess(hotelId in body). |
| `POST /api/auth/register,login` | Public (no auth). |
| `POST /api/auth/logout` | requireAuth. |

### Dashboard pages

All `(dashboard)` layout and pages call `getSessionOrRedirect()` at the top. User/org data passed to client components for conditional rendering.

Preview routes (`/preview/[hotelId]/[pageSlug]`) remain public — these are the hotel's public website.

---

## 4. Login / Register UI

### New pages (outside dashboard layout)

**`/login`** — `src/app/(auth)/login/page.tsx`
- Centered glassmorphism card on gradient background
- hotelCMS logo, email + password fields, "Sign In" button
- Error message display
- Link to /register
- On success: redirect to /dashboard

**`/register`** — `src/app/(auth)/register/page.tsx`
- Organization name, your name, email, password, confirm password
- "Create Organization" button
- On success: auto-login, redirect to /dashboard

**`src/app/(auth)/layout.tsx`** — minimal layout with centered content, no sidebar

### Dashboard changes

- **Top bar**: Shows user name + org name (currently hardcoded "Admin")
- **Sidebar**: Shows org logo if set. New "Team" icon (admin only).
- **Root redirect**: `src/app/page.tsx` checks session — if logged in go to /dashboard, if not go to /login

### Team management page (admin only)

**`/team`** — `src/app/(dashboard)/team/page.tsx`
- List of users in the org: name, email, role badge, hotel access count, last login
- "Invite User" button → modal with: email, name, role select, hotel multi-select
- Creates user with temporary password (displayed once in a modal)
- Edit user: change role, update hotel access
- Remove user (with confirmation)

---

## 5. Files to Create / Modify

### New files
- `src/lib/auth.ts` — getSession, requireAuth, requireRole, requireHotelAccess, getSessionOrRedirect
- `src/app/api/auth/register/route.ts`
- `src/app/api/auth/login/route.ts`
- `src/app/api/auth/logout/route.ts`
- `src/app/api/auth/me/route.ts` — GET current user+org
- `src/app/api/users/route.ts` — GET (list org users), POST (invite user)
- `src/app/api/users/[id]/route.ts` — PUT (update role/access), DELETE (remove user)
- `src/app/(auth)/layout.tsx`
- `src/app/(auth)/login/page.tsx`
- `src/app/(auth)/register/page.tsx`
- `src/app/(dashboard)/team/page.tsx`
- `src/components/cms/InviteUserModal.tsx`

### Modified files
- `prisma/schema.prisma` — add Organization, User, Session, UserRole + orgId on Hotel
- `prisma/seed/index.ts` — seed a default org + admin user
- `src/app/(dashboard)/layout.tsx` — call getSessionOrRedirect, pass user to sidebar/topbar
- `src/components/sidebar-nav.tsx` — show Team icon for admins, org logo
- `src/components/top-bar.tsx` — show user name + org name, logout button
- `src/app/page.tsx` — session check, redirect to /dashboard or /login
- All API route files — add auth checks at top of each handler

---

## Out of Scope
- OAuth / social login (upgrade path to Clerk/Auth0 later)
- Email sending (invite emails, forgot password)
- MFA / 2FA
- Billing / subscription tiers
- Audit log (who changed what)
- API key auth for external integrations (org.apiKey exists but not used yet)
