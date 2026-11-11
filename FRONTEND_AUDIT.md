# Meridian — Frontend Audit & Professional Fix Plan

**Scope:** Architecture, design system, and UI/accessibility of the Next.js App Router frontend.
**Method:** Static review of all routes/components/styles + runtime checks against the dev server + Lighthouse on `/`, `/about`, `/auth/signin`.
**Status:** Audit only. No source files were changed.

## Baseline scorecard

| Route | Accessibility | SEO | Notes |
|---|---|---|---|
| `/` | 0.91 | 0.40 | `heading-order`, `landmark-one-main` |
| `/about` | 0.93 | 0.40 | `landmark-one-main` |
| `/auth/signin` | 0.94 | 0.40 | `landmark-one-main` |

Failed audits on every page: `document-title`, `landmark-one-main`, `meta-description`, `robots-txt`.

Runtime confirmations:

- `/robots.txt`, `/sitemap.xml`, `/manifest.json`, `/nonexistent-xyz` → **HTTP 200 `text/html`** (profile shell).
- `/read/999999` → **HTTP 200** with title `Story Not Found | Project A`.
- `/library` → **HTTP 200 blank shell** for unauthenticated users.
- `/settings`, `/desk` → **HTTP 307** to sign-in (correct).
- `document.title` is empty on `/`, `/about`, `/auth/signin`; only a viewport meta tag exists.

---

## P0 — Blockers (fix before any visual polish)

### P0-1. No global metadata / SEO shell
**Evidence:** `src/app/layout.tsx:22-39` exports no `metadata` or `viewport`. Only `src/app/read/[id]/page.tsx:14` defines metadata anywhere in the app.
**Impact:** Empty `<title>`, no description, no Open Graph/Twitter cards, no canonical URLs. Lighthouse SEO 0.40 on every public page. Shared links render as bare URLs.
**Fix:**
- Add `export const metadata: Metadata` and `export const viewport: Viewport` in `src/app/layout.tsx`:
  - `metadataBase`, `title.default` + `title.template`, `description`, `openGraph`, `twitter`, `robots`, `icons`.
  - `viewport.themeColor` for light/dark.
- Add per-route `generateMetadata` for `/about`, `/auth/signin`, `/library`.
- Add `app/opengraph-image.tsx` (static or dynamic) and `app/icon.png`.

### P0-2. Catch-all profile route swallows static paths and 404s
**Evidence:** `src/app/[username]/page.js:1,38` is a root-level single-segment dynamic route. `RESERVED_ROUTES` at `:32-36` omits `robots.txt`, `sitemap.xml`, `manifest.json`, `favicon.ico`, `read`, `library`, `desk`. No `robots.ts`, `sitemap.ts`, `manifest.ts`, or `not-found.tsx` exists (`src/app` root files: `error.tsx`, `global-error.tsx`, `loading.js`, `layout.tsx`, `page.tsx`).
**Impact:** Crawlers receive HTML for `/robots.txt` and `/sitemap.xml`; unknown URLs return 200 (soft 404), which damages indexing and analytics.
**Fix:**
- Move the profile route to `src/app/u/[username]/page.js` and update links (`Navbar.js:83`, `StoryFeedCard.tsx:100`). This removes the namespace collision entirely.
- Add `src/app/robots.ts`, `src/app/sitemap.ts`, `src/app/manifest.ts` using Next.js metadata file conventions.
- Add `src/app/not-found.tsx` with a real 404 design and `notFound()` usage.

### P0-3. Stored XSS in article rendering
**Evidence:** `src/app/Components/Read/ArticleReadClient.tsx:359` renders `dangerouslySetInnerHTML={{ __html: processedHtml }}`. `processedHtml` is produced at `:178-206` by regex-stripping only a few color/background declarations. No allowlist, no sanitizer. Read-time text extraction at `:192` (`text.replace(/<[^>]+>/g, '')`) is not a sanitizer.
**Impact:** Any author-supplied `onerror`, `<script>`, `javascript:` URL, or `style` payload executes for every reader. This is the highest-severity frontend issue.
**Fix:**
- Sanitize at write time in the story service **and** at render time with `isomorphic-dompurify` / `sanitize-html`:
  - Allowlist: `p, h1-h3, ul, ol, li, blockquote, pre, code, strong, em, a, img, hr, table, thead, tbody, tr, th, td, br`.
  - Allow attributes: `href, src, alt, title, colspan, rowspan`.
  - Force `rel="noopener noreferrer"` and `target="_blank"` policy on links; strip `on*`, `style`, `script`, `iframe`, `object`.
