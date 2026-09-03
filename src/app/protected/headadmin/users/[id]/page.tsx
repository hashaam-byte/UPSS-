// app/protected/headadmin/users/[id]/page.tsx
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma"; // adjust to your prisma import path
import UserDetailClient from "./UserDetailClient";

// ─── Types for this page (mirrors API select) ─────────────────────────────────
interface PageProps {
  params: Promise<{ id: string }>;
}

// ─── Data fetching ────────────────────────────────────────────────────────────
async function getUser(id: string) {
  return prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      username: true,
      role: true,
      avatar: true,
      dateOfBirth: true,
      phone: true,
      address: true,
      gender: true,
      isActive: true,
      isEmailVerified: true,
      lastLogin: true,
      loginAttempts: true,
      lockUntil: true,
      createdAt: true,
      updatedAt: true,
      schoolId: true,
      school: {
        select: { id: true, name: true, slug: true },
      },
      studentProfile: {
        select: {
          id: true,
          studentId: true,
          className: true,
          section: true,
          department: true,
          admissionDate: true,
          middleName: true,
          dateOfBirth: true,
          gender: true,
          bloodGroup: true,
          allergies: true,
          emergencyContact: true,
          profileImage: true,
          address: true,
          hasCompletedSubjectSelection: true,
          currentStream: true,
          parentName: true,
          parentPhone: true,
          parentEmail: true,
          isActive: true,
          class: { select: { id: true, name: true, code: true } },
        },
      },
      teacherProfile: {
        select: {
          id: true,
          employeeId: true,
          department: true,
          qualification: true,
          experienceYears: true,
          joiningDate: true,
          coordinatorClass: true,
          teacherRole: true,
          levelSpecialization: true,
          canTeachStreams: true,
          profileImage: true,
          phone: true,
          isActive: true,
          teacherSubjects: {
            where: { isActive: true },
            select: {
              subject: { select: { id: true, name: true, code: true } },
              classes: true,
            },
          },
        },
      },
      adminProfile: {
        select: {
          id: true,
          employeeId: true,
          department: true,
          phone: true,
          profileImage: true,
          permissions: {
            select: {
              id: true,
              module: true,
              actions: true,
              canCreate: true,
              canRead: true,
              canUpdate: true,
              canDelete: true,
            },
          },
        },
      },
      settings: true,
      _count: {
        select: {
          sessions: true,
          auditLogs: true,
        },
      },
    },
  });
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default async function Page({ params }: PageProps) {
  const { id } = await params;
  const user = await getUser(id);
  if (!user) return notFound();
  return <UserDetailClient initialUser={user} />;
}
