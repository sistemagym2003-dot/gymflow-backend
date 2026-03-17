const GYMFLOW_ORIGIN =
  process.env.FRONTEND_URL_GYMFLOW ??
  process.env.FRONTEND_URL ??
  "http://localhost:3000";

const PRIMEFITNESS_ORIGIN = process.env.FRONTEND_URL_PRIMEFITNESS;

const LOCALHOST_ORIGIN = "http://localhost:3000";

const ALLOWED_ORIGINS = [
  GYMFLOW_ORIGIN,
  PRIMEFITNESS_ORIGIN,
  LOCALHOST_ORIGIN,
].filter(Boolean) as string[];

function resolveAllowedOrigin(origin?: string | null): string {
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    return origin;
  }
  return GYMFLOW_ORIGIN;
}

export function getCorsHeaders(origin?: string | null): Record<string, string> {
  const allowOrigin = resolveAllowedOrigin(origin ?? null);
  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Methods": "GET, POST, PATCH, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400",
  };
}

