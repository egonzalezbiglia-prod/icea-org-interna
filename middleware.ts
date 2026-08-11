import { NextResponse } from "next/server";

export function middleware() {
  const response = NextResponse.next();
  response.cookies.set("icea_schedule_client", "1", {
    httpOnly: false,
    maxAge: 60 * 60 * 12,
    path: "/api",
    sameSite: "lax",
    secure: true,
  });
  return response;
}

export const config = {
  matcher: "/equipos/:path*",
};
