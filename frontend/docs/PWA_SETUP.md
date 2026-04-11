# AppForge — PWA setup & iOS viewport strategy

This document explains how AppForge is wired as an installable PWA and how we
defeat the "white bar at the bottom" / "gap under the app" bug that plagues
React + Vite apps once they are added to the iPhone home screen.

It is meant to be read by anyone touching layout, modals, fullscreen screens,
the bottom nav or the service worker — basically anyone modifying
`frontend/src/*` or `frontend/index.html`.

---

## 1. High-level overview

AppForge is a Vite + React app that is now also a PWA. Three pieces make it
installable and fullscreen-safe:

| Concern                             | Implementation                                       |
| ----------------------------------- | ---------------------------------------------------- |
| Installability (Android + iOS + PC) | `vite-plugin-pwa` generates the manifest + SW        |
| Meta tags (Apple standalone, theme) | `frontend/index.html` head                           |
| Stable fullscreen height on iOS     | `frontend/src/lib/viewport.js` + `.app-viewport` CSS |
| Safe areas (notch / home indicator) | CSS vars `--sat / --sab / --sal / --sar`             |

---

## 2. What was added / changed

### New files

- `frontend/public/favicon.svg`
- `frontend/public/apple-touch-icon.png` (180×180)
- `frontend/public/icons/icon-192.png`
- `frontend/public/icons/icon-512.png`
- `frontend/public/icons/icon-maskable-512.png`
- `frontend/src/lib/viewport.js` — the robust iOS viewport utility
- `frontend/docs/PWA_SETUP.md` — this file

### Modified

- `frontend/package.json` — adds `vite-plugin-pwa` devDependency
- `frontend/vite.config.js` — registers the PWA plugin (manifest + SW + workbox)
- `frontend/index.html` — full set of PWA + Apple meta tags, pre-paint background
- `frontend/src/main.jsx` — boots the viewport utility and registers the SW
- `frontend/src/index.css` — adds safe-area vars, `.app-viewport`, `.safe-*`, `.modal-*`
- `frontend/src/App.jsx` — `ProtectedLayout` now uses `.app-viewport`
- `frontend/src/components/layout/MobileNav.jsx` — no more `position: fixed`; sits
  as a flex child + paints the bottom safe area
- `frontend/src/components/auth/LoginPage.jsx` — no more `min-h-screen`; uses
  `.app-viewport` + safe area classes
- `frontend/src/components/ui/primitives.jsx` — `Modal` is now built on
  `.modal-overlay` / `.modal-sheet` / `.modal-scroll`

---

## 3. Installing

### Android (Chrome / Edge / Samsung Internet)

1. Open the app over HTTPS (or `http://localhost` in dev).
2. Menu → "Install app" / "Add to Home screen".
3. Launch from the home screen — it runs in standalone mode with the brand
   status bar color (`#090d16`).

### iPhone / iPad (Safari)

Apple does not support the `beforeinstallprompt` event; the user must manually:

1. Tap the **Share** icon.
2. Choose **Add to Home Screen**.
3. Tap **Add**.
4. Launch from the home screen.

As soon as the app launches from the home screen, Safari honors:

- `apple-mobile-web-app-capable` → fullscreen standalone
- `apple-mobile-web-app-status-bar-style="black-translucent"` → the status bar
  is transparent and our content sits behind it
- `apple-mobile-web-app-title` → "AppForge" under the icon
- `apple-touch-icon.png` → the home-screen icon

### Desktop (Chrome / Edge)

Look for the install icon in the URL bar, or use
Menu → "Install AppForge…". The app opens in its own window and still uses
`100dvh` (see §4) because the iOS stabilization logic is a no-op on desktop
browsers.

---

## 4. The iOS viewport bug (and how we fix it)

### The bug

On iOS, when you install a React+Vite app via "Add to Home Screen", you
typically see one of these three failures:

1. **White band at the bottom** above the home indicator — because the app
   drew to `100vh` which is shorter than the real screen, leaving Safari's
   default white behind.
2. **Content collapses when the keyboard opens** — because the layout is
   anchored to `100dvh` or `visualViewport.height`, which shrinks with the
   keyboard; the whole UI reflows and the header jumps.
