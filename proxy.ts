import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const ALLOWED_ORIGINS = [
  'http://localhost:3001',
  'http://booking.localhost:3001',
  'https://booking.picomart.in',
  'https://store.picomart.in',
];

function isAllowedOrigin(origin: string | null): boolean {
  if (!origin) return false;
  if (ALLOWED_ORIGINS.includes(origin)) return true;

  try {
    const url = new URL(origin);
    return (
      (url.protocol === 'https:' && (url.hostname === 'picomart.in' || url.hostname.endsWith('.picomart.in'))) ||
      (url.protocol === 'http:' && url.port === '3001' && url.hostname.endsWith('.localhost'))
    );
  } catch {
    return false;
  }
}

function corsHeaders(origin: string | null) {
  const allowOrigin = isAllowedOrigin(origin) ? origin! : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Vary': 'Origin',
    'Access-Control-Allow-Methods': 'GET,POST,PATCH,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-tenant-slug, x-tenant-id',
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