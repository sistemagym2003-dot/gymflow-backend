const GYMFLOW_ORIGIN =
  process.env.FRONTEND_URL_GYMFLOW ??
  process.env.FRONTEND_URL ??
  "http://localhost:3000";

const PRIMEFITNESS_ORIGIN = process.env.FRONTEND_URL_PRIMEFITNESS;

const LOCALHOST_ORIGIN = "http://localhost:3000";

function normalize(url: string): string {
  return url.endsWith("/") ? url.slice(0, -1) : url;
}

const normalizedGymflow = normalize(GYMFLOW_ORIGIN);
const normalizedPrime =
  PRIMEFITNESS_ORIGIN != null ? normalize(PRIMEFITNESS_ORIGIN) : null;
const normalizedLocalhost = normalize(LOCALHOST_ORIGIN);

function resolveAllowedOrigin(origin?: string | null): string {
  if (!origin) {
    return GYMFLOW_ORIGIN;
  }

  const normalizedOrigin = normalize(origin);

  if (normalizedOrigin === normalizedLocalhost) {
    return origin;
  }

  if (normalizedOrigin === normalizedGymflow) {
    return origin;
  }

  if (normalizedPrime && normalizedOrigin === normalizedPrime) {
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

