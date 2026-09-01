// app/api/protected/headadmin/users/[id]/route.js
import { requireAuth } from '@/lib/auth';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// ─── GET /api/protected/headadmin/users/[id] ─────────────────────────────────
interface Params { id: string; }

type JsonRecord = Record<string, unknown>;

interface Caller {
    id: string;
    role: 'HEADADMIN' | 'ADMIN' | 'TEACHER' | 'STUDENT' | string;
    [key: string]: unknown;
}

interface Class {
    id: string;
    [key: string]: unknown;
}

interface StudentProfile {
    id: string;
    class?: Class | null;
    [key: string]: unknown;
}

interface Subject {
    id: string;
    [key: string]: unknown;
}

interface TeacherSubject {
    isActive?: boolean;
    subject?: Subject | null;
    [key: string]: unknown;
}

interface TeacherProfile {
    id: string;
    teacherSubjects?: TeacherSubject[];
    [key: string]: unknown;
}

interface AdminPermission {
    id: string;
    module?: string;
    [key: string]: unknown;
}

interface AdminProfile {
    id: string;
    permissions?: AdminPermission[];
    [key: string]: unknown;
}

interface Settings { [key: string]: unknown }

interface UserCount {
    sessions?: number;
    auditLogs?: number;
}

interface User {
    id: string;
    passwordHash?: string | null;
    emailVerificationToken?: string | null;
    passwordResetToken?: string | null;
    school?: JsonRecord | null;
    studentProfile?: StudentProfile | null;
    teacherProfile?: TeacherProfile | null;
    adminProfile?: AdminProfile | null;
    settings?: Settings | null;
    _count?: UserCount;
    [key: string]: unknown;
}

