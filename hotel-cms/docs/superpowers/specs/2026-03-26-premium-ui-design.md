# Premium UI Upgrade — Design Spec

**Goal:** Fix scroll blocking, improve findability, and upgrade visual polish to premium SaaS level.

**Decisions made during brainstorming:**
- Page Builder: Command Bar (⌘K) + Floating Panels (Option C)
- Visual Style: Glassmorphism + Gradients (Option C)
- Sidebar: Icon-Only Rail with hotel quick-switch (Option B)

---

## 1. Page Builder — Command Bar + Floating Panels

### Problem
AI bar + logs stack on top of the preview, stealing vertical space and blocking scroll.

### Solution

**⌘K Command Bar in Toolbar:**
- AI input field lives permanently in the page builder toolbar (right side, next to Add/Save buttons)
- Always visible, no toggle needed. Placeholder: `⌘K Ask AI to change anything...`
- Pressing ⌘K anywhere in page builder focuses the input
- Analyze/Execute/Cancel buttons appear inline when command is entered
- Tier badge appears next to input after classification

**Floating Logs Panel:**
- When AI executes, logs appear as a floating panel anchored bottom-right of the preview container
- `position: absolute; bottom: 12px; right: 12px; max-height: 40%; width: 320px;`
- White background, subtle shadow, rounded corners, close button
- Scrolls internally, never affects parent layout
- Auto-shows on execution, dismissible with X

**Floating Diff Panel:**
- After AI completes, diff appears as floating panel bottom-left of preview container
- `position: absolute; bottom: 12px; left: 12px; max-height: 40%; width: 360px;`
- Same styling as logs panel
- Shows git-diff-style changes (red/green)

**Layout structure change:**
```
<div class="flex flex-col h-full">
  <toolbar class="shrink-0">  ← breadcrumb + ⌘K input + buttons
  <div class="flex flex-1 overflow-hidden">
    <sections-list class="w-60 shrink-0">  ← narrower than current w-72
    <preview-container class="flex-1 relative">  ← iframe + floating panels
      <iframe class="absolute inset-0">
      <floating-logs class="absolute bottom-3 right-3">  ← overlay
      <floating-diff class="absolute bottom-3 left-3">  ← overlay
    </preview-container>
    <section-editor class="w-80 shrink-0">  ← slides in when section selected
  </div>
</div>
```

**Key fix:** Remove `-m-6` hack. Remove `shrink-0` from AI bar. Floating panels use `position: absolute` inside the `relative` preview container — they overlay, never push content.

### Files to modify
- `src/components/cms/PageBuilder.tsx` — restructure layout, move AI input to toolbar, add ⌘K handler
- `src/components/cms/AIActionBar.tsx` — rewrite as inline toolbar input + floating panels (no longer a stacked bar)

---

## 2. Visual Style — Glassmorphism + Gradients

### Cards (global)
```css
background: rgba(255, 255, 255, 0.7);
backdrop-filter: blur(12px);
border: 1px solid rgba(255, 255, 255, 0.5);
box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04);
border-radius: 12px;
```

Hover: `transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.08);`

### Stat cards
- Icon badge: 28px square with gradient-tinted background (`linear-gradient(135deg, accent30, accent10)`) + emoji icon
- Number: `text-2xl font-bold tracking-tight` (letter-spacing: -0.5px)
- Label: `text-xs font-medium text-muted uppercase`

### Avatar badges
- Gradient background: `linear-gradient(135deg, color1, color2)` unique per hotel
- Subtle glow: `box-shadow: 0 2px 8px rgba(accent, 0.3)`
- White text, bold, rounded-xl

### Page background
- Replace flat `#f8f7fa` with subtle gradient: `linear-gradient(135deg, #f0eef5, #f8f7fa)`
- Applied via `globals.css` body background

### Buttons
- Primary: Subtle gradient on accent colors
- Secondary: Glassmorphism (`rgba(255,255,255,0.6)` + `backdrop-filter: blur(8px)`)

### Files to modify
- `src/app/globals.css` — add glass card utility class, gradient background on body
- `src/app/(dashboard)/dashboard/page.tsx` — upgrade stat cards and hotel cards
- `src/app/(dashboard)/hotels/page.tsx` — upgrade hotel cards
- `src/app/(dashboard)/hotels/[id]/page.tsx` — upgrade detail cards
- All modal components — apply glass card styling

---

## 3. Sidebar — Icon-Only Rail

### Structure
56px wide icon rail, always visible (no expand/collapse).

```
<aside class="w-14 shrink-0 flex flex-col items-center py-3 bg-white border-r">
  <logo-icon>          ← gradient badge, 32px
  <spacer h-4>
  <nav-icon Dashboard>  ← 36px square, tooltip on hover
  <nav-icon Hotels>
  <nav-icon Components>
  <nav-icon AI>
  <flex-spacer>
  <separator>
  <hotel-avatar T>     ← 28px gradient badge, click → /hotels/[id]
  <hotel-avatar S>
  <separator>
  <user-avatar A>      ← 28px, bottom
</aside>
```

### Behavior
- Hover any icon: tooltip appears to the right with label
- Active icon: tinted background + accent color
- Hotel avatars: fetched from DB (show first 5 hotels), gradient badges with first letter
- Click hotel avatar → navigates to `/hotels/[id]`
- Click user avatar → future: settings dropdown (for now, just visual)

### Navigation improvement
- Eliminates going through Hotels list page to find a hotel — direct jump from sidebar
- 2 fewer clicks for the most common workflow (editing a hotel's pages)

### Files to modify
- `src/components/sidebar-nav.tsx` — complete rewrite to icon rail
- `src/app/(dashboard)/layout.tsx` — adjust layout for narrower sidebar (w-14 instead of w-56)

---

## Out of Scope
- Dark mode toggle
- Mobile responsive layout
- Animation system / micro-interactions
- Skeleton loading states
- Accessibility improvements (ARIA, keyboard nav)

These are valuable but not part of this focused upgrade.
