// /lib/rate-limit.js
// Database-backed rate limiting. An in-memory counter (which this project
// briefly had, unused, in lib/auth.js) doesn't work correctly across
// serverless instances or restarts — every cold start resets it to zero,
// so it provides no real protection in production. This uses Postgres
// instead, which is already available and correctly shared across every
// instance.
import { prisma } from '@/lib/prisma';

/**
 * Checks and records an attempt against a rate limit key.
 * @param {string} key - scoped identifier, e.g. "login:ip:1.2.3.4"
 * @param {number} maxAttempts - attempts allowed within the window
 * @param {number} windowSeconds - the sliding window size
 * @returns {Promise<{allowed: boolean, remaining: number, retryAfterSeconds: number}>}
 */
export async function checkRateLimit(key, maxAttempts, windowSeconds) {
  const windowStart = new Date(Date.now() - windowSeconds * 1000);

  const count = await prisma.rateLimitAttempt.count({
    where: { key, createdAt: { gte: windowStart } },
  });

  if (count >= maxAttempts) {
    return { allowed: false, remaining: 0, retryAfterSeconds: windowSeconds };
  }

  await prisma.rateLimitAttempt.create({ data: { key } });
  return { allowed: true, remaining: maxAttempts - count - 1, retryAfterSeconds: 0 };
}

/** Best-effort real client IP extraction behind Vercel/most proxies. */
export function getClientIp(request) {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return request.headers.get('x-real-ip') || 'unknown';
}

/** Deletes rate-limit rows older than 24h — call periodically (the daily cron does this). */
export async function cleanupOldRateLimitAttempts() {
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
  await prisma.rateLimitAttempt.deleteMany({ where: { createdAt: { lt: cutoff } } });
}
