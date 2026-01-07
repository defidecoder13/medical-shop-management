import { NextRequest, NextResponse } from "next/server";
import { verify } from "jsonwebtoken";

// Define protected paths
const protectedPaths = [
  /^\/billing/,
  /^\/inventory/,
  /^\/transactions/,
  /^\/sales-report/,
  /^\/settings/,
  /^\/$/,
];

export function middleware(request: NextRequest) {
  // Check if the current path is protected
  const isProtected = protectedPaths.some((path) => path.test(request.nextUrl.pathname));
  
  if (isProtected) {
    // Check for auth token in cookies
    const token = request.cookies.get("auth_token")?.value;
    
    if (!token) {
      // Redirect to login if not authenticated
      return NextResponse.redirect(new URL("/login", request.url));
    }
    
    try {
      // Verify the token
      verify(token, process.env.JWT_SECRET || "fallback_secret_key");
      // Token is valid, allow access
    } catch (error) {
      // Token is invalid, redirect to login
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }
  
  // If accessing login page while authenticated, redirect to dashboard
  if (request.nextUrl.pathname === "/login") {
    const token = request.cookies.get("auth_token")?.value;
    if (token) {
      try {
        verify(token, process.env.JWT_SECRET || "fallback_secret_key");
        // If valid token exists, redirect to dashboard
        return NextResponse.redirect(new URL("/", request.url));
      } catch (error) {
        // Token invalid, allow access to login
      }
    }
  }
  
  return NextResponse.next();
}

// Apply middleware to specific paths
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/(.*)',
  ],
};