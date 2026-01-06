import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { sign } from "jsonwebtoken";

// In a real application, you would store admin credentials in a database
// For this simple implementation, we'll use environment variables
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@medishop.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123"; // This should be a hashed password in real app

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    // Check if credentials match
    if (email === ADMIN_EMAIL) {
      // For simplicity in this demo, we'll compare plain text
      // In a real application, you should hash the input password and compare
      if (password === ADMIN_PASSWORD) {
        // Create JWT token
        const token = sign(
          { email, role: "admin" },
          process.env.JWT_SECRET || "fallback_secret_key",
          { expiresIn: "24h" }
        );

        // Set token in cookie
        const response = NextResponse.json({ 
          message: "Login successful", 
          user: { email, role: "admin" } 
        });

        response.cookies.set("auth_token", token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          maxAge: 60 * 60 * 24, // 24 hours
          path: "/",
          sameSite: "strict",
        });

        return response;
      }
    }

    return NextResponse.json(
      { error: "Invalid credentials" },
      { status: 401 }
    );
  } catch (error) {
    console.error("LOGIN ERROR:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}