# Smooth Animations Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add smooth, elegant CSS animations across the entire Hotel CMS — dashboard, modals, page builder, feedback, and public site — with zero new dependencies.

**Architecture:** CSS keyframes + utility classes in globals.css. Stagger delays via numbered classes. Scroll reveals via a tiny IntersectionObserver script. Toast notifications via a lightweight "use client" component with global event emitter.

**Tech Stack:** CSS keyframes, Tailwind utility classes, IntersectionObserver API.

---

### Task 1: Animation foundation — CSS tokens, keyframes, utility classes

**Files:**
- Modify: `src/app/globals.css`

- [ ] **Step 1: Add animation tokens and keyframes to globals.css**

Read `src/app/globals.css`. After the `.floating-panel` block (end of file), add:

```css
/* ─── Animation Tokens ─────────────────────────────────── */
:root {
  --duration-fast: 300ms;
  --duration-normal: 500ms;
  --duration-slow: 700ms;
  --easing-smooth: cubic-bezier(0.16, 1, 0.3, 1);
  --easing-bounce: cubic-bezier(0.34, 1.56, 0.64, 1);
}

/* ─── Keyframes ────────────────────────────────────────── */
@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes fade-slide-up {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes fade-slide-down {
  from { opacity: 0; transform: translateY(-12px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes scale-fade-in {
  from { opacity: 0; transform: scale(0.95); }
  to { opacity: 1; transform: scale(1); }
}

@keyframes scale-fade-out {
  from { opacity: 1; transform: scale(1); }
  to { opacity: 0; transform: scale(0.95); }
}

@keyframes slide-in-right {
  from { opacity: 0; transform: translateX(24px); }
  to { opacity: 1; transform: translateX(0); }
}

@keyframes slide-in-left {
  from { opacity: 0; transform: translateX(-24px); }
  to { opacity: 1; transform: translateX(0); }
}

@keyframes toast-in {
  from { opacity: 0; transform: translateY(-12px) scale(0.95); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

@keyframes toast-out {
  from { opacity: 1; transform: translateY(0) scale(1); }
  to { opacity: 0; transform: translateY(-8px) scale(0.95); }
}

/* ─── Animation Utility Classes ────────────────────────── */
.animate-in {
  animation: fade-slide-up var(--duration-normal) var(--easing-smooth) both;
}

.animate-in-delay-1 { animation-delay: 100ms; }
.animate-in-delay-2 { animation-delay: 200ms; }
.animate-in-delay-3 { animation-delay: 300ms; }
.animate-in-delay-4 { animation-delay: 400ms; }
.animate-in-delay-5 { animation-delay: 500ms; }

.animate-fade {
  animation: fade-in var(--duration-fast) var(--easing-smooth) both;
}

.animate-modal {
  animation: scale-fade-in var(--duration-normal) var(--easing-smooth) both;
}

.animate-modal-out {
  animation: scale-fade-out 200ms ease-in both;
}

.animate-slide-right {
  animation: slide-in-right 400ms var(--easing-smooth) both;
}

.animate-slide-left {
  animation: slide-in-left 400ms var(--easing-smooth) both;
}

/* Scroll reveal — hidden by default, visible when observer fires */
.animate-on-scroll {
  opacity: 0;
  transform: translateY(20px);
  transition: opacity var(--duration-slow) var(--easing-smooth),
              transform var(--duration-slow) var(--easing-smooth);
}

.animate-on-scroll.is-visible {
  opacity: 1;
  transform: translateY(0);
}

/* Stagger delays for scroll-triggered children */
.stagger-1 { transition-delay: 100ms; }
.stagger-2 { transition-delay: 200ms; }
.stagger-3 { transition-delay: 300ms; }
.stagger-4 { transition-delay: 400ms; }
.stagger-5 { transition-delay: 500ms; }

/* ─── Reduced Motion ───────────────────────────────────── */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
  .animate-on-scroll {
    opacity: 1;
    transform: none;
  }
}
```

- [ ] **Step 2: Verify build**

Run: `npx next build 2>&1 | tail -5`

Expected: Build succeeds without errors.

---

### Task 2: CMS dashboard & pages — staggered entrance animations

**Files:**
- Modify: `src/app/(dashboard)/dashboard/page.tsx`
- Modify: `src/app/(dashboard)/hotels/page.tsx`
- Modify: `src/app/(dashboard)/hotels/[id]/page.tsx`
- Modify: `src/app/(dashboard)/brand/page.tsx`
- Modify: `src/app/(dashboard)/campaigns/page.tsx`
- Modify: `src/app/(dashboard)/team/page.tsx`
- Modify: `src/app/(dashboard)/components/page.tsx`

