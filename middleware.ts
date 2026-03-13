import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const ALLOW_ORIGIN = process.env.FRONTEND_URL ?? "http://localhost:3000";

function corsHeaders(origin: string | null): Record<string, string> {
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

export function middleware(request: NextRequest) {
  const origin = request.headers.get("Origin");
  const headers = corsHeaders(origin);

  if (request.method === "OPTIONS") {
    return new NextResponse(null, { status: 204, headers });
  }

  const response = NextResponse.next();
  Object.entries(headers).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  return response;
}

export const config = {
  matcher: "/api/:path*",
};
