/**
 * Demo Mode Guard - Prevents mutations in demo routes
 * 
 * This utility prevents write operations (POST, PATCH, PUT, DELETE) 
 * from demo routes to ensure read-only behavior.
 */

import { NextRequest, NextResponse } from "next/server";

/**
 * Checks if a request is from a demo route
 */
export function isDemoRoute(request: NextRequest): boolean {
  const pathname = request.nextUrl.pathname;
  return pathname.startsWith("/demo");
}

/**
 * Checks if a request is a mutation operation
 */
export function isMutationRequest(request: NextRequest): boolean {
  const method = request.method.toUpperCase();
  return ["POST", "PATCH", "PUT", "DELETE"].includes(method);
}

/**
 * Guard middleware for API routes - prevents mutations from demo mode
 * 
 * Usage in API route:
 * ```ts
 * import { demoGuard } from "@/lib/demo-guard";
 * 
 * export async function POST(request: NextRequest) {
 *   const guardResponse = demoGuard(request);
 *   if (guardResponse) return guardResponse;
 *   
 *   // ... rest of your handler
 * }
 * ```
 */
export function demoGuard(request: NextRequest): NextResponse | null {
  // Check if request is from demo route
  const referer = request.headers.get("referer");
  const isDemoReferer = referer && referer.includes("/demo");
  
  // Check if this is a mutation request
  if (isDemoReferer && isMutationRequest(request)) {
    return NextResponse.json(
      { 
        error: "Demo mode: read-only", 
        message: "Mutations are not allowed in demo mode. Please use the full application."
      },
      { status: 403 }
    );
  }
  
  return null;
}

/**
 * Client-side check for demo mode
 * Use this in components to disable mutation UI
 */
export function isClientDemoMode(): boolean {
  if (typeof window === "undefined") return false;
  return window.location.pathname.startsWith("/demo");
}
