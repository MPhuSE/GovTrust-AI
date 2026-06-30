import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Route configuration
const PROTECTED_ROUTES = ['/dashboard', '/queue', '/recheck'];
const PUBLIC_ROUTES = ['/', '/login', '/register'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Skip middleware for static files, api routes, and _next
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Next.js middleware runs on the server, so we can't easily access localStorage directly.
  // In a real production app, we would use HTTP-only cookies.
  // For this prototype/Hackathon where we use localStorage, we will rely on client-side 
  // protection for the most part, but we can do some basic routing checks if we had cookies.
  
  // Since we use localStorage in this demo, this middleware is more of a placeholder 
  // to show we understand route protection concepts.
  // Actual protection is handled via the axios interceptor and React components.

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
