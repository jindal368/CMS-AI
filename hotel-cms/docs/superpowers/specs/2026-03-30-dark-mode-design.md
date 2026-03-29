# Dark/Light Mode — Design Spec

**Goal:** Add a dark/light mode toggle to the Hotel CMS with full CSS variable-based theming, system preference detection, persistent user choice, and all 79 files migrated from hardcoded colors to semantic tokens.

**Approach:** CSS variables with `.dark` class on `<html>`. All hardcoded hex colors replaced with Tailwind semantic tokens (`text-foreground`, `bg-card`, etc.) or `var()` references. ThemeProvider component handles toggle, persistence, and flash prevention.

---

## 1. Dark Color Palette

### CSS Variables — Light (existing, in `:root`)
```
--background: #f8f7fa     --foreground: #1a1a2e
--card: #ffffff            --elevated: #f0eef5
--border: #e2dfe8          --muted: #7c7893
--accent-coral: #e85d45    --accent-teal: #0fa886
--accent-purple: #7c5cbf   --accent-amber: #d49a12
--accent-blue: #3b7dd8
```

### CSS Variables — Dark (new, in `:root.dark`)
```
--background: #0f0f13     --foreground: #e8e6f0
--card: #1a1a24            --elevated: #232330
--border: #2a2a3a          --muted: #8e8ca0
--accent-coral: #e85d45    --accent-teal: #0fa886
--accent-purple: #7c5cbf   --accent-amber: #d49a12
--accent-blue: #3b7dd8
```

Accent colors are identical in both modes — they're vibrant enough for dark backgrounds.

### Glass Card Dark Mode (in globals.css under `.dark` scope)
- `.dark .glass-card` background: `rgba(26, 26, 36, 0.7)`
- Border: `rgba(255, 255, 255, 0.06)`
- Shadow: `0 2px 8px rgba(0, 0, 0, 0.3), 0 0 1px rgba(255, 255, 255, 0.05)`
- Hover shadow: `0 8px 24px rgba(0, 0, 0, 0.4), 0 0 1px rgba(255, 255, 255, 0.08)`
- Same for `.dark .glass-card-static` (minus hover)
- `.dark .floating-panel` background: `rgba(26, 26, 36, 0.92)`

### Body Dark Mode
- Body gradient: `linear-gradient(135deg, #111118, #0f0f13)`

### Files
- Modify: `src/app/globals.css`

---

## 2. Toggle Mechanism & Persistence

### ThemeProvider (`src/components/theme-provider.tsx`)
- "use client" component
- Creates React context with `{ theme, setTheme }` where theme is `"light" | "dark" | "system"`
- On mount: reads `localStorage.getItem("theme")` — default `"system"`
- Resolves effective theme: if `"system"`, check `window.matchMedia("(prefers-color-scheme: dark)").matches`
- Adds/removes `dark` class on `document.documentElement`
- Listens to `matchMedia` change event to update when OS preference changes
- Persists choice to `localStorage` on change

### Flash Prevention
- ThemeProvider renders a blocking `<script>` tag via `dangerouslySetInnerHTML` that runs before React hydrates:
```js
(function(){
  var t = localStorage.getItem("theme");
  var d = t === "dark" || (t !== "light" && matchMedia("(prefers-color-scheme:dark)").matches);
  if(d) document.documentElement.classList.add("dark");
})()
```
This runs synchronously before paint — no white flash.

### ThemeToggle (`src/components/theme-toggle.tsx`)
- "use client" component using `useTheme()` hook from provider
- Renders a button with icon: sun (light), moon (dark), or monitor (system)
- Click cycles: system → light → dark → system
- Placed in the top bar next to the user avatar

### Files
- Create: `src/components/theme-provider.tsx`
- Create: `src/components/theme-toggle.tsx`
- Modify: `src/app/layout.tsx` — wrap body content with `<ThemeProvider>`
- Modify: `src/components/top-bar.tsx` — add `<ThemeToggle />`

