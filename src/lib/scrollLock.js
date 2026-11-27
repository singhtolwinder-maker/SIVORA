/**
 * Shared body scroll lock.
 *
 * Every overlay used to capture `document.body.style.overflow` on open and write
 * it back on close. When two overlays overlap - the cart opened while the
 * preloader curtain was still up, for example - the second one restored a
 * snapshot that already said "hidden", and the page stayed unscrollable after
 * both closed. Reference counting fixes the ordering: only the last release
 * writes anything, and it restores the value from before the first lock.
 *
 * Usage:
 *   useEffect(() => {
 *     if (!open) return undefined;
 *     return lockBodyScroll();
 *   }, [open]);
 */
let activeLocks = 0;
let restoreTo = "";

export function lockBodyScroll() {
  const body = document.body;
  if (activeLocks === 0) restoreTo = body.style.overflow;
  activeLocks += 1;
  body.style.overflow = "hidden";

  let released = false;
  return () => {
    // React can run a cleanup twice in development StrictMode; releasing the
    // same lock twice would drive the counter negative and unlock the page
    // while another overlay is still open.
    if (released) return;
    released = true;
    activeLocks = Math.max(0, activeLocks - 1);
    if (activeLocks === 0) body.style.overflow = restoreTo;
  };
}