3. **Height wrong for the first 200 ms of launch** — iOS reports a stale
   `window.innerHeight` during the first few frames after the PWA cold-starts.

### The fix

We expose two CSS custom properties on `<html>`, updated by
`frontend/src/lib/viewport.js`:

```
--app-height   stable fullscreen height (high-water mark).
--vvh          live visible viewport (shrinks with the keyboard).
```

**Always use `--app-height` for the app shell and modals**. Use `--vvh` only
for widgets that MUST track the keyboard (currently: none).

The utility:

1. Sets `--app-height` to `window.innerHeight` (the layout viewport).
2. Uses a **high-water mark**: `--app-height` never shrinks below its largest
   observed value unless the orientation actually changes. This means the
   keyboard opening does NOT collapse the shell.
3. On real orientation change (portrait ↔ landscape) the high-water mark is
   reset — otherwise the previous max would be meaningless.
4. Runs a **stabilization loop** on boot: immediate sync + 2 RAFs + timers at
   60 / 150 / 300 / 700 / 1500 ms. This rides through the unreliable first
   frames of an iOS PWA cold start.
5. Subscribes to `resize`, `orientationchange`, `pageshow`, `visibilitychange`,
   `visualViewport.resize` and `visualViewport.scroll`.
6. Distinguishes "keyboard likely open" (visible viewport much smaller than
   layout viewport) and in that case holds `--app-height` steady.

### The CSS

```css
.app-viewport {
  position: fixed;
  inset: 0;
  height: var(--app-height, 100dvh); /* <- the magic line */
  width: 100%;
  background-color: var(--bg-main);
  display: flex;
  overflow: hidden;
}

@media (min-width: 768px) {
  .app-viewport {
    position: relative;
    inset: auto;
    height: 100dvh; /* desktop is fine with 100dvh */
  }
}
```

The `position: fixed; inset: 0` is only applied below the `md` breakpoint
because that is where iOS PWA lives. Desktop falls back to a relative box
with `100dvh`, which avoids accidentally eating the browser chrome.

### Safe areas

`:root` defines the four insets so any element can consume them:

```css
:root {
  --sat: env(safe-area-inset-top, 0px);
  --sab: env(safe-area-inset-bottom, 0px);
  --sal: env(safe-area-inset-left, 0px);
  --sar: env(safe-area-inset-right, 0px);
}
```

Helpers:

- `.safe-top` → `padding-top: var(--sat)`
- `.safe-bottom` → `padding-bottom: var(--sab)`
- `.safe-x` → horizontal insets (landscape notches)

The key trick: whatever element uses `.safe-bottom` must either have its own
background OR be inside an ancestor with a brand-colored background. In
AppForge, `.app-viewport` always paints `--bg-main`, so the home-indicator
zone is always brand-dark and never white.

### Pre-paint

`index.html` inlines this style **before** any JS / CSS loads:

```html
<style>
  html, body, #root { background-color: #090d16; }
</style>
```

That way, between the HTML parse and the first React render, the screen is
already brand-dark. No white flash on PWA cold start.

---

## 5. Writing new fullscreen screens

### DO

- Put the outermost container on `.app-viewport` (or rely on the
  `ProtectedLayout` wrapper which already does it).
- Use `.app-scroll` for an internal scroll container that fills the remaining
  space. Never put `overflow-y: auto` on the body.
- Use `.safe-top / .safe-bottom / .safe-x` to respect notches and the home
  indicator.
- Use `font-size: 16px` or larger on `<input>` — already enforced by
  `.input-base` on mobile. This is what stops iOS Safari from zooming into
  an input on focus.

### DON'T

- ❌ `min-h-screen`, `h-screen`, `h-[100vh]`, `h-[100dvh]` on the outer shell.
- ❌ `fixed inset-0` combined with a fixed height hack for a modal.
- ❌ `max-h-[90dvh]` for modal bodies — use `.modal-scroll` inside a `.modal-sheet`.
- ❌ Reading `visualViewport.height` directly in React — use the CSS vars.
- ❌ Adding `<div className="fixed bottom-0 ...">` at the root. Put the bar
  inside the `.app-viewport` flex column so it naturally respects the stable
  height.

---

## 6. Writing new modals / overlays

Always use the three modal classes together:

