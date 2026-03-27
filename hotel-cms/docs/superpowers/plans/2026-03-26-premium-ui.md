# Premium UI Upgrade Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix scroll blocking in page builder, upgrade dashboard visuals to glassmorphism, and replace sidebar with icon-only rail for faster navigation.

**Architecture:** Three independent UI changes. Task 1 updates globals.css with glass utility classes. Task 2 rewrites the sidebar to icon rail. Task 3 rewrites the page builder layout with command bar + floating panels. Tasks 4-5 apply glassmorphism to dashboard pages.

**Tech Stack:** Next.js 16 App Router, Tailwind CSS, React client components, Prisma for sidebar hotel data.

---

### Task 1: Add glassmorphism CSS utilities and gradient background to globals.css

**Files:**
- Modify: `src/app/globals.css`

- [ ] **Step 1: Update globals.css with glass utilities and gradient body background**

Replace the entire file content with:

```css
@import "tailwindcss";

:root {
  --background: #f8f7fa;
  --foreground: #1a1a2e;
  --card: #ffffff;
  --elevated: #f0eef5;
  --border: #e2dfe8;
  --muted: #7c7893;
  --accent-coral: #e85d45;
  --accent-teal: #0fa886;
  --accent-purple: #7c5cbf;
  --accent-amber: #d49a12;
  --accent-blue: #3b7dd8;
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-elevated: var(--elevated);
  --color-border: var(--border);
  --color-muted: var(--muted);
  --color-coral: var(--accent-coral);
  --color-teal: var(--accent-teal);
  --color-purple: var(--accent-purple);
  --color-amber: var(--accent-amber);
  --color-blue: var(--accent-blue);
  --font-sans: var(--font-geist-sans);
  --font-mono: var(--font-geist-mono);
}

body {
  background: linear-gradient(135deg, #f0eef5, #f8f7fa);
  color: var(--foreground);
  font-family: var(--font-sans), system-ui, -apple-system, sans-serif;
}

* {
  scrollbar-width: thin;
  scrollbar-color: var(--elevated) transparent;
}

/* Glass card utility */
.glass-card {
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.5);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04);
  border-radius: 12px;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.glass-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
}

/* Glass card without hover lift (for static containers) */
.glass-card-static {
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.5);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04);
  border-radius: 12px;
}

/* Floating panel (for logs/diff overlays) */
.floating-panel {
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.6);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  border-radius: 12px;
}
```

- [ ] **Step 2: Verify build**

Run: `npx next build 2>&1 | grep -E "✓|Error"`
Expected: `✓ Compiled successfully`

---

### Task 2: Rewrite sidebar as icon-only rail

**Files:**
- Rewrite: `src/components/sidebar-nav.tsx`
- Modify: `src/app/(dashboard)/layout.tsx`

- [ ] **Step 1: Rewrite sidebar-nav.tsx as icon rail**

Complete rewrite. The sidebar becomes a 56px (w-14) icon-only rail with:
- Gradient logo badge at top (32px)
- 4 nav icons: Dashboard, Hotels, Components, AI (36px each, tooltip on hover)
- Flex spacer
- Hotel avatars fetched from DB via `/api/hotels` (first 5, gradient badges, click navigates)
- User avatar at bottom

The component is "use client". Uses `usePathname()` for active state, `useRouter()` for navigation, `useState` + `useEffect` for fetching hotels. Tooltip implemented as a `group-hover` visible `<span>` positioned to the right of each icon.

- [ ] **Step 2: Update dashboard layout for narrower sidebar**

In `src/app/(dashboard)/layout.tsx`, the sidebar width is now handled inside the sidebar component itself (w-14). Remove the `bg-[#f8f7fa]` from the outer div since body now has the gradient background. Change to:

```tsx
<div className="flex h-screen overflow-hidden">
  <SidebarNav />
  <div className="flex flex-col flex-1 overflow-hidden">
    <TopBar />
    <main className="flex-1 overflow-y-auto p-6">{children}</main>
  </div>
</div>
```

- [ ] **Step 3: Verify build and test navigation**

Run: `npx next build 2>&1 | grep -E "✓|Error"`
Then manually test: hover tooltips, click hotel avatars navigate correctly, active states work.

---

### Task 3: Rewrite page builder with ⌘K command bar + floating panels

**Files:**
- Rewrite: `src/components/cms/PageBuilder.tsx`
- Rewrite: `src/components/cms/AIActionBar.tsx`

This is the biggest task. Two components are rewritten.

- [ ] **Step 1: Rewrite AIActionBar.tsx as inline command bar + floating panels**

