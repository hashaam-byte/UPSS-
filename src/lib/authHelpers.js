// lib/authHelpers.js
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";
import { cookies } from "next/headers";

const prisma = new PrismaClient();

export async function verifyHeadAdminAuth(request) {
  try {
    let token = null;

    // 1. Try to get token from cookies
    const cookieStore = cookies();
    const authCookie = cookieStore.get("auth_token");
    if (authCookie) {
      token = authCookie.value;
    }

    // 2. Fallback: Try to get token from Authorization header
    if (!token) {
      const authHeader = request.headers.get("authorization");
      if (authHeader && authHeader.startsWith("Bearer ")) {
        token = authHeader.replace("Bearer ", "");
      }
    }

    if (!token) {
      return { success: false, error: "No authentication token provided" };
    }

    // 3. Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded.userId) {
      return { success: false, error: "Invalid token format" };
    }

    // 4. Get user from database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        isActive: true,
      },
    });

    if (!user) {
      return { success: false, error: "User not found" };
    }

    if (!user.isActive) {
      return { success: false, error: "User account is inactive" };
    }

    if (user.role !== "headadmin") {
      return {
        success: false,
        error: "Access denied. Head admin privileges required",
      };
    }

    return { success: true, user };
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      return { success: false, error: "Invalid authentication token" };
    }
    if (error.name === "TokenExpiredError") {
      return { success: false, error: "Authentication token expired" };
    }
    console.error("Auth verification error:", error);
    return { success: false, error: "Authentication failed" };
  }
}