```jsx
<div className="modal-overlay">
  <div className="modal-sheet">
    {/* sticky header */}
    <div className="border-b border-border-subtle px-6 pb-4 pt-5">
      <h2>Title</h2>
    </div>

    {/* scrollable body */}
    <div className="modal-scroll px-6 py-5">
      {/* long content goes here */}
    </div>

    {/* sticky footer */}
    <div className="border-t border-border-subtle px-6 py-4">
      <button>Save</button>
    </div>
  </div>
</div>
```

Or use the shared `<Modal>` component from `components/ui/primitives.jsx` —
which internally does exactly this.

The key properties:

- `.modal-overlay { height: var(--app-height, 100dvh); }` — anchors to the
  stable viewport so the sheet never gets clipped by the iOS keyboard.
- `.modal-overlay` pads itself by all four safe area insets.
- `.modal-scroll { overscroll-behavior: contain; }` — momentum scrolling in
  the modal body never bubbles to the shell.
- On mobile (`max-width: 640px`) the sheet sticks to the bottom like a native
  action sheet and its rounded top edge hugs the content area.

---

## 7. Service worker / caching

`vite-plugin-pwa` is configured with workbox:

- **Precache** all JS / CSS / HTML / icons / fonts (SHA-based, generated at
  build time).
- **Navigate fallback** → `/index.html` so client-side routing works offline.
- **Runtime caching**:
  - `fonts.googleapis.com` → `StaleWhileRevalidate`
  - `fonts.gstatic.com` → `CacheFirst` (one year)
  - `/api/*` → `NetworkFirst` with a 6 s timeout and a 1 day fallback cache
- `registerType: 'autoUpdate'` + `skipWaiting` / `clientsClaim` — the SW
  updates silently in the background, so users always get the latest shell
  on the next navigation.

Registration is done in `src/main.jsx` via the `virtual:pwa-register` module,
guarded behind a `'serviceWorker' in navigator` check.

---

## 8. Testing

### Local build

```bash
cd frontend
npm install
npm run build
npm run preview -- --host 0.0.0.0
```

Then open `http://<your-local-ip>:4173` on your phone (same Wi-Fi) or tunnel
through ngrok / Cloudflare Tunnel for HTTPS (required for SW on iOS).

### iPhone

1. Open the tunneled HTTPS URL in Safari.
2. Share → Add to Home Screen.
3. Launch the icon.
4. Validate:
   - [ ] No white bar at the bottom above the home indicator.
   - [ ] Rotating portrait ↔ landscape does NOT leave a gap.
   - [ ] Focusing an input does NOT collapse the shell.
   - [ ] After closing the keyboard the shell returns to full height.
   - [ ] Backgrounding and reopening the app keeps the layout correct.
   - [ ] Modals (project import, version history) never clip below the home
         indicator and their body scrolls cleanly.

### Android

1. Open the HTTPS URL in Chrome.
2. Menu → "Install app".
3. Launch the icon.
4. Validate:
   - [ ] The splash screen uses the brand dark background (no white flash).
   - [ ] The status bar is dark and colors match `#090d16`.
   - [ ] Back button works as "go back in history" and does not leave the app
         on the first screen.

### Desktop

1. Load the app in Chrome / Edge.
2. Install via the URL bar icon.
3. Validate:
   - [ ] The window opens in its own frame.
   - [ ] Sidebar is visible, MobileNav is hidden.
   - [ ] Resizing the window does not cause layout jumps.
   - [ ] Modals remain usable at 1440 × 900 and 375 × 812 emulation.

---

## 9. Known limitations / next steps

- **Icons are generated from a simple gradient + "AF" glyph** (192 / 512 /
  maskable 512 / apple-touch 180). For App Store-quality branding, provide
  a real designed PNG set and drop them into `frontend/public/icons/` and
  `frontend/public/apple-touch-icon.png`. No code change is required.
- **`devOptions.enabled: false`** in `vite.config.js`: the SW is NOT served
  during `vite dev` to keep HMR fast. Set it to `true` when you need to
  debug caching locally.
- **No push notifications** — out of scope here. If added later, the SW
  generated by vite-plugin-pwa can be extended via `srcDir` + `filename`
  to inject custom handlers.
- **iOS 14 and older** don't honor the web app manifest; they use only the
  `apple-*` meta tags. That is already fine here.