- [ ] **Step 1: Animate dashboard page**

Read `src/app/(dashboard)/dashboard/page.tsx`. Find the main content wrapper. The page has:
1. An org stats summary section (the first `glass-card-static` block)
2. A "Properties" heading + grid of hotel cards
3. An "Action Queue" section

Make these changes to the JSX:

- On the org stats `glass-card-static` div: add `animate-in` class
- On the "Properties" heading wrapper: add `animate-in animate-in-delay-1` class
- On each hotel property card (inside the `.map()`): add `animate-in` class and compute delay with `animate-in-delay-${Math.min(index + 1, 5)}`
  - Use template literal in className: `className={\`glass-card ... animate-in animate-in-delay-${Math.min(i + 1, 5)}\`}`
- On the "Action Queue" wrapper: add `animate-in animate-in-delay-2` class

- [ ] **Step 2: Animate hotels list page**

Read `src/app/(dashboard)/hotels/page.tsx`. Find the hotel cards list (the `.map()` that renders each hotel card).

- On the page header/title section: add `animate-in` class
- On each hotel card: add `animate-in` and stagger delay:
  `className={\`glass-card ... animate-in animate-in-delay-${Math.min(i + 1, 5)}\`}`

- [ ] **Step 3: Animate hotel detail page**

Read `src/app/(dashboard)/hotels/[id]/page.tsx`. The page has:
1. Breadcrumb nav
2. Hotel header with avatar + stats
3. Smart Links section
4. Pages/Rooms/Media tabs section

- On the breadcrumb nav: add `animate-in` class
- On the hotel header card: add `animate-in animate-in-delay-1` class
- On the Smart Links section: add `animate-in animate-in-delay-2` class
- On the tabs section: add `animate-in animate-in-delay-3` class

- [ ] **Step 4: Animate brand page**

Read `src/app/(dashboard)/brand/page.tsx`. It has 3 glass-card sections (Theme, Locked Sections, Custom Domain).

- On the page heading section: add `animate-in` class
- On the first glass card (Organization Theme): add `animate-in animate-in-delay-1` class
- On the second glass card (Locked Sections): add `animate-in animate-in-delay-2` class
- On the third glass card (Custom Domain): add `animate-in animate-in-delay-3` class

- [ ] **Step 5: Animate campaigns, team, and components pages**

Read each page. Apply the same pattern:

`src/app/(dashboard)/campaigns/page.tsx`:
- Page heading: `animate-in`
- Each campaign card in the list: `animate-in animate-in-delay-${Math.min(i + 1, 5)}`

`src/app/(dashboard)/team/page.tsx`:
- Page heading: `animate-in`
- Team member cards: staggered `animate-in`

`src/app/(dashboard)/components/page.tsx`:
- Page heading: `animate-in`
- Component cards: staggered `animate-in`

- [ ] **Step 6: Verify build**

Run: `npx next build 2>&1 | tail -5`

---

### Task 3: Modals & dialogs — scale-fade animation

**Files:**
- Modify: `src/components/cms/CreateHotelModal.tsx`
- Modify: `src/components/cms/AddSectionModal.tsx`

- [ ] **Step 1: Animate CreateHotelModal**

Read `src/components/cms/CreateHotelModal.tsx`. The modal has:
- A fixed wrapper: `className="fixed inset-0 z-50 flex items-center justify-center"`
- A backdrop: `className="absolute inset-0 bg-black/30"`
- A modal card: `className="relative z-10 w-full max-w-lg mx-4 bg-[#ffffff] ..."`

Change the backdrop to add `animate-fade`:
```
className="absolute inset-0 bg-black/30 animate-fade"
```

Change the modal card to add `animate-modal`:
```
className="relative z-10 w-full max-w-lg mx-4 bg-[#ffffff] border border-[#e2dfe8] rounded-2xl shadow-2xl shadow-black/40 animate-modal"
```

- [ ] **Step 2: Animate AddSectionModal**

Read `src/components/cms/AddSectionModal.tsx`. Find the modal overlay and content panel. Apply the same pattern:

- Backdrop div: add `animate-fade` class
- Content panel div: add `animate-modal` class
- Component cards grid (the `.map()` of component options): add `animate-in` and stagger delay to each card:
  `className={\`... animate-in animate-in-delay-${Math.min(i + 1, 5)}\`}`

- [ ] **Step 3: Verify build**

Run: `npx next build 2>&1 | tail -5`

---

### Task 4: Page builder interactions — panel slides and section transitions