- Long-term: store TipTap JSON and render it to React nodes instead of raw HTML.
- Add a CSP (`next.config.ts`) as defense in depth.

### P0-4. Blank loading screens
**Evidence:**
- `src/app/library/page.tsx:132-133` → `return null` while loading.
- `src/app/[username]/page.js:255-256` → `return null` while loading.
- `src/app/desk/page.js:122` → `return null`.
- `src/app/settings/page.tsx:370` → `return null`.
- `src/app/loading.js:16` → global loading component returns `null`.
**Impact:** Users see a white page with no feedback; on slow connections it looks broken. `/library` is also reachable unauthenticated because middleware does not protect it (`src/middleware.js:66`).
**Fix:**
- Replace every `return null` with a route-level skeleton that matches the final layout (card grid, sidebar, form).
- Add `loading.tsx` files per route group instead of a global no-op.
- Add `/library` to `isProtectedRoute` in middleware.

### P0-5. No main landmark or skip link
**Evidence:** `src/app/layout.tsx:32-36` renders `ClientLayout` + children with no `<main>`. `Navbar.js:106` is the only `<nav>`. Only `ArticleReadClient.tsx:277` uses `<main>`.
**Impact:** Lighthouse `landmark-one-main` fails on `/`, `/about`, `/auth/signin`. Keyboard/screen-reader users cannot jump past the navbar.
**Fix:**
- Add a skip link as the first focusable element: `<a href="#main-content" className="skip-link">Skip to content</a>`.
- Wrap page content in `<main id="main-content" tabIndex={-1}>` inside `ClientLayout` (or per layout).
- Keep one `<h1>` per page; demote section headings accordingly (`HeroBanner.tsx:13` is `h1`, feed is `h2` — good; profile/settings pages need an `h1`).

---

## P1 — Architecture

### A1. Root layout calls `auth()` → whole app is dynamic
**Evidence:** `src/app/layout.tsx:23` awaits `auth()` and passes the session into `ClientLayout`. `auth()` reads cookies/headers, so every route (including `/about`) opts out of static rendering.
**Impact:** No static HTML/CDN caching for marketing pages; slower TTFB; higher server cost.
**Fix:** Split layouts with route groups:
- `src/app/(marketing)/layout.tsx` — no auth, static `/`, `/about`.
- `src/app/(app)/layout.tsx` — calls `auth()` for `/desk`, `/library`, `/settings`, `/u/[username]`.
- Keep `Navbar` client-side and let it use `useSession()`; pass the session only in the app group.
- If the navbar must be identical everywhere, accept dynamic rendering but document it; do not call `auth()` in the root layout by accident.

### A2. Soft 404 + duplicate story fetch on `/read/[id]`
**Evidence:** `src/app/read/[id]/page.tsx:44-59` returns a 200 "Story Not Found" UI. `generateMetadata` (`:14-16`) and the page (`:42`) both call `StoryService.getStoryById`.
**Impact:** Search engines index missing stories; each article request does two DB reads.
**Fix:**
- Call `notFound()` from `next/navigation` when `!story`; add `app/not-found.tsx`.
- Wrap the fetch in React `cache()` (or `unstable_cache`) so metadata and page share one request.
- Move the "not found" UI into `not-found.tsx` so it is reused.

### A3. Middleware gaps and non-portable rate limiting
**Evidence:** `src/middleware.js:66` protects only `/desk` and `/settings`. Rate limiting uses an in-process store (`src/app/lib/rateLimit`), which resets per serverless instance and is not shared across regions.
**Impact:** `/library` is client-guarded only (blank flash); rate limits are ineffective under horizontal scaling.
**Fix:**
- Add `/library` (and any future private routes) to `isProtectedRoute`.
- Move rate limiting to Upstash Redis / Vercel KV / edge-compatible store; key by IP + route.
- Keep the matcher exclusion list but add `robots.txt`, `sitemap.xml`, `manifest.webmanifest` for clarity.

