import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  // Auth disabled - allow all requests
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
