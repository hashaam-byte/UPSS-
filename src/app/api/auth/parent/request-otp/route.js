// /api/auth/parent/request-otp
// Step 1 of both first-time signup and forgot-password: parent submits their
// phone number, we find which student(s) list it as a parent contact, and
// text them a one-time code.
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { issueOtp } from '@/lib/otp';

export async function POST(request) {
  try {
    const body = await request.json();
    const { phone, schoolId: chosenSchoolId } = body;

    if (!phone || phone.trim().length < 7) {
      return NextResponse.json({ error: 'A valid phone number is required' }, { status: 400 });
    }

    const normalizedPhone = phone.trim();

    // Does an account already exist for this phone (in any school)?
    const existingParentProfile = await prisma.parentProfile.findFirst({
      where: { phone: normalizedPhone }
    });

    if (existingParentProfile) {
      // Returning parent → this is a password-reset request
      await issueOtp({
        phone: normalizedPhone,
        purpose: 'PASSWORD_RESET',
        schoolId: existingParentProfile.schoolId
      });

      return NextResponse.json({
        success: true,
        mode: 'PASSWORD_RESET',
        message: 'A verification code has been sent to your phone.'
      });
    }

    // First-time parent → look for students whose parentPhone matches
    const matchingStudents = await prisma.studentProfile.findMany({
      where: { parentPhone: normalizedPhone },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, schoolId: true } }
      }
    });

    if (matchingStudents.length === 0) {
      // Deliberately vague — don't reveal whether the phone exists in the system
      return NextResponse.json({
        error: 'We could not find a student linked to this phone number. Please check the number or contact your school.'
      }, { status: 404 });
    }

    // Group by school, in case the same phone is listed for children at different schools
    const schoolGroups = new Map();
    for (const sp of matchingStudents) {
      const schoolId = sp.user.schoolId;
      if (!schoolGroups.has(schoolId)) schoolGroups.set(schoolId, []);
      schoolGroups.get(schoolId).push({
        studentId: sp.user.id,
        name: `${sp.user.firstName} ${sp.user.lastName}`,
        className: sp.className
      });
    }

    const schools = await prisma.school.findMany({
      where: { id: { in: [...schoolGroups.keys()] } },
      select: { id: true, name: true }
    });

    const matches = schools.map(school => ({
      schoolId: school.id,
      schoolName: school.name,
      children: schoolGroups.get(school.id)
    }));

    // If only one school matches, issue the OTP immediately.
    // If multiple, the client must resubmit with a chosen schoolId before we send anything.
    if (matches.length === 1 || chosenSchoolId) {
      const targetSchoolId = chosenSchoolId || matches[0].schoolId;

      if (!schoolGroups.has(targetSchoolId)) {
        return NextResponse.json({ error: 'Invalid school selection' }, { status: 400 });
      }

      await issueOtp({
        phone: normalizedPhone,
        purpose: 'IDENTITY_VERIFICATION',
        schoolId: targetSchoolId
      });

      return NextResponse.json({
        success: true,
        mode: 'IDENTITY_VERIFICATION',
        message: 'A verification code has been sent to your phone.',
        matches: matches.filter(m => m.schoolId === targetSchoolId)
      });
    }

    return NextResponse.json({
      success: true,
      mode: 'CHOOSE_SCHOOL',
      message: 'This phone number is linked to children at more than one school. Please choose one to continue.',
      matches
    });

  } catch (error) {
    if (error.code === 'RATE_LIMITED') {
      return NextResponse.json({ error: error.message }, { status: 429 });
    }
    console.error('Parent request-otp error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