### A4. Image/CSP/header hardening
**Evidence:** `next.config.ts:3-17` sets only three headers. No `images.remotePatterns`, no CSP, no `poweredByHeader: false`.
**Impact:** `next/image` will reject external avatar hosts or skip optimization; no XSS mitigation layer; framework fingerprint exposed.
**Fix:**
- Add `images.remotePatterns` for the avatar CDN / Firebase Storage host.
- Add a CSP (start in report-only, then enforce) with `script-src 'self' 'nonce-…'`, `img-src 'self' data: https:`, `frame-ancestors 'none'`.
- Add `poweredByHeader: false`, `reactStrictMode: true`.
- Add `experimental.optimizePackageImports: ['@phosphor-icons/react']`.

### A5. Dead/misaligned tooling
**Evidence:** `package.json:58,67` installs Tailwind v4 + `@tailwindcss/postcss`, but `globals.css` never imports Tailwind and there are no utility classes. `sass` (`:66`) is installed but no `.scss`/`.sass` files exist. `eslint-config-next` is `15.3.5` while `next` is `^15.5.2` (`:47,65`).
**Impact:** Confusing setup, slower installs, lint rules that drift from the framework version.
**Fix:** Pick one styling system. Given the existing CSS Modules, remove Tailwind/PostCSS/sass and the PostCSS config, or deliberately adopt Tailwind and migrate. Align `eslint-config-next` to the Next minor version. Standardize on TypeScript (see A6).

### A6. Mixed `.js` / `.tsx` and duplicated profile form
**Evidence:** Core routes are `.js` (`[username]/page.js`, `about/page.js`, `desk/page.js`, `Navbar.js`), others are `.tsx`. The edit-profile form exists twice: `[username]/page.js:470-592` and `settings/page.tsx` (profile section).
**Impact:** Inconsistent typing, duplicated validation/UI, higher maintenance cost. `tsc --noEmit` could not complete within 4 minutes, suggesting unresolved type debt.
**Fix:**
- Migrate `app/` to `.tsx` incrementally, starting with `layout`, `Navbar`, and data-fetching pages.
- Extract a shared `ProfileForm` component + Zod schema used by both profile and settings.
- Add `typecheck` script and run it in CI with a generous timeout.

### A7. Brand and copy inconsistency
**Evidence:** UI brand is "Meridian" (`Navbar.js:120`). Metadata says "Project A" (`read/[id]/page.tsx:20,25,26`). Settings says "Meridain" / "meridain.app" (`settings/page.tsx:449,454`).
**Impact:** Looks unfinished and undermines trust; inconsistent SEO entity.
**Fix:** Centralize brand constants (`src/app/lib/site.ts`: `name`, `url`, `description`, `twitterHandle`) and use them in metadata, navbar, settings, emails.

### A8. Client-only data fetching for core surfaces
**Evidence:** `library/page.tsx:67-100`, `desk/page.js:24-45`, `[username]/page.js:106-162` fetch after mount. `page.tsx:10` loads all published stories with no pagination.
**Impact:** Blank first paint, no SSR content for crawlers, request waterfalls, no shared cache.
**Fix:**
- Convert read-heavy pages to Server Components that call services directly; keep only interaction in client components.
- Use Server Actions for mutations (already partially done in `actions/engagement`).
- Add pagination/infinite scroll to the feed (`getPublishedStories(limit, cursor)`).
- If client fetching stays, adopt SWR/React Query with skeletons and error states.

### A9. Missing route-level error/empty states
**Evidence:** Only `error.tsx` and `global-error.tsx` exist. Empty states are plain text (`[username]/page.js:359-363`, `library/page.tsx:223,339,401`).
**Impact:** Failures fall back to a generic full-page error; empty states give no next action.
**Fix:** Add `error.tsx` per route group, retry affordances, and designed empty states with a primary CTA ("Write your first story", "Browse stories").

---

## P2 — Design system

