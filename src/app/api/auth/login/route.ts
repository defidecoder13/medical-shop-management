import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { connectDB } from "@/src/lib/db";
import User from "@/src/models/User";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// Demo account (matches the seed-data route and the login page hint).
const DEMO_EMAIL = "medsaathi@admin.com";
const DEMO_PASSWORD = "himadri@26";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    // Demo mode: when no database is configured, accept the demo account so the
    // UI can be tested without MongoDB. Only active when MONGODB_URI is unset;
    // the live app (which sets MONGODB_URI) always uses the database path below.
    const demoMode = !process.env.MONGODB_URI;
    let user: { _id: unknown; email: string };

    if (demoMode) {
      if (email !== DEMO_EMAIL || password !== DEMO_PASSWORD) {
        return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
      }
      user = { _id: "demo-admin", email: DEMO_EMAIL };
    } else {
      await connectDB();

      const found = await User.findOne({ email });
      if (!found) {
        return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
      }

      const isMatch = await bcrypt.compare(password, found.password);
      if (!isMatch) {
        return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
      }

      user = { _id: found._id, email: found.email };
    }

    // Create JWT
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      JWT_SECRET,
      { expiresIn: "1d" }
    );

    const response = NextResponse.json({ message: "Login successful" }, { status: 200 });

    // Set HTTP-only cookie
    response.cookies.set({
      name: "auth_token",
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 86400, // 1 day
      path: "/",
    });

    // Set Frontend-accessible cookie for synchronous UI flash prevention
    response.cookies.set({
      name: "is_logged_in",
      value: "1",
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 86400, // 1 day
      path: "/",
    });

    return response;
  } catch (error: any) {
    console.error("Login Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}