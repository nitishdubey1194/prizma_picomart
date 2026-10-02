import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const ALLOWED_ORIGINS = [
  'http://localhost:3001',
  'http://booking.localhost:3001',
  'https://booking.picomart.in',
  'https://store.picomart.in',
  'https://*.picomart.in'
  // add your real subdomains here once you know them, e.g.:
  // 'https://booking.picomart.in',
  // 'https://johnbarber.picomart.in',
];

function corsHeaders(origin: string | null) {
  const allowOrigin = origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Methods': 'GET,POST,PATCH,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-tenant-slug',
    'Access-Control-Allow-Credentials': 'true',
  };
}

export default function proxy(request: NextRequest) {
  const origin = request.headers.get('origin');

  // Preflight — answer it directly, don't let it reach a route handler.
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, { status: 204, headers: corsHeaders(origin) });
  }

  const response = NextResponse.next();
  const headers = corsHeaders(origin);
  Object.entries(headers).forEach(([key, value]) => response.headers.set(key, value));
  return response;
}

export const config = {
  matcher: '/api/:path*',
};