### D1. Three overlapping token blocks
**Evidence:** `globals.css` defines the same tokens three times: `:root` (`:1-178`), `[data-theme="light"]` (`:180-325`), `[data-theme="dark"]` (`:328-…`). Many raw hex values (`#b80000`, `#cccccc`, `#f3f4f6`).
**Impact:** Theme changes must be made in 2-3 places; drift is inevitable; no semantic naming (`--logsig-*`, `--task-*` leak component names into global tokens).
**Fix:**
- Single source: `:root` = light semantic tokens; `[data-theme="dark"]` = overrides only.
- Rename to semantic roles: `--surface`, `--surface-raised`, `--text`, `--text-muted`, `--border`, `--accent`, `--accent-contrast`, `--danger`, `--focus-ring`.
- Use OKLCH for predictable contrast; add a `@media (prefers-color-scheme: dark)` fallback.
- Delete the duplicated light block.

### D2. Theme flash and forced light mode
**Evidence:** `layout.tsx:28` hardcodes `data-theme="light"`. `ThemeProvider.js:17-31` sets the theme in `useEffect` after hydration. `suppressHydrationWarning` (`layout.tsx:30`) hides the mismatch. Logged-out users are forced to light (`ThemeProvider.js:20-23`).
**Impact:** Dark-mode users see a white flash on every load; theme preference is ignored for logged-out readers.
**Fix:**
- Inject a blocking inline script in `<head>` that reads `localStorage`/`prefers-color-scheme` and sets `data-theme` before paint.
- Respect system preference for everyone; persist choice in a cookie so the server can render the correct attribute.
- Remove `suppressHydrationWarning` once the theme is server-consistent.

### D3. No reset, focus styles, or motion preferences
**Evidence:** `globals.css:1-3` sets `margin/padding` on `:root` (ineffective). No `box-sizing` reset, no `:focus-visible`, no `prefers-reduced-motion` anywhere (grep returned none).
**Impact:** Inconsistent cross-browser layout; keyboard users cannot see focus; animations/skeletons ignore accessibility settings.
**Fix:**
```css
*, *::before, *::after { box-sizing: border-box; }
* { margin: 0; }
:focus-visible { outline: 2px solid var(--focus-ring); outline-offset: 2px; }
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation-duration: .01ms !important; transition-duration: .01ms !important; }
}
```
Also add `html { -webkit-text-size-adjust: 100%; }` and `img, video { max-width: 100%; height: auto; }`.

### D4. No type scale or spacing system
**Evidence:** Font sizes are hardcoded per module (e.g. `read/[id]/page.tsx:48`, `error.tsx:56,67`), no `clamp()`/fluid scale, inline styles in `settings`, `library`, `StoryFeedCard.tsx:238,248,259`, `error.tsx:19-131`.
**Impact:** Inconsistent hierarchy and rhythm; hard to make responsive; inline styles bypass theming.
**Fix:**
- Define a modular scale (`--text-xs` … `--text-4xl`) with `clamp()` for headings.
- Define spacing tokens (`--space-1` … `--space-12`) and a container (`--container: 72rem`).
- Move inline styles into CSS Modules or shared primitives (`Button`, `Card`, `Stack`).

### D5. Hero content and CTA logic
**Evidence:** `HeroBanner.tsx:14` — "Humans thinks" (grammar). `:19` — awkward tagline. `:33-72` — hardcoded fake editorial card ("The Art of Slow Thinking…", "Curated by Editorial Staff"). `:64-70` — bookmark button has no handler. `:22` — "Start reading" sends logged-out users to sign-in, even though public stories are readable.
**Impact:** First impression is a mockup, not a product; a dead button; a primary CTA that blocks the core action.
**Fix:**
- Fix copy: "Humans think & write ideas." / tighten the subtitle.
- Replace the fake card with real data (latest/featured story from `StoryService`), or label it clearly as an example.
- Wire or remove the bookmark button.
- Point "Start reading" to `/` feed or `/explore`; keep "Start writing" → sign-in with callback.

