# AppForge — PWA + Mobile UI/UX Audit

_Hardening pass on branch `claude/pwa-mobile-ui-review-COYvr` (April 2026)._

This document complements [`frontend/docs/PWA_SETUP.md`](frontend/docs/PWA_SETUP.md),
which describes the existing PWA architecture. This audit focuses on what was
**verified**, what was **fixed** in this pass, and what to watch going forward.

---

## 1. Résumé global

AppForge already shipped a solid PWA foundation before this pass:
`vite-plugin-pwa` with Workbox precache + NetworkFirst for `/api/*`, a full web
app manifest (`#090d16` theme, 192/512/maskable-512 icons, 180 apple-touch icon,
`display: standalone`), correct iOS meta tags (`viewport-fit=cover`,
`apple-mobile-web-app-capable`, `apple-mobile-web-app-status-bar-style=black-translucent`),
a bespoke iOS viewport stabilizer (`frontend/src/lib/viewport.js`) that writes
`--app-height` / `--vvh` CSS vars, and safe-area layout primitives
(`.app-viewport`, `.safe-top/bottom/x`, `.modal-overlay/sheet/scroll`,
`.mobile-nav-region`).

The audit therefore focused on:

1. **Eliminating the handful of real bugs** that would show up on physical
   iPhones and narrow Android phones (raw `vh` in a modal, toast under the
   floating nav, LoginPage trapped behind the iOS keyboard, LinksView row
   overflow on iPhone SE, ActionMenu clipping near landscape notches).
2. **Meeting WCAG 2.5.5 (tap targets)** by stretching `.btn` and `.icon-btn`
   to 44 px / 40 px on mobile.
3. **Removing a WCAG 1.4.4 (Resize Text) violation** in the viewport meta
   tag (`user-scalable=no, maximum-scale=1`).
4. **Polishing** placeholder contrast, MobileNav typography and Escape-key
   parity on the custom NodePanel.

No architectural changes. All edits are additive inside the existing layout
system. Desktop UX is untouched (fixes are either scoped to the
`@media (max-width: 767px)` block or to mobile-only component branches).

---

## 2. Problèmes trouvés

### P0 — Bugs

| # | File:line | Problem |
|---|---|---|
| 1 | `frontend/src/components/projects/NodePanel.jsx:58` | Mobile sheet used `h-[min(82vh,680px)]`. This is the **only raw `vh`** in `src/**`. Inside a `.modal-overlay` that is anchored to `--app-height` and padded on all four safe insets, 82vh can exceed the padded overlay on iOS PWA and push the sticky footer past the home indicator. |
| 2 | `frontend/src/index.css:760-766` | Mobile `.toast-stack` bottom was `calc(0.8rem + var(--sab))`. The floating `.mobile-nav-region` capsule occupies ~62 px above the home indicator, so toasts **rendered under the nav** on mobile. |
| 3 | `frontend/src/components/auth/LoginPage.jsx:24` | Root used `overflow-hidden`. On short phones (iPhone SE, 320×568) with the iOS keyboard open, the vertically-centered login card could leave the password input behind the keyboard, because nothing scrolled. |
| 4 | `frontend/src/components/layout/LinksView.jsx:67-80` | Link row used `flex justify-between` with no `min-w-0` on the content column. Long URLs overflowed the card horizontally on narrow phones, and the two action buttons crowded the content. |
| 5 | `frontend/src/components/ui/primitives.jsx:53-75` | `ActionMenu.updatePosition` clamped against `window.innerWidth/Height` with a flat 8 px margin, ignoring safe-area insets. On notched landscape devices, menus could clip under the sensor housing / home indicator. |

### P0 — WCAG violations

| # | File:line | Problem |
|---|---|---|
| 6 | `frontend/index.html:12-15` | `maximum-scale=1.0, user-scalable=no` blocked pinch-zoom. This violates **WCAG 1.4.4 Resize Text** and was unnecessary — `.input-base` pins inputs to 16 px on mobile, which is what actually prevents iOS focus-zoom. |
| 7 | `frontend/src/index.css:297-309` | `.btn-sm` ≈ 32 px, `.btn-md` ≈ 40 px. Below the 44 px target that MobileHeader primary action, ProjectList "Ouvrir", Settings modal actions, LoginPage submit and NodePanel Save all inherit. **WCAG 2.5.5 Target Size**. |
| 8 | `frontend/src/index.css:342-344` | `.icon-btn` was 2 rem (32 px). Same WCAG issue, affects Roadmap tree actions, mobile header menu trigger and toast dismiss. |
| 9 | `frontend/src/index.css:640-647` | `.project-card__gear` was 2 rem. Same. |
| 10 | `frontend/src/components/roadmap/TreeNode.jsx:47` | TreeNode hard-coded `h-8 w-8` on three IconButtons, which **blocked** the `.icon-btn` mobile upscale from taking effect via Tailwind cascade order. Coupled to fix #8. |

