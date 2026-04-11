/**
 * Viewport sizing utility — robust iOS PWA fullscreen.
 *
 * Why this file exists
 * --------------------
 * On iOS (especially when installed as a PWA via "Add to Home Screen"),
 * neither `100vh` nor `100dvh` are reliable as a fullscreen base:
 *
 *   - 100vh ignores the dynamic toolbar and leaves a white gap at the bottom.
 *   - 100dvh tracks the *current* visual viewport — which means it shrinks
 *     while the on-screen keyboard is open, then fails to recover cleanly.
 *   - visualViewport events fire inconsistently right after launch / rotation.
 *   - window.innerHeight reports wrong values for a few hundred ms after
 *     the PWA starts, especially on iOS 17/18.
 *
 * Strategy
 * --------
 * We expose two CSS custom properties on <html>:
 *
 *   --app-height   stable fullscreen height (high-water mark — "as tall as
 *                  we've ever seen the layout viewport"). Used by the shell
 *                  container (.app-viewport) so the UI never collapses when
 *                  the keyboard opens and never leaks a white band at the
 *                  bottom after rotation.
 *
 *   --vvh          current visible height (visualViewport.height when
 *                  available, else innerHeight). Use this only for elements
 *                  that MUST follow the keyboard (e.g. a sticky composer).
 *
 * Plus the 4 safe-area insets as `--sat / --sab / --sal / --sar` so they can
 * be consumed from anywhere in the CSS.
 *
 * The high-water mark is reset on real orientation changes (landscape <->
 * portrait). This is critical because after rotating the "correct" height
 * changes, so the previous maximum is no longer meaningful.
 *
 * After launch we also run a short stabilization loop (a handful of RAFs +
 * a few timeouts) because iOS can lie about innerHeight for the first
 * few frames of a cold PWA start.
 */

const HTML = typeof document !== 'undefined' ? document.documentElement : null

let highWaterHeight = 0
let lastOrientation = null
let stabilizing = false
let stabilizeTimers = []
let rafId = 0
let attached = false
let detachFns = []

/** True when the two dimensions describe the same orientation. */
function currentOrientation() {
  if (typeof window === 'undefined') return 'portrait'
  return window.innerWidth > window.innerHeight ? 'landscape' : 'portrait'
}

/** Read the "layout" viewport height — the one we want to lock to. */
function readLayoutHeight() {
  if (typeof window === 'undefined') return 0
  // window.innerHeight is the layout viewport; on iOS PWA it matches the
  // full screen minus the status bar / home indicator chrome — which is
  // exactly what we want for the app shell.
  return window.innerHeight || 0
}

/** Read the CURRENT visible viewport (shrinks when the keyboard opens). */
function readVisibleHeight() {
  if (typeof window === 'undefined') return 0
  const vv = window.visualViewport
  if (vv && vv.height) return vv.height
  return window.innerHeight || 0
}

function setVar(name, px) {
  if (!HTML || !Number.isFinite(px) || px <= 0) return
  HTML.style.setProperty(name, `${px}px`)
}

/** Write safe-area insets to CSS vars so JS code (and any element) can read them. */
function writeSafeAreaVars() {
  // env() values can't be read directly from JS, so we paint them via CSS
  // on :root in index.css. We just ensure they exist as fallbacks here.
  if (!HTML) return
  const styles = ['--sat', '--sab', '--sal', '--sar']
  for (const name of styles) {
    if (!HTML.style.getPropertyValue(name)) {
      HTML.style.setProperty(name, '0px')
    }
  }
}

/**
 * The main sync. Writes --app-height (stable, high-water mark) and --vvh
 * (live visible height). Called on every relevant event + during the
 * stabilization boot loop.
 */
