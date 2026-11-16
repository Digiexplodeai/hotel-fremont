/**
 * HOTEL FREMONT - CENTRALIZED SMOOTH SCROLL & SCROLL-LOCK MANAGER
 * 
 * Works harmoniously with Lenis smooth scrolling and native window scroll.
 * Handles fixed header offsets via CSS scroll-mt-20 / scroll-margin-top,
 * anchor hash extraction, and safe reference-counted scroll locking for modals & mobile menus.
 */

let activeScrollLocks = 0;

/**
 * Freeze background page scrolling while modals or mobile navigation are open.
 * Integrates directly with Lenis to prevent background wheel events.
 */
export function lockScroll(): void {
  if (typeof window === "undefined") return;
  activeScrollLocks++;
  if (activeScrollLocks === 1) {
    document.body.style.overflow = "hidden";
    const lenis = (window as any).__lenis;
    if (lenis && typeof lenis.stop === "function") {
      lenis.stop();
    }
  }
}

/**
 * Restore background page scrolling when all modals and menus are closed.
 */
export function unlockScroll(): void {
  if (typeof window === "undefined") return;
  activeScrollLocks = Math.max(0, activeScrollLocks - 1);
  if (activeScrollLocks === 0) {
    document.body.style.overflow = "";
    const lenis = (window as any).__lenis;
    if (lenis && typeof lenis.start === "function") {
      lenis.start();
    }
  }
}

/**
 * Extract clean target element ID from any href format:
 * "/#rooms" -> "rooms"
 * "#rooms" -> "rooms"
 * "rooms" -> "rooms"
 */
export function extractTargetId(href: string): string {
  if (!href) return "";
  return href.replace(/^.*#/, "").trim();
}

/**
 * Smoothly scroll to a section by ID or hash, accounting for the fixed header offset
 * via CSS scroll-margin-top (scroll-mt-20 lg:scroll-mt-24).
 */
export function scrollToSection(sectionIdOrHash: string, duration = 1.0): boolean {
  if (typeof window === "undefined") return false;

  const targetId = extractTargetId(sectionIdOrHash);
  if (!targetId) return false;

  const targetEl = document.getElementById(targetId);
  if (!targetEl) return false;

  const lenis = (window as any).__lenis;
  if (lenis && typeof lenis.scrollTo === "function") {
    // Lenis automatically respects the element's CSS scroll-margin-top
    lenis.scrollTo(targetEl, {
      duration,
      immediate: false,
    });
  } else {
    // Native scrollIntoView automatically respects CSS scroll-margin-top
    targetEl.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  return true;
}

/**
 * Handle navigation to a section:
 * - If on homepage: smooth scrolls to the section and updates browser hash.
 * - If on another page: navigates to `/#section`.
 */
export function navigateToSection(href: string, onComplete?: () => void): void {
  if (typeof window === "undefined") return;

  const targetId = extractTargetId(href);
  const isHomepage = window.location.pathname === "/" || window.location.pathname === "";

  if (!isHomepage && href.startsWith("/")) {
    if (onComplete) onComplete();
    window.location.href = href;
    return;
  }

  const success = scrollToSection(targetId);
  if (success) {
    try {
      history.pushState(null, "", `#${targetId}`);
    } catch {}
    if (onComplete) onComplete();
  } else if (href.startsWith("/")) {
    if (onComplete) onComplete();
    window.location.href = href;
  }
}