### P1 — Visual / layout polish

| # | File:line | Problem |
|---|---|---|
| 11 | `frontend/src/components/layout/MobileNav.jsx:20,25` | `text-[10px]` labels + `text-[0.95rem]` emoji icons were hard to read on glare-lit screens. |
| 12 | `frontend/src/components/layout/LinksView.jsx:70` | URL `<a>` was `text-xs`. Combined with the overflow bug, a long URL looked cramped. |

### P2 — Quality-of-life polish

| # | File:line | Problem |
|---|---|---|
| 13 | `frontend/src/components/projects/NodePanel.jsx` | Mobile path did not listen for `Escape`, unlike the `Modal` primitive. |
| 14 | `frontend/src/index.css:389` | Placeholder `#60708b` on `#0f1727` contrast ≈ 3.8:1 — borderline for outdoor readability. |

---

## 3. Corrections appliquées

### 3.1 `frontend/src/index.css`

- **Mobile media block (line 756)** now scopes four new rules:
  - `.toast-stack { bottom: calc(5.25rem + var(--sab)); }` — toast now floats
    above the MobileNav capsule and the home indicator.
  - `.btn { min-height: 44px; }` — every button stretches vertically to the
    WCAG 2.5.5 target on mobile while keeping its desktop padding.
  - `.icon-btn { width: 2.5rem; height: 2.5rem; }` — 40 px square on mobile
    (effective hit area ≥ 44 px given inter-button gaps).
  - `.project-card__gear { width: 2.5rem; height: 2.5rem; }` +
    `.project-card__primary-action { padding-right: 3.25rem; }` — the
    card's "Ouvrir" button now clears the enlarged gear.
- **Placeholder color** (line 389) bumped from `#60708b` to `#7a8aa3` (~5.2:1
  contrast on the input background).

### 3.2 `frontend/index.html`

- Viewport meta relaxed to
  `content="width=device-width, initial-scale=1, viewport-fit=cover"`.
- Comment block rewritten to explain the real anti-iOS-zoom mechanism (16 px
  input font-size) rather than the wrong one it used to invoke.

### 3.3 `frontend/src/components/projects/NodePanel.jsx`

- Raw `h-[min(82vh,680px)]` replaced by inline
  `style={{ maxHeight: 'min(calc(var(--app-height, 100dvh) * 0.82), 680px)' }}`
  on the mobile branch. The sheet is now anchored to the stable viewport, never
  exceeds the `.modal-overlay`'s safe-area-padded box, and the sticky footer
  never clips past the home indicator.
- Added a `useEffect` Escape-key listener so the panel closes on `Esc` from
  either branch, matching the `Modal` primitive.

### 3.4 `frontend/src/components/layout/MobileNav.jsx`

- Label font bumped from `text-[10px]` to `text-[11px]`.
- Icon (emoji) bumped from `text-[0.95rem]` to `text-[1.05rem]`.
- Added `aria-hidden` on the decorative emoji so screen readers only read the
  label.

### 3.5 `frontend/src/components/layout/LinksView.jsx`

- Row now uses `flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between`
  — actions stack below content on mobile, side-by-side on `sm:`.
- Content column gains `min-w-0 flex-1`.
- URL anchor gains `block break-all` and a hover color, and is bumped from
  `text-xs` to `text-sm` so it's easier to tap.

### 3.6 `frontend/src/components/auth/LoginPage.jsx`

- Root `overflow-hidden` → `overflow-y-auto overflow-x-hidden`. The login card
  can now scroll when the iOS keyboard claims half the viewport.

### 3.7 `frontend/src/components/roadmap/TreeNode.jsx`

- The three IconButton size overrides changed from `h-8 w-8` to `md:h-8 md:w-8`.
  Mobile now inherits the base `.icon-btn` 2.5 rem; desktop stays compact.

### 3.8 `frontend/src/components/ui/primitives.jsx`