**Files:**
- Modify: `src/components/cms/PageBuilder.tsx`
- Modify: `src/components/cms/AIActionBar.tsx`

- [ ] **Step 1: Add transitions to PageBuilder section list**

Read `src/components/cms/PageBuilder.tsx`. Find the section list rendering (the `.map()` over sections in the left panel).

On each section card in the list, add a CSS transition for smooth reordering:
```
style={{ transition: "transform 300ms cubic-bezier(0.16, 1, 0.3, 1), opacity 300ms ease" }}
```

Also add `animate-in` class to each section card with stagger:
`className={\`... animate-in animate-in-delay-${Math.min(i + 1, 5)}\`}`

Find the preview iframe element. Add a transition for the opacity dip on refresh. The iframe likely has a `key` or `src` that changes on refresh. Wrap it or add:
```
style={{ transition: "opacity 300ms ease" }}
```

- [ ] **Step 2: Animate AI floating panels**

Read `src/components/cms/AIActionBar.tsx`. There are two floating panels:
1. FloatingLogs — appears at bottom-right
2. FloatingDiff — appears at bottom-left

Find the FloatingLogs container div (the outermost wrapper that's conditionally rendered). Add `animate-slide-right` class to it.

Find the FloatingDiff container div. Add `animate-slide-left` class to it.

- [ ] **Step 3: Verify build**

Run: `npx next build 2>&1 | tail -5`

---

### Task 5: Feedback & status — Toast system + publish transitions

**Files:**
- Create: `src/components/ui/Toast.tsx`
- Modify: `src/app/layout.tsx`
- Modify: `src/components/cms/PublishButton.tsx`

- [ ] **Step 1: Create Toast component**

Create `src/components/ui/Toast.tsx`:

```typescript
"use client";

import { useState, useEffect, useCallback } from "react";

interface ToastMessage {
  id: number;
  text: string;
  type: "success" | "error" | "info";
  exiting?: boolean;
}

const TYPE_STYLES: Record<string, { bg: string; border: string; text: string }> = {
  success: { bg: "#f0fdf4", border: "#bbf7d0", text: "#15803d" },
  error: { bg: "#fef2f2", border: "#fecaca", text: "#b91c1c" },
  info: { bg: "#eff6ff", border: "#bfdbfe", text: "#1d4ed8" },
};

let nextId = 0;

export function toast(text: string, type: "success" | "error" | "info" = "info") {
  window.dispatchEvent(
    new CustomEvent("app-toast", { detail: { text, type } })
  );
}

export default function ToastContainer() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, exiting: true } : t)));
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 200);
  }, []);

  useEffect(() => {
    function handleToast(e: Event) {
      const { text, type } = (e as CustomEvent).detail;
      const id = nextId++;
      setToasts((prev) => [...prev, { id, text, type }]);
      setTimeout(() => removeToast(id), 3000);
    }
    window.addEventListener("app-toast", handleToast);
    return () => window.removeEventListener("app-toast", handleToast);
  }, [removeToast]);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => {
        const s = TYPE_STYLES[t.type];
        return (
          <div
            key={t.id}
            className="pointer-events-auto"
            style={{
              padding: "10px 16px",
              borderRadius: "10px",
              fontSize: "13px",
              fontWeight: 500,
              background: s.bg,
              border: `1px solid ${s.border}`,
              color: s.text,
              boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
              animation: t.exiting
                ? "toast-out 200ms ease-in both"
                : "toast-in 400ms var(--easing-smooth) both",
              maxWidth: "360px",
            }}
          >
            {t.text}
          </div>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 2: Add ToastContainer to root layout**

Read `src/app/layout.tsx`. Add the ToastContainer import and render it inside `<body>` after `{children}`:

Change the import section to add:
```typescript
import ToastContainer from "@/components/ui/Toast";
```

Change the body content from:
```tsx
<body className="min-h-full flex flex-col bg-[#f8f7fa] text-[#1a1a2e]">
  {children}
</body>
```

To:
```tsx
<body className="min-h-full flex flex-col bg-[#f8f7fa] text-[#1a1a2e]">
  {children}
  <ToastContainer />
</body>
```

- [ ] **Step 3: Add transition to PublishButton status badge**

Read `src/components/cms/PublishButton.tsx`. The status badges use inline `style` objects. Add `transition` to both badge spans:

On the "Live" badge span (line ~44), add to the style object:
```
transition: "background-color 500ms ease, color 500ms ease"
```

On the "Draft" badge span (line ~55), add to the style object:
```
transition: "background-color 500ms ease, color 500ms ease"
```

On the "View Live" link (line ~127), add `animate-fade` class:
```
className="inline-flex items-center gap-1 text-xs font-medium transition-opacity hover:opacity-70 animate-fade"
```

- [ ] **Step 4: Add toast calls to PublishButton**

In `src/components/cms/PublishButton.tsx`, import the toast function:
```typescript
import { toast } from "@/components/ui/Toast";
```

In the `handleToggle` function, after `if (res.ok)`, add:
```typescript
toast(
  isPublished ? "Hotel unpublished" : "Hotel published successfully!",
  isPublished ? "info" : "success"
);
```

After the `finally` block, add an error case inside the try block:
```typescript
if (!res.ok) {
  toast("Failed to update publish status", "error");
}
```

- [ ] **Step 5: Verify build**

Run: `npx next build 2>&1 | tail -5`

---

### Task 6: Public site scroll reveals + FAQ accordion animation

**Files:**
- Create: `src/lib/scroll-observer.ts`
- Create: `src/components/site/ScrollAnimator.tsx`
- Modify: `src/app/site/[orgSlug]/[[...path]]/page.tsx`
- Modify: `src/components/renderer/variants/FaqAccordion.tsx`

- [ ] **Step 1: Create scroll observer utility**

Create `src/lib/scroll-observer.ts`:

```typescript
export function initScrollObserver(): void {
  const elements = document.querySelectorAll(".animate-on-scroll");
  if (elements.length === 0) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 }
  );

  elements.forEach((el) => observer.observe(el));
}
```

- [ ] **Step 2: Create ScrollAnimator client wrapper**

Create `src/components/site/ScrollAnimator.tsx`:

```typescript
"use client";