### D6. No responsive navigation
**Evidence:** `Navbar.js:105-196` renders all links inline; no hamburger, drawer, or breakpoint logic. `Navbar.module.css` would need to hide links on mobile (not verified visually, but no mobile menu component exists).
**Impact:** Links overflow or shrink on phones; core navigation becomes unusable.
**Fix:** Add a mobile menu button (`aria-expanded`, `aria-controls`), a slide-over/drawer with focus trap, and close on route change/Escape. Hide desktop links under a breakpoint.

### D7. Color contrast and non-text contrast
**Evidence:** `--card-border: #cccccc` on `#ffffff` is ~1.6:1 (below 3:1 for UI boundaries). `--scrollbar-thumb: #999999` is decorative but low. Muted text `#666666` is ~5.7:1 (passes AA). Several borders are the only affordance for cards/inputs.
**Impact:** Low-vision users cannot distinguish card/input boundaries; WCAG 1.4.11 risk.
**Fix:** Darken borders to at least `#767676` (or use a shadow + border combo), audit every token pair with a contrast checker, and add a Storybook/visual regression check.

---

## P3 — UI & accessibility

### U1. Clickable cards and rows are not keyboard accessible
**Evidence:** `StoryFeedCard.tsx:211` — `<article onClick>`; nested `<div onClick>` author (`:235-240`); buttons inside. `library/page.tsx:196,250,307,371` — `<div onClick={router.push}>`. `[username]/page.js:237` — author `<div onClick>`.
**Impact:** Keyboard and screen-reader users cannot open stories or authors; nested interactive elements create ambiguous semantics.
**Fix:**
- Make the title a real `<Link href={...}>` and stretch it over the card with `::after { position:absolute; inset:0 }`.
- Keep like/share/save buttons above the stretched link (`position: relative; z-index: 1`).
- Convert author rows to `<Link>`; remove `onClick` from non-interactive elements.
- If a whole card must be clickable, use `role="link"`, `tabIndex={0}`, and `onKeyDown` for Enter/Space — but real links are preferred.

### U2. Navbar menus lack semantics and keyboard support
**Evidence:** `Navbar.js:107` brand `<div onClick>`; `:145` username `<div onClick>`; `:162,167,172,182` menu items are `<div onClick>`; no `aria-haspopup`, `aria-expanded`, `role="menu"`, Escape handler, or focus management.
**Impact:** Keyboard users cannot open the profile menu or reach items; screen readers announce nothing useful.
**Fix:**
- Brand → `<Link href="/">`.
- Trigger → `<button aria-haspopup="menu" aria-expanded={showMenu} aria-controls="profile-menu">`.
- Menu → `role="menu"`, items → `role="menuitem"` or plain links inside a `<nav aria-label="Account">`.
- Add Escape-to-close, focus first item on open, return focus to trigger on close, and arrow-key navigation.
- Add `aria-current="page"` to the active nav link (use `usePathname`).

### U3. Modals are not dialogs
**Evidence:** `[username]/page.js:471-473` — overlay + form with `onClick` close; no `role="dialog"`, `aria-modal`, labelled title, focus trap, Escape, or scroll lock. Same pattern in `settings/page.tsx` delete modal.
**Impact:** Focus escapes behind the overlay; screen readers do not announce a dialog; Escape does nothing.
**Fix:** Use a shared `<Modal>` (or Radix/Headless UI) with `role="dialog"`, `aria-modal="true"`, `aria-labelledby`, focus trap, Escape, restore focus, and `overflow: hidden` on `<body>`.

### U4. Blocking `alert()` / `window.confirm()`
**Evidence:** `desk/page.js:74,95` (`alert`), `:80` (`confirm`); `settings/page.tsx:363` (`alert`).
**Impact:** Jarring, unstyled, inaccessible, and blocked in some embedded contexts. The app already has `useInkWell()` toasts.
**Fix:** Replace with `inkWell.toast({ type: 'error' })` and a styled confirm dialog. Keep `confirm()` only as a last-resort fallback.

### U5. Toggle state is visual-only
**Evidence:** Like/save buttons in `StoryFeedCard.tsx:263-295` and `ArticleReadClient.tsx:365-400` change icon fill/class, but do not expose `aria-pressed`. Counts are plain `<span>`.
**Impact:** Screen-reader users cannot tell whether a story is liked/saved.
**Fix:** Add `aria-pressed={optimisticLike.isLiked}` / `aria-pressed={isSaved}` and an `aria-live="polite"` region for counts if they change asynchronously.