The component splits into three visual parts:
1. **Inline command input** — rendered directly in the PageBuilder toolbar (not as a separate bar). Returns JSX for the input + buttons portion only.
2. **FloatingLogs** — `position: absolute; bottom: 12px; right: 12px;` inside preview container. Uses `floating-panel` CSS class. Max-height 40%. Close button. Auto-scrolls.
3. **FloatingDiff** — `position: absolute; bottom: 12px; left: 12px;` inside preview container. Same styling. Shows git-diff entries.

The component exports: `AICommandInput` (inline in toolbar), `FloatingLogs` (overlay in preview), `FloatingDiff` (overlay in preview). Parent PageBuilder renders each in the right location.

Props remain the same: `hotelId, pageId?, sectionId?, onActionApplied?`. State is managed in the parent PageBuilder and passed down.

- [ ] **Step 2: Rewrite PageBuilder.tsx with new layout structure**

New layout:
```
<div className="flex flex-col h-full overflow-hidden">
  {/* Toolbar */}
  <div className="shrink-0 flex items-center gap-3 px-4 py-2.5 bg-white/80 backdrop-blur border-b border-white/50 z-10">
    <back-button>
    <page-info>
    <spacer flex-1>
    <AICommandInput />   ← the ⌘K input
    <add-section-btn>
    <save-btn>
  </div>

  {/* Main panels */}
  <div className="flex flex-1 overflow-hidden">
    {/* Left: Sections (w-60) */}
    <div className="w-60 shrink-0 bg-white/60 backdrop-blur border-r ...">
      ...section list...
    </div>

    {/* Center: Preview (flex-1, relative for floating panels) */}
    <div className="flex-1 flex flex-col relative">
      <div className="shrink-0 px-3 py-1.5 bg-white/60 border-b text-xs">
        URL bar
      </div>
      <div className="flex-1 relative">
        <iframe className="absolute inset-0 w-full h-full" />
        <FloatingLogs />   ← absolute bottom-right
        <FloatingDiff />   ← absolute bottom-left
      </div>
    </div>

    {/* Right: Section Editor (conditional) */}
    {selectedSection && <div className="w-80 shrink-0 ..."><SectionEditor /></div>}
  </div>
</div>
```

Key changes:
- Remove `-m-6` margin hack
- Remove the separate AI bar and version timeline stacked sections
- AI command input is part of the toolbar row
- Logs and diff float over the preview as absolute-positioned panels
- Add `useEffect` for ⌘K keyboard shortcut (focuses the AI input ref)
- Sections list narrowed from w-72 to w-60
- Apply glassmorphism to toolbar and sections panel

- [ ] **Step 3: Verify build**

Run: `npx next build 2>&1 | grep -E "✓|Error"`
Expected: `✓ Compiled successfully`

---

### Task 4: Apply glassmorphism to dashboard home page

**Files:**
- Modify: `src/app/(dashboard)/dashboard/page.tsx`

- [ ] **Step 1: Upgrade stat cards to glassmorphism**

Replace the current stat card `bg-[#ffffff] border border-[#e2dfe8] rounded-xl` pattern with `glass-card` class. Add gradient icon badges with emoji icons. Update number styling to `text-2xl font-bold tracking-tight`. Each stat card gets a unique gradient tint on its icon badge.

- [ ] **Step 2: Upgrade hotel cards and quick action cards**

Replace hotel card styling with `glass-card` class. Add gradient avatar badges (`linear-gradient(135deg, color1, color2)`) with glow shadow. Update quick action cards with glassmorphism.

- [ ] **Step 3: Verify build**

Run: `npx next build 2>&1 | grep -E "✓|Error"`

---

### Task 5: Apply glassmorphism to hotels list and hotel detail pages

**Files:**
- Modify: `src/app/(dashboard)/hotels/page.tsx`
- Modify: `src/app/(dashboard)/hotels/[id]/page.tsx`

- [ ] **Step 1: Upgrade hotels list page cards**

Replace hotel card `bg-[#ffffff] border border-[#e2dfe8]` with `glass-card`. Add gradient avatar badges. Update the header button to use gradient background.

- [ ] **Step 2: Upgrade hotel detail page**

Replace the hotel header card and tab container card with `glass-card-static` (no hover lift on static containers). Update the stats row styling. Apply gradient avatar badge for the hotel initial.

- [ ] **Step 3: Verify full build**

Run: `npx next build 2>&1 | grep -E "✓|Error"`
Expected: `✓ Compiled successfully`

---
