# Apple-Refined UI Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the Hotel CMS to use desktop width effectively with Apple-like typography, spacing, card refinements, and adaptive per-page layouts.

**Architecture:** CSS-only changes to globals.css for card styling, then class-level changes across page components for typography, spacing, widths, and grid columns. Dashboard gets a layout restructure (stats row + full-width grid + action queue below).

**Tech Stack:** Tailwind CSS utility classes, CSS custom properties.

---

### Task 1: Global CSS + layout foundation

**Files:**
- Modify: `src/app/globals.css`
- Modify: `src/app/(dashboard)/layout.tsx`
- Modify: `src/components/top-bar.tsx`

- [ ] **Step 1: Update glass card styles in globals.css**

Read `src/app/globals.css`. Make these changes:

Change `.glass-card`:
```
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04);
  border-radius: 12px;
```
To:
```
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04), 0 0 1px rgba(0, 0, 0, 0.06);
  border-radius: 16px;
```

Change `.glass-card:hover`:
```
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
```
To:
```
  transform: translateY(-3px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.06), 0 0 1px rgba(0, 0, 0, 0.08);
```

Change `.glass-card-static`:
```
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04);
  border-radius: 12px;
```
To:
```
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04), 0 0 1px rgba(0, 0, 0, 0.06);
  border-radius: 16px;
```

- [ ] **Step 2: Update dashboard layout padding**

Read `src/app/(dashboard)/layout.tsx`. Change:
```
<main className="flex-1 overflow-y-auto p-6">{children}</main>
```
To:
```
<main className="flex-1 overflow-y-auto p-8">{children}</main>
```

- [ ] **Step 3: Update top bar height and typography**

Read `src/components/top-bar.tsx`. Change:
```
<header className="flex items-center justify-between h-14 px-6 border-b border-[#e2dfe8] bg-[#ffffff] shrink-0">
  <h1 className="text-sm font-semibold text-[#1a1a2e]">{title}</h1>
```
To:
```
<header className="flex items-center justify-between h-12 px-8 border-b border-[#e2dfe8] bg-[#ffffff] shrink-0">
  <h1 className="text-lg font-semibold tracking-tight text-[#1a1a2e]">{title}</h1>
```

- [ ] **Step 4: Verify build**

Run: `cd /home/vishesh/personal/cms/hotel-cms && npx next build 2>&1 | tail -5`

---

### Task 2: Sidebar + input + button refinements

**Files:**
- Modify: `src/components/sidebar-nav.tsx`
- Modify: `src/app/(auth)/login/page.tsx`
- Modify: `src/app/(auth)/register/page.tsx`

- [ ] **Step 1: Update sidebar icon border-radius**

Read `src/components/sidebar-nav.tsx`. Find all instances of `w-9 h-9 rounded-lg` in nav item classNames. Replace `rounded-lg` with `rounded-xl` in every occurrence. There are 4 instances (main nav items loop, team link, campaigns link, brand link).

Use replace_all to change all `w-9 h-9 rounded-lg` to `w-9 h-9 rounded-xl`.

- [ ] **Step 2: Update login page inputs and button**

Read `src/app/(auth)/login/page.tsx`. Make these changes:

Change all input classNames from:
```
className="bg-[#f8f7fa] border border-[#e2dfe8] focus:border-[#7c5cbf] rounded-lg px-4 py-2.5 text-sm outline-none transition-colors"
```
To:
```
className="bg-[#f8f7fa] border border-[#e2dfe8] focus:border-[#7c5cbf] focus:ring-2 focus:ring-[#7c5cbf]/20 rounded-xl px-4 py-2.5 text-sm outline-none transition-all"
```

Change the submit button className from:
```
className="w-full py-2.5 rounded-lg text-sm font-semibold text-white flex items-center justify-center gap-2 transition-opacity disabled:opacity-70"
```
To:
```
className="w-full py-2.5 rounded-xl text-sm font-semibold tracking-wide text-white flex items-center justify-center gap-2 transition-opacity disabled:opacity-70"
```

- [ ] **Step 3: Update register page inputs and button**