### U6. Form feedback is not announced
**Evidence:** `settings/page.tsx:61-69` tracks username availability; messages are rendered visually. Save errors use `alert` (`:363`). No `aria-invalid`/`aria-describedby`.
**Impact:** Screen-reader users miss validation and availability feedback.
**Fix:** Add `aria-invalid`, `aria-describedby` pointing to the error/hint element, and `role="status"`/`aria-live="polite"` for async availability and save results.

### U7. Image alt text quality
**Evidence:** `Navbar.js:149` — `alt="Avatar"`; `[username]/page.js:308` builds a descriptive alt (good). Decorative images are not marked `alt=""`.
**Impact:** Redundant/noisy announcements.
**Fix:** Use `alt=""` for decorative avatars, or `${name}'s avatar` for meaningful ones. Add `sizes` to `next/image` where layout depends on it.

### U8. Heading hierarchy
**Evidence:** Lighthouse `heading-order` fails on `/`. `[username]/page.js:270` uses `<h2>` for the page title with no `h1`; `error.tsx:54` uses `<h2>` as the top heading; settings sections likely skip levels.
**Impact:** Screen-reader navigation is confusing; SEO outline is weak.
**Fix:** One `<h1>` per route (visually hidden if needed), then `h2`/`h3` in order. Add an automated `eslint-plugin-jsx-a11y` rule set.

---

## Phased implementation plan

### Phase 1 — P0, ~1–2 days
1. `layout.tsx`: metadata + viewport + skip link + `<main>`.
2. `robots.ts`, `sitemap.ts`, `manifest.ts`, `not-found.tsx`; move profile to `/u/[username]`.
3. `read/[id]`: `notFound()` + `cache()` dedupe.
4. Sanitize article HTML (DOMPurify allowlist).
5. Replace `return null` loading states with skeletons; protect `/library`.
6. Navbar: real links/buttons, `aria-expanded`, `aria-current`, Escape.

### Phase 2 — P1 architecture, ~2–3 days
1. Route groups `(marketing)` / `(app)`; remove root `auth()`.
2. Middleware: `/library`, Redis-backed rate limit.
3. `next.config.ts`: `images.remotePatterns`, CSP, `poweredByHeader:false`.
4. Remove dead Tailwind/sass deps; align ESLint; add `typecheck` script.
5. Centralize brand constants; fix "Project A"/"Meridain".
6. Extract shared `ProfileForm`; convert core routes to server components.

### Phase 3 — P2 design system, ~2–3 days
1. Collapse token blocks into semantic `:root` + dark overrides.
2. Blocking theme script + system preference.
3. Reset, focus-visible, reduced-motion.
4. Type scale, spacing scale, container.
5. Mobile navigation.
6. Contrast pass on borders and muted text.

### Phase 4 — P3 polish, ~1–2 days
1. Keyboard-accessible cards/rows (stretched links).
2. Shared accessible `Modal`.
3. Replace `alert`/`confirm` with toasts/dialogs.
4. `aria-pressed`, live regions, `aria-invalid`.
5. Heading/alt-text sweep.
6. Re-run Lighthouse and axe; target a11y ≥ 0.98, SEO ≥ 0.95.

## Verification checklist
- [ ] `document.title` and meta description present on `/`, `/about`, `/auth/signin`.
- [ ] `/robots.txt`, `/sitemap.xml`, `/manifest.webmanifest` return correct content types.
- [ ] Unknown URL returns 404; `/read/999999` returns 404.
- [ ] No `dangerouslySetInnerHTML` without sanitization.
- [ ] Keyboard-only pass: skip link, navbar menu, cards, modals, forms.
- [ ] Lighthouse a11y ≥ 0.98, SEO ≥ 0.95, no `landmark-one-main`/`heading-order`.
- [ ] No blank screens on slow 3G for `/library`, `/desk`, `/settings`, `/u/[username]`.
- [ ] `next build` + `tsc --noEmit` pass in CI.
