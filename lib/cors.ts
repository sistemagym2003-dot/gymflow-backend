const ALLOW_ORIGIN = process.env.FRONTEND_URL ?? "http://localhost:3000";

export function getCorsHeaders(origin?: string | null): Record<string, string> {
  const allowOrigin =
    origin && (origin === ALLOW_ORIGIN || origin.startsWith("http://localhost"))
      ? origin
      : ALLOW_ORIGIN;
  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Methods": "GET, POST, PATCH, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400",
  };
}