Read `src/app/(auth)/register/page.tsx`. Apply the exact same input and button changes as Step 2:

Change all input classNames from:
```
className="bg-[#f8f7fa] border border-[#e2dfe8] focus:border-[#7c5cbf] rounded-lg px-4 py-2.5 text-sm outline-none transition-colors"
```
To:
```
className="bg-[#f8f7fa] border border-[#e2dfe8] focus:border-[#7c5cbf] focus:ring-2 focus:ring-[#7c5cbf]/20 rounded-xl px-4 py-2.5 text-sm outline-none transition-all"
```

Change the submit button className from:
```
className="w-full py-2.5 rounded-lg text-sm font-semibold text-white flex items-center justify-center gap-2 transition-opacity disabled:opacity-70"
```
To:
```
className="w-full py-2.5 rounded-xl text-sm font-semibold tracking-wide text-white flex items-center justify-center gap-2 transition-opacity disabled:opacity-70"
```

- [ ] **Step 4: Verify build**

Run: `npx next build 2>&1 | tail -5`

---

### Task 3: Dashboard layout redesign

**Files:**
- Modify: `src/app/(dashboard)/dashboard/page.tsx`

- [ ] **Step 1: Update container and stats section**

Read `src/app/(dashboard)/dashboard/page.tsx`. Change the outermost container from:
```
<div className="space-y-6 max-w-7xl">
```
To:
```
<div className="space-y-8 max-w-[1600px]">
```

Find the org overview bar. It's a `glass-card-static p-5 flex flex-wrap items-center justify-between gap-4 animate-in` div. Replace the entire stats section with a 3-column grid of stat cards. Change:
```
className="glass-card-static p-5 flex flex-wrap items-center justify-between gap-4 animate-in"
```
To:
```
className="grid grid-cols-3 gap-5 animate-in"
```

The inner content needs restructuring too. Find the org name/stats block and restructure it into 3 separate `glass-card-static` cards. The exact inner JSX will depend on the file — read carefully and split the inline stats (properties count, avg grade, actions count) into individual cards, each with `glass-card-static p-5 flex items-center gap-4`.

- [ ] **Step 2: Update property grid to 3 columns**

Find the property grid:
```
<div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
```
Change to:
```
<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
```

Update the Properties heading typography:
```
<h2 className="text-sm font-semibold text-[#1a1a2e] mb-3 animate-in animate-in-delay-1">
```
To:
```
<h2 className="text-xl font-semibold tracking-tight text-[#1a1a2e] mb-4 animate-in animate-in-delay-1">
```

Update hotel card padding from `p-4` to `p-5` in the card className.

- [ ] **Step 3: Move Action Queue below properties as full-width section**

Find the two-column flex layout:
```
<div className="flex flex-col lg:flex-row gap-6">
```
Change to:
```
<div className="space-y-8">
```

Remove the left column wrapper:
```
<div className="flex-1 min-w-0">
```
Remove this wrapper entirely (keep its children).

Find the right column Action Queue wrapper:
```
<div className="w-full lg:w-80 shrink-0 animate-in animate-in-delay-2">
  <div className="lg:sticky lg:top-6">
```
Change to:
```
<div className="animate-in animate-in-delay-2">
  <div>
```

Update the Action Queue heading:
```
<h2 className="text-sm font-semibold text-[#1a1a2e] mb-3 flex items-center justify-between">
```
To:
```
<h2 className="text-xl font-semibold tracking-tight text-[#1a1a2e] mb-4 flex items-center justify-between">
```

Find where action items are rendered in a vertical list. If they're in a `space-y-` container, change to a grid:
```
grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3
```

- [ ] **Step 4: Verify build**

Run: `npx next build 2>&1 | tail -5`

---

### Task 4: Hotel detail two-column layout

**Files:**
- Modify: `src/app/(dashboard)/hotels/[id]/page.tsx`

- [ ] **Step 1: Update container width and heading typography**

Read `src/app/(dashboard)/hotels/[id]/page.tsx`. Change the outermost container:
```
<div className="space-y-6 max-w-5xl">
```
To:
```
<div className="space-y-8 max-w-6xl">
```

