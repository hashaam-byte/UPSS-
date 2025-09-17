import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET(request, { params }) {
  try {
    const user = await getCurrentUser(request);
    if (!user || user.role !== "headadmin") {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      );
    }

    const { id } = params;

    // Verify school exists
    const school = await prisma.school.findUnique({
      where: { id },
    });

    if (!school) {
      return NextResponse.json({ error: "School not found" }, { status: 404 });
    }

    // Get user counts by role
    const [studentCount, teacherCount, adminCount] = await Promise.all([
      prisma.user.count({
        where: { schoolId: id, role: "student", isActive: true },
      }),
      prisma.user.count({
        where: { schoolId: id, role: "teacher", isActive: true },
      }),
      prisma.user.count({
        where: { schoolId: id, role: "admin", isActive: true },
      }),
    ]);

    return NextResponse.json({
      success: true,
      studentCount,
      teacherCount,
      adminCount,
      totalUsers: studentCount + teacherCount + adminCount,
    });
  } catch (error) {
    console.error("Failed to fetch user count:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}
