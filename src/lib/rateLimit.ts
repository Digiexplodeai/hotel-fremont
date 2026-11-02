interface RateLimitEntry {
  attempts: number;
  firstAttemptAt: number;
  lockedUntil?: number;
}

const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes
const ATTEMPT_WINDOW_MS = 15 * 60 * 1000; // 15-minute sliding window

// In-memory rate-limit store
const rateLimitStore = new Map<string, RateLimitEntry>();

// Clean up stale entries every 15 minutes
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of rateLimitStore.entries()) {
      if (entry.lockedUntil && entry.lockedUntil < now) {
        rateLimitStore.delete(key);
      } else if (!entry.lockedUntil && now - entry.firstAttemptAt > ATTEMPT_WINDOW_MS) {
        rateLimitStore.delete(key);
      }
    }
  }, 15 * 60 * 1000).unref?.();
}

/**
 * Checks if an identifier (IP address or email) is currently rate-limited.
 */
export function checkRateLimit(key: string): {
  isLocked: boolean;
  remainingAttempts: number;
  retryAfterMinutes?: number;
} {
  const now = Date.now();
  const entry = rateLimitStore.get(key);

  if (!entry) {
    return { isLocked: false, remainingAttempts: MAX_ATTEMPTS };
  }

  // Check active lockout
  if (entry.lockedUntil && entry.lockedUntil > now) {
    const retryAfterMinutes = Math.max(1, Math.ceil((entry.lockedUntil - now) / 60000));
    return { isLocked: true, remainingAttempts: 0, retryAfterMinutes };
  }

  // If lockout expired, reset
  if (entry.lockedUntil && entry.lockedUntil <= now) {
    rateLimitStore.delete(key);
    return { isLocked: false, remainingAttempts: MAX_ATTEMPTS };
  }

  // Check window expiry
  if (now - entry.firstAttemptAt > ATTEMPT_WINDOW_MS) {
    rateLimitStore.delete(key);
    return { isLocked: false, remainingAttempts: MAX_ATTEMPTS };
  }

  const remaining = Math.max(0, MAX_ATTEMPTS - entry.attempts);
  return { isLocked: false, remainingAttempts: remaining };
}

/**
 * Records a failed login attempt. If attempts exceed MAX_ATTEMPTS, locks the account/IP.
 */
export function recordFailedAttempt(key: string): {
  isLocked: boolean;
  remainingAttempts: number;
  retryAfterMinutes?: number;
} {
  const now = Date.now();
  let entry = rateLimitStore.get(key);

  if (!entry || (entry.lockedUntil && entry.lockedUntil <= now) || (now - entry.firstAttemptAt > ATTEMPT_WINDOW_MS)) {
    entry = { attempts: 1, firstAttemptAt: now };
  } else {
    entry.attempts += 1;
  }

  if (entry.attempts >= MAX_ATTEMPTS) {
    entry.lockedUntil = now + LOCKOUT_DURATION_MS;
    rateLimitStore.set(key, entry);
    const retryAfterMinutes = Math.ceil(LOCKOUT_DURATION_MS / 60000);
    return { isLocked: true, remainingAttempts: 0, retryAfterMinutes };
  }

  rateLimitStore.set(key, entry);
  return { isLocked: false, remainingAttempts: MAX_ATTEMPTS - entry.attempts };
}

/**
 * Resets rate limit on successful authentication.
 */
export function resetRateLimit(key: string): void {
  rateLimitStore.delete(key);
}

