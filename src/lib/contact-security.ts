import "server-only";

const globalRateLimits = globalThis as typeof globalThis & { __rashiContactLimits?: Map<string, { count: number; resetAt: number }> };
const limits = globalRateLimits.__rashiContactLimits ?? new Map<string, { count: number; resetAt: number }>();
globalRateLimits.__rashiContactLimits = limits;

export function contactRateLimit(request: Request, scope: string, limit = 6) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "local";
  const key = `${scope}:${ip}`;
  const now = Date.now();
  const current = limits.get(key);
  if (!current || current.resetAt <= now) {
    limits.set(key, { count: 1, resetAt: now + 10 * 60 * 1000 });
    return true;
  }
  current.count += 1;
  return current.count <= limit;
}

export function cleanText(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.replace(/\u0000/g, "").trim().slice(0, maxLength) : "";
}

export function validEmail(value: string) {
  return value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && !/[\r\n]/.test(value);
}

export function jsonError(message: string, status: number) {
  return Response.json({ error: message }, { status, headers: { "Cache-Control": "no-store" } });
}