---

## 3. Color Refactor — Hardcoded → Semantic Tokens

### Tailwind Class Replacements (use replace_all per file)

| Hardcoded | Semantic Token |
|-----------|---------------|
| `text-[#1a1a2e]` | `text-foreground` |
| `text-[#7c7893]` | `text-muted` |
| `bg-[#f8f7fa]` | `bg-background` |
| `bg-[#f0eef5]` | `bg-elevated` |
| `bg-[#ffffff]` | `bg-card` |
| `border-[#e2dfe8]` | `border-border` |
| `bg-[#e2dfe8]` | `bg-border` |

### Inline Style Replacements

| Hardcoded | CSS Variable |
|-----------|-------------|
| `color: "#1a1a2e"` | `color: "var(--foreground)"` |
| `color: "#7c7893"` | `color: "var(--muted)"` |
| `background: "#ffffff"` | `background: "var(--card)"` |
| `background: "#f0eef5"` | `background: "var(--elevated)"` |
| `borderColor: "#e2dfe8"` | `borderColor: "var(--border)"` |

### Accent Colors — No Change
These hex values stay hardcoded in both modes:
- `#e85d45` (coral) — used for active states, primary actions
- `#0fa886` (teal) — used for success, live status
- `#7c5cbf` (purple) — used for focus, secondary actions
- `#d49a12` (amber) — used for warnings
- `#3b7dd8` (blue) — used for info

### Execution Order (by directory)
1. `src/app/globals.css` — dark variables + glass card dark styles
2. `src/components/theme-provider.tsx` + `theme-toggle.tsx` + layout + top-bar
3. `src/app/(dashboard)/` — 7 page files
4. `src/app/(auth)/` — 2 page files (login, register)
5. `src/components/cms/` — ~15 component files
6. `src/components/renderer/variants/` — 27 variant components
7. `src/components/sidebar-nav.tsx`, `src/components/top-bar.tsx`, remaining files

### Files (all modified)
- `src/app/globals.css`
- `src/app/layout.tsx`
- `src/app/(dashboard)/layout.tsx`
- `src/app/(dashboard)/dashboard/page.tsx`
- `src/app/(dashboard)/hotels/page.tsx`
- `src/app/(dashboard)/hotels/[id]/page.tsx`
- `src/app/(dashboard)/brand/page.tsx` + `BrandPageClient.tsx`
- `src/app/(dashboard)/campaigns/page.tsx`
- `src/app/(dashboard)/team/page.tsx`
- `src/app/(dashboard)/components/page.tsx`
- `src/app/(auth)/login/page.tsx`
- `src/app/(auth)/register/page.tsx`
- `src/components/top-bar.tsx`
- `src/components/sidebar-nav.tsx`
- `src/components/cms/PageBuilder.tsx`
- `src/components/cms/AIActionBar.tsx`
- `src/components/cms/CreateHotelModal.tsx`
- `src/components/cms/AddSectionModal.tsx`
- `src/components/cms/PublishButton.tsx`
- `src/components/cms/EditHotelForm.tsx`
- `src/components/cms/LinksEditor.tsx`
- `src/components/cms/LocalePageSection.tsx`
- `src/components/cms/HotelTabs.tsx`
- `src/components/cms/TeamManager.tsx`
- `src/components/cms/BrandThemeEditor.tsx`
- `src/components/cms/LockedSectionManager.tsx`
- `src/components/cms/DeleteHotelButton.tsx`
- `src/components/cms/SectionEditor.tsx`
- `src/components/ui/Toast.tsx`
- All 27 renderer variant files in `src/components/renderer/variants/`

---

## Out of Scope

- Dark mode for public hotel websites (they use hotel-specific themes)
- Per-user dark mode preference stored in database (localStorage is sufficient)
- Custom theme colors beyond light/dark
- Dark mode for the page builder preview iframe (it shows the hotel website, not CMS)
