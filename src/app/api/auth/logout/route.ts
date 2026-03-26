import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json({ message: "Logged out successfully" }, { status: 200 });

  // Clear HTTP-only auth token
  response.cookies.set({
    name: "auth_token",
    value: "",
    httpOnly: true,
    expires: new Date(0),
    path: "/",
  });

  // Clear Frontend-accessible UI state cookie
  response.cookies.set({
    name: "is_logged_in",
    value: "",
    httpOnly: false,
    expires: new Date(0),
    path: "/",
  });

  return response;
}