export async function GET(request: Request, { params }: RouteContext): Promise<NextResponse> {
    try {
        const caller: Caller = await requireAuth();

        if (caller.role !== 'HEADADMIN') {
            return NextResponse.json(
                { error: 'Access denied' },
                { status: 403 }
            );
        }

        const { id } = await params;

        const user: User | null = await prisma.user.findUnique({
            where: { id },
            include: {
                school: true,
                studentProfile: {
                    include: {
                        class: true
                    }
                },
                teacherProfile: {
                    include: {
                        teacherSubjects: {
                            where: { isActive: true },
                            include: {
                                subject: true
                            }
                        }
                    }
                },
                adminProfile: {
                    include: {
                        permissions: true
                    }
                },
                settings: true,
                _count: {
                    select: {
                        sessions: true,
                        auditLogs: true
                    }
                }
            }
        });

        if (!user) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }

        // Strip sensitive fields before returning
        const { passwordHash, emailVerificationToken, passwordResetToken, ...safeUser } = user;

        return NextResponse.json({
            success: true,
            user: safeUser
        });

    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';

        if (message === 'Authentication required') {
            return NextResponse.json(
                { error: 'Authentication required' },
                { status: 401 }
            );
        }

        if (message === 'Access denied') {
            return NextResponse.json(
                { error: 'Access denied' },
                { status: 403 }
            );
        }

        console.error('Get user error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// ─── PATCH /api/protected/headadmin/users/[id] ───────────────────────────────
// Body: { firstName, lastName, email, username, phone, address, gender, isActive, profileData, permissions }
interface AdminPermissionInput {
    module: string;
    canCreate?: boolean;
    canRead?: boolean;
    canUpdate?: boolean;
    canDelete?: boolean;
    actions?: string[];
    [key: string]: unknown;
}

interface ProfileData {
    [key: string]: unknown;
}

interface PatchBody {
    firstName?: string | null;
    lastName?: string | null;
    email?: string | null;
    username?: string | null;
    phone?: string | null;
    address?: string | null;
    gender?: string | null;
    isActive?: boolean;
    profileData?: ProfileData | null;
    permissions?: AdminPermissionInput[] | null;
    [key: string]: unknown;
}

interface ExistingUserProfiles {
    id: string;
    role?: 'HEADADMIN' | 'ADMIN' | 'TEACHER' | 'STUDENT' | string;
    adminProfile?: { id: string } | null;
    teacherProfile?: { id: string } | null;
    studentProfile?: { id: string } | null;
    [key: string]: unknown;
}

export async function PATCH(request: Request, { params }: RouteContext): Promise<NextResponse> {
    try {
        const caller: Caller = await requireAuth();

        if (caller.role !== 'HEADADMIN') {
            return NextResponse.json(
                { error: 'Access denied' },
                { status: 403 }
            );
        }

        const { id } = await params;
        const body: PatchBody = await request.json();

        const {
            firstName,
            lastName,
            email,
            username,
            phone,
            address,
            gender,
            isActive,
            profileData,   // role-specific profile fields
            permissions    // [{ module, canCreate, canRead, canUpdate, canDelete, actions }]
        } = body;

        // Fetch target user's role + profile IDs for the transaction
        const existing: ExistingUserProfiles | null = await prisma.user.findUnique({
            where: { id },
            include: {
                adminProfile: { select: { id: true } },
                teacherProfile: { select: { id: true } },
                studentProfile: { select: { id: true } }
            }
        });

        if (!existing) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }

        // Build base user update — only include fields that were sent
        const userUpdateData: Record<string, unknown> = {};
        if (firstName  !== undefined) userUpdateData.firstName  = firstName?.trim();
        if (lastName   !== undefined) userUpdateData.lastName   = lastName?.trim();
        if (email      !== undefined) userUpdateData.email      = email?.trim();
        if (username   !== undefined) userUpdateData.username   = username?.trim();
        if (phone      !== undefined) userUpdateData.phone      = phone?.trim();
        if (address    !== undefined) userUpdateData.address    = address?.trim();
        if (gender     !== undefined) userUpdateData.gender     = gender;
        if (isActive   !== undefined) userUpdateData.isActive   = isActive;

        const updatedUser: User = await prisma.$transaction(async (tx: typeof prisma) => {
            // 1. Update base user fields
            const user = (await tx.user.update({
                where: { id },
                data: userUpdateData,
                include: {
                    school: true,
                    studentProfile: existing.role === 'STUDENT',
                    teacherProfile: existing.role === 'TEACHER',
                    adminProfile: (existing.role === 'ADMIN' || existing.role === 'HEADADMIN')
                        ? { include: { permissions: true } }
                        : false
                }
            })) as unknown as User;

            // 2. Update role-specific profile if profileData was provided
            if (profileData as ProfileData) {
                if (existing.role === 'STUDENT' && existing.studentProfile) {
                    await tx.studentProfile.update({
                        where: { userId: id },
                        data: profileData as ProfileData
                    });
                } else if (existing.role === 'TEACHER' && existing.teacherProfile) {
                    await tx.teacherProfile.update({
                        where: { userId: id },
                        data: profileData as ProfileData
                    });
                } else if (
                    (existing.role === 'ADMIN' || existing.role === 'HEADADMIN') &&
                    existing.adminProfile
                ) {
                    await tx.adminProfile.update({
                        where: { userId: id },
                        data: profileData as ProfileData
                    });
                }
            }

            // 3. Upsert permissions if provided (ADMIN / HEADADMIN only)
            if (permissions && Array.isArray(permissions) && existing.adminProfile) {
                for (const perm of permissions as AdminPermissionInput[]) {
                    await tx.adminPermission.upsert({
                        where: {
                            adminProfileId_module: {
                                adminProfileId: existing.adminProfile.id,
                                module: perm.module
                            }
                        },
                        update: {
                            canCreate: perm.canCreate ?? false,
                            canRead:   perm.canRead   ?? true,
                            canUpdate: perm.canUpdate ?? false,
                            canDelete: perm.canDelete ?? false,
                            actions:   perm.actions   ?? []
                        },
                        create: {
                            adminProfileId: existing.adminProfile.id,
                            module:    perm.module,
                            canCreate: perm.canCreate ?? false,
                            canRead:   perm.canRead   ?? true,
                            canUpdate: perm.canUpdate ?? false,
                            canDelete: perm.canDelete ?? false,
                            actions:   perm.actions   ?? []
                        }
                    });
                }
            }

            return user;
        });

        const { passwordHash, emailVerificationToken, passwordResetToken, ...safeUser } = updatedUser;

        return NextResponse.json({
            success: true,
            message: 'User updated successfully',
            user: {
                ...safeUser,
                profile: safeUser.studentProfile || safeUser.teacherProfile || safeUser.adminProfile
            }
        });

    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';

        if (message === 'Authentication required') {
            return NextResponse.json(
                { error: 'Authentication required' },
                { status: 401 }
            );
        }

        if (message === 'Access denied') {
            return NextResponse.json(
                { error: 'Access denied' },
                { status: 403 }
            );
        }

        console.error('Update user error:', error);
        return NextResponse.json(
            { error: 'Failed to update user' },
            { status: 500 }
        );
    }
}

// ─── DELETE /api/protected/headadmin/users/[id] ──────────────────────────────
// Soft delete by default. Pass ?hard=true for permanent deletion.
export async function DELETE(request: Request, { params }: RouteContext): Promise<NextResponse> {
  try {
    const caller = await requireAuth();

    if (caller.role !== 'HEADADMIN') {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const hard = searchParams.get('hard') === 'true';

    // Prevent self-deletion
    if (id === caller.id) {
      return NextResponse.json(
        { error: 'You cannot delete your own account' },
        { status: 400 }
      );
    }

    const existing = await prisma.user.findUnique({
      where: { id },
      select: { id: true }
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    if (hard) {
      await prisma.user.delete({ where: { id } });
      return NextResponse.json({
        success: true,
        message: 'User permanently deleted'
      });
    }

    await prisma.user.update({
      where: { id },
      data: { isActive: false }
    });

    return NextResponse.json({
      success: true,
      message: 'User deactivated successfully'
    });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';

    if (message === 'Authentication required') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    if (message === 'Access denied') {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    console.error('Delete user error:', error);
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    );
  }
}