function sync({ resetHighWater = false } = {}) {
  if (!HTML) return

  const orientation = currentOrientation()
  if (lastOrientation && orientation !== lastOrientation) {
    // Real orientation change: the previous maximum is meaningless.
    highWaterHeight = 0
  } else if (resetHighWater) {
    highWaterHeight = 0
  }
  lastOrientation = orientation

  const layout = readLayoutHeight()
  const visible = readVisibleHeight()

  // --vvh: live visible height — OK to go down.
  if (visible > 0) setVar('--vvh', visible)

  if (layout <= 0) return

  // Keyboard detection: when the keyboard opens, visible << layout. In that
  // case we MUST NOT shrink --app-height, otherwise the whole shell jumps.
  const keyboardLikelyOpen = visible > 0 && layout - visible > 120

  if (keyboardLikelyOpen) {
    // Keep the last known stable height. Don't update the high-water mark
    // with a shrunken value either.
    if (highWaterHeight > 0) setVar('--app-height', highWaterHeight)
    return
  }

  if (layout > highWaterHeight) {
    highWaterHeight = layout
  }

  // Use the high-water mark so we never dip below a known-good height.
  setVar('--app-height', Math.max(highWaterHeight, layout))
}

/**
 * Initial stabilization loop. On iOS PWA launch we need several reads
 * spread across a few hundred ms because:
 *
 *   1. First frame:  innerHeight is often wrong.
 *   2. After RAF:    layout settles.
 *   3. After 100ms:  status bar compositing finalized.
 *   4. After 300ms:  visualViewport events flush.
 *   5. After 700ms:  any animated chrome (dynamic island) stabilized.
 */
function stabilize() {
  if (stabilizing) return
  stabilizing = true
  cancelStabilize() // clear previous timers

  // Immediate
  sync({ resetHighWater: true })

  // A few RAFs
  const rafSync = () => sync()
  rafId = requestAnimationFrame(() => {
    rafSync()
    rafId = requestAnimationFrame(rafSync)
  })

  // Timed snapshots
  const schedule = [60, 150, 300, 700, 1500]
  for (const delay of schedule) {
    const t = window.setTimeout(() => sync(), delay)
    stabilizeTimers.push(t)
  }

  // End of stabilization window
  const endT = window.setTimeout(() => {
    stabilizing = false
  }, 1600)
  stabilizeTimers.push(endT)
}

function cancelStabilize() {
  if (rafId) cancelAnimationFrame(rafId)
  rafId = 0
  for (const t of stabilizeTimers) clearTimeout(t)
  stabilizeTimers = []
}

/** Install all listeners. Idempotent. Returns a teardown function. */
export function initViewport() {
  if (typeof window === 'undefined') return () => {}
  if (attached) return teardown
  attached = true

  writeSafeAreaVars()
  stabilize()

  const onResize = () => sync()
  const onOrientation = () => {
    // Orientation changed: force a high-water reset on the very next sync,
    // then re-run a short stabilization because iOS lies during the anim.
    cancelStabilize()
    stabilizing = false
    stabilize()
  }
  const onPageShow = (e) => {
    // Back/forward cache restore → re-measure from scratch.
    if (e && e.persisted) {
      cancelStabilize()
      stabilizing = false
      stabilize()
    } else {
      sync()
    }
  }
  const onVisibility = () => {
    if (document.visibilityState === 'visible') {
      // Coming back from background — the previous numbers may be stale.
      sync()
    }
  }

  window.addEventListener('resize', onResize, { passive: true })
  window.addEventListener('orientationchange', onOrientation, { passive: true })
  window.addEventListener('pageshow', onPageShow)
  document.addEventListener('visibilitychange', onVisibility)

  detachFns.push(() => window.removeEventListener('resize', onResize))
  detachFns.push(() => window.removeEventListener('orientationchange', onOrientation))
  detachFns.push(() => window.removeEventListener('pageshow', onPageShow))
  detachFns.push(() => document.removeEventListener('visibilitychange', onVisibility))

  const vv = window.visualViewport
  if (vv) {
    const onVVResize = () => sync()
    const onVVScroll = () => {
      // visualViewport.scroll happens on keyboard show/hide on iOS.
      // We use it only to refresh --vvh, not --app-height.
      const visible = readVisibleHeight()
      if (visible > 0) setVar('--vvh', visible)
    }
    vv.addEventListener('resize', onVVResize)
    vv.addEventListener('scroll', onVVScroll)
    detachFns.push(() => vv.removeEventListener('resize', onVVResize))
    detachFns.push(() => vv.removeEventListener('scroll', onVVScroll))
  }

  return teardown
}

function teardown() {
  cancelStabilize()
  for (const fn of detachFns) {
    try { fn() } catch { /* noop */ }
  }
  detachFns = []
  attached = false
}

/** Force a resync (e.g. after a layout-impacting transition). */
export function syncViewport() {
  sync()
}