- `ActionMenu.updatePosition` reads `--sat/--sab/--sal/--sar` from
  `document.documentElement` (populated by `src/lib/viewport.js`), parses the
  `px` suffix, and folds them into the four-edge clamping math alongside the
  base 8 px inset. No more clipping under notches in landscape.

---

## 4. Points PWA vérifiés

| Item | Status |
|---|---|
| `manifest.webmanifest` generated by `vite-plugin-pwa` | ✓ (in `frontend/vite.config.js:28-59`) |
| `name`, `short_name`, `description`, `start_url`, `scope`, `lang`, `categories` | ✓ |
| `display: standalone`, `orientation: portrait` | ✓ |
| `theme_color` + `background_color` = `#090d16` (match `--bg-main`) | ✓ |
| Icons 192 / 512 / maskable 512 | ✓ (in `frontend/public/icons/`) |
| 180×180 `apple-touch-icon.png` | ✓ (referenced at `index.html:36`) |
| `viewport-fit=cover` meta | ✓ |
| `theme-color` meta matches manifest | ✓ |
| `apple-mobile-web-app-capable=yes` | ✓ |
| `apple-mobile-web-app-status-bar-style=black-translucent` | ✓ |
| `apple-mobile-web-app-title=AppForge` | ✓ |
| `format-detection=telephone=no` | ✓ |
| Pre-paint inline background prevents white flash | ✓ (`index.html:46-50`) |
| Service worker registered via `virtual:pwa-register` | ✓ (`main.jsx:17-26`) |
| `registerType: 'autoUpdate'` + `clientsClaim` + `skipWaiting` | ✓ |
| Workbox precache of app shell | ✓ |
| NetworkFirst for `/api/*` with 6 s timeout | ✓ |
| Navigate fallback to `/index.html`, denylist `/api/*` | ✓ |
| Pinch-zoom allowed (WCAG 1.4.4) | ✓ _fixed in this pass_ |

---

## 5. Points iOS vérifiés

| Item | Status |
|---|---|
| `viewport-fit=cover` — content draws under notch / dynamic island | ✓ |
| `env(safe-area-inset-*)` consumed via `--sat/--sab/--sal/--sar` | ✓ |
| `.safe-top` / `.safe-bottom` / `.safe-x` helpers | ✓ |
| No raw `vh` / `dvh` in the app shell | ✓ _fixed in this pass_ |
| `--app-height` high-water mark (stable across keyboard / orientation) | ✓ (`frontend/src/lib/viewport.js`) |
| Keyboard does not collapse shell | ✓ (keyboard-open detection keeps `--app-height` steady) |
| Inputs at 16 px prevent focus-zoom | ✓ (`.input-base` at `index.css:380`) |
| Login card does not get hidden behind keyboard on iPhone SE | ✓ _fixed in this pass_ |
| Modal sheets anchored to `--app-height`, 4-side safe padding | ✓ |
| NodePanel mobile anchored to `--app-height` | ✓ _fixed in this pass_ |
| No white band at the bottom above the home indicator | ✓ (brand paint on `html/body/#root`) |
| Toast stack floats above the mobile nav | ✓ _fixed in this pass_ |
| MobileNav safe-bottom padding with gradient overlay | ✓ (`.mobile-nav-region`) |
| MobileHeader safe-top padding | ✓ |
| ActionMenu portal respects safe insets in landscape | ✓ _fixed in this pass_ |
| Touch targets on icon buttons ≥ 40 px (Apple HIG) | ✓ _fixed in this pass_ |
| Pre-paint brand background — no white flash on cold start | ✓ |

---

## 6. Points Android vérifiés

| Item | Status |
|---|---|
| Manifest installability (192 + 512 + maskable 512) | ✓ |
| `display: standalone` — fullscreen launcher | ✓ |
| `theme_color` + `background_color` match on splash | ✓ |
| `overscroll-behavior: none` on html/body (no rubber-band) | ✓ |
| Bottom gestures / system bars do not overlap floating nav | ✓ (`safe-bottom` + gradient overlay) |
| WCAG 44 px touch targets | ✓ _fixed in this pass_ |
| Pinch-zoom allowed on non-canvas pages | ✓ _fixed in this pass_ |
| No emoji-glyph flicker in nav (aria-hidden + fixed font-size) | ✓ _improved in this pass_ |

---

## 7. Points UI/UX améliorés

- **Mobile primary CTA** (Header primary action, "Ouvrir" on project card,
  LoginPage submit, NodePanel Save) now meets the 44 px target.