- [ ] **Step 2: Create two-column layout below header**

Find the Smart Links section and the Tabs section (they're consecutive `glass-card-static` divs after the hotel header card). Wrap them in a two-column flex container.

Before the Smart Links div, add an opening wrapper:
```tsx
<div className="flex flex-col lg:flex-row gap-6">
  <div className="flex-[3] min-w-0 space-y-6">
```

After the Tabs section closing div, close the left column and add the right column transition. Move the Smart Links section into the right column.

The final structure should be:
```tsx
{/* Two-column layout */}
<div className="flex flex-col lg:flex-row gap-6">
  {/* Left: Pages + Tabs (primary workspace) */}
  <div className="flex-[3] min-w-0">
    <div className="glass-card-static rounded-xl overflow-hidden animate-in animate-in-delay-3">
      {/* Tab nav + pages content */}
    </div>
  </div>

  {/* Right: Smart Links (reference panel) */}
  <div className="flex-[2]">
    <div className="glass-card-static rounded-xl overflow-hidden animate-in animate-in-delay-2 lg:sticky lg:top-8">
      {/* Smart Links content */}
    </div>
  </div>
</div>
```

- [ ] **Step 3: Enlarge hotel avatar and heading**

Find the hotel avatar (likely `w-11 h-11`). Change to `w-14 h-14`. Update the font size on the avatar initial letter accordingly.

Find the hotel name heading (likely `text-lg font-bold`). Change to `text-2xl font-semibold tracking-tight`.

- [ ] **Step 4: Verify build**

Run: `npx next build 2>&1 | tail -5`

---

### Task 5: Hotels list + campaigns + components — wider layouts

**Files:**
- Modify: `src/app/(dashboard)/hotels/page.tsx`
- Modify: `src/app/(dashboard)/campaigns/page.tsx`
- Modify: `src/app/(dashboard)/components/page.tsx`

- [ ] **Step 1: Update hotels list**

Read `src/app/(dashboard)/hotels/page.tsx`. Change:

Container:
```
<div className="space-y-6 max-w-6xl">
```
To:
```
<div className="space-y-8 max-w-[1600px]">
```

Grid:
```
<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
```
To:
```
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
```

- [ ] **Step 2: Update campaigns**

Read `src/app/(dashboard)/campaigns/page.tsx`. Change:

Container:
```
<div className="space-y-6 max-w-4xl">
```
To:
```
<div className="space-y-8 max-w-6xl">
```

Campaign grid (currently single column):
```
<div className="grid grid-cols-1 gap-4">
```
To:
```
<div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
```

- [ ] **Step 3: Update components**

Read `src/app/(dashboard)/components/page.tsx`. Change:

Container:
```
<div className="space-y-8 max-w-5xl">
```
To:
```
<div className="space-y-8 max-w-[1600px]">
```

Page heading:
```
<h1 className="text-xl font-semibold text-[#1a1a2e]">
```
To:
```
<h1 className="text-2xl font-semibold tracking-tight text-[#1a1a2e]">
```

Component grid:
```
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
```
To:
```
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
```

- [ ] **Step 4: Verify build**

Run: `npx next build 2>&1 | tail -5`

---

### Task 6: Brand + team typography refinements

**Files:**
- Modify: `src/app/(dashboard)/brand/page.tsx` (or its client component `BrandPageClient.tsx`)
- Modify: `src/app/(dashboard)/team/page.tsx` (or its client component `TeamManager.tsx`)

- [ ] **Step 1: Update brand page spacing**

Read the brand page file. Find the outermost container. Change `space-y-6` to `space-y-8` if present. Keep the existing max-width (it's a form page — don't widen it).

Find the "Brand Governance" heading. If it's `text-xl` or `text-lg`, change to `text-2xl font-semibold tracking-tight`.

- [ ] **Step 2: Update team page spacing**

Read the team page file. Find the outermost container. Change `space-y-6` to `space-y-8` if present.

Find the page heading. Update to `text-2xl font-semibold tracking-tight` if not already.

- [ ] **Step 3: Verify build**

Run: `npx next build 2>&1 | tail -5`

---