import { useEffect } from "react";
import { initScrollObserver } from "@/lib/scroll-observer";

export default function ScrollAnimator({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Small delay to ensure DOM is painted before observing
    const timer = setTimeout(() => initScrollObserver(), 100);
    return () => clearTimeout(timer);
  }, []);

  return <>{children}</>;
}
```

- [ ] **Step 3: Wrap public site page with ScrollAnimator**

Read `src/app/site/[orgSlug]/[[...path]]/page.tsx`. Find where the page renders `PageRenderer` for hotel pages (the section that returns JSX with `<PageRenderer ... />`).

Import ScrollAnimator:
```typescript
import ScrollAnimator from "@/components/site/ScrollAnimator";
```

Wrap the hotel page rendering output with `<ScrollAnimator>`:

For the hotel page render (both homepage and subpage cases), change:
```tsx
<PageRenderer sections={data.sections} theme={data.themeData} hotelName={data.hotel.name} />
```
to:
```tsx
<ScrollAnimator>
  <PageRenderer sections={data.sections} theme={data.themeData} hotelName={data.hotel.name} />
</ScrollAnimator>
```

For the property directory (chain root), also wrap with `<ScrollAnimator>` and add `animate-on-scroll` to each hotel card. Find the `HotelCard` component's root `<Link>` wrapper and add:
```
className="animate-on-scroll stagger-${Math.min(i + 1, 5)}"
```
Use a wrapping div around each HotelCard in the grid's `.map()`:
```tsx
<div key={hotel.id} className={`animate-on-scroll stagger-${Math.min(i + 1, 5)}`}>
  <HotelCard hotel={hotel} orgSlug={orgSlug} accentColor={accentColor} />
</div>
```

- [ ] **Step 4: Improve FAQ accordion animation**

Read `src/components/renderer/variants/FaqAccordion.tsx`. The accordion already has `transition-all duration-300` and `maxHeight` animation. Improve it:

Change the expand/collapse div (around line 89) from:
```tsx
<div
  className="overflow-hidden transition-all duration-300 ease-in-out"
  style={{
    maxHeight: openIndex === i ? "500px" : "0px",
    opacity: openIndex === i ? 1 : 0,
  }}
>
```

To:
```tsx
<div
  className="overflow-hidden"
  style={{
    maxHeight: openIndex === i ? "500px" : "0px",
    opacity: openIndex === i ? 1 : 0,
    transition: "max-height 400ms cubic-bezier(0.16, 1, 0.3, 1), opacity 300ms ease 100ms",
  }}
>
```

Also add `animate-on-scroll` to the FAQ section wrapper. Change:
```tsx
<section className="py-20 px-6 bg-white">
```
To:
```tsx
<section className="py-20 px-6 bg-white animate-on-scroll">
```

- [ ] **Step 5: Verify build**

Run: `npx next build 2>&1 | tail -5`

---