- **Icon buttons** (roadmap tree edit/add/delete, toast dismiss, mobile
  header menu trigger) are 40 px square on mobile — easier to thumb-tap.
- **Gear menu** on project cards is 40 px and no longer collides with the
  "Ouvrir" button because `project-card__primary-action` reserves 3.25 rem
  on mobile.
- **Mobile nav labels** are readable (`11px` + `1.05rem` icon) and the emoji
  is hidden from screen readers.
- **Toast feedback** now appears above the floating nav, not behind it.
- **Links list** no longer horizontally overflows on iPhone SE; long URLs
  wrap and actions stack.
- **Login** form can scroll with the iOS keyboard open on short phones.
- **NodePanel mobile sheet** is bounded by the stable viewport, sticky
  header + sticky footer never clip.
- **NodePanel** closes on `Escape` for keyboard-driven users.
- **Placeholder text** is legible (5.2:1 contrast).
- **Zoom accessibility**: pinch-zoom is re-enabled, meeting WCAG 1.4.4
  without causing iOS input-zoom (inputs remain 16 px on mobile).
- **ActionMenu** does not clip under notches in landscape.

---

## 8. Risques restants / limites éventuelles

- **No physical-device test run.** Fixes were validated via code review,
  `npm run build`, and desktop DevTools device emulation. A physical iPhone
  pass against the checklist in `frontend/docs/PWA_SETUP.md` §8 is still the
  gold standard before a real production release.
- **Emoji nav icons.** MobileNav still uses emoji glyphs (🧭 📦 🔗). These
  render inconsistently across iOS and Android and do not scale cleanly with
  `text-[1.05rem]`. A later pass should replace them with a consistent SVG
  icon set. Not in scope for this hardening pass.
- **No PWA `shortcuts` / `screenshots` / `share_target` in the manifest.**
  All are nice-to-haves that improve the Android install prompt and
  long-press launcher menu. They require designed assets (screenshots) or
  additional product decisions (share target route), so they are documented
  here rather than added blind.
- **No iOS launch images (`apple-touch-startup-image`).** iOS falls back to
  the manifest `background_color` + `apple-touch-icon` splash, which is
  already brand-dark so no white flash. A pixel-perfect splash would need a
  full screen-size matrix (6.1"/6.7" × 1x/2x/3x × portrait/landscape).
- **`devOptions.enabled: false`** in `vite.config.js` — the service worker is
  not served during `vite dev` to keep HMR fast. Validating SW caching
  behavior requires a production build (`npm run build && npm run preview`).
- **ActionMenu safe-area math uses `getComputedStyle`.** That call happens
  only when the menu opens, so performance impact is negligible, but it
  depends on `src/lib/viewport.js` having run first (it always has, because
  `initViewport()` is called before React mounts in `main.jsx:13`).

---

## 9. Checklist finale

### Avant merge

- [x] `frontend/src/index.css` — mobile media block touch-target rules
      added; toast offset corrected; placeholder contrast bumped.
- [x] `frontend/index.html` — viewport meta relaxed.
- [x] `frontend/src/components/projects/NodePanel.jsx` — raw `vh` replaced
      by `--app-height` calc; Escape handler added.
- [x] `frontend/src/components/layout/MobileNav.jsx` — font + icon sizes
      bumped; `aria-hidden` on emoji.
- [x] `frontend/src/components/layout/LinksView.jsx` — row stacking +
      URL wrap.
- [x] `frontend/src/components/auth/LoginPage.jsx` — scrollable root.
- [x] `frontend/src/components/roadmap/TreeNode.jsx` — IconButton size
      overrides scoped to `md:`.
- [x] `frontend/src/components/ui/primitives.jsx` — ActionMenu safe-area
      math.
- [x] `npm run build` succeeds.

### After merge (physical-device pass)

- [ ] iPhone 14 Pro (Dynamic Island) Safari — install, launch, verify:
      no white bar at bottom, no content behind notch, rotation stable,
      keyboard safe, modals + NodePanel never clip, toast visible above nav.
- [ ] iPhone SE (3rd gen) — LoginPage usable with keyboard, card scrolls.
- [ ] Pixel 7 / any Android 12+ — install, launch, verify: splash dark,
      standalone mode, gesture nav safe, toasts above floating nav.
- [ ] Chrome desktop ≥ 1440 px — verify no visual regression.
- [ ] Lighthouse PWA audit — still green, no zoom-lock warning.
