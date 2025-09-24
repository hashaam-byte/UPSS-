
// /app/api/protected/teachers/broadcast/route.js - Teacher broadcast to students
export async function POST(request) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    const decoded = await verifyJWT(token);
    
    const teacherRoles = ['teacher', 'director', 'coordinator', 'class_teacher', 'subject_teacher'];
    if (!teacherRoles.includes(decoded.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { subject, content, targetStudents, targetClasses, priority = 'normal' } = await request.json();
    const userId = decoded.userId;

    if (!subject?.trim() || !content?.trim()) {
      return NextResponse.json({ error: 'Subject and content are required' }, { status: 400 });
    }

    const userSchool = await prisma.user.findUnique({
      where: { id: userId },
      select: { schoolId: true, role: true }
    });

    let targetUsers = [];

    if (targetStudents && targetStudents.length > 0) {
      // Specific students
      targetUsers = await prisma.user.findMany({
        where: {
          schoolId: userSchool.schoolId,
          role: 'student',
          id: { in: targetStudents }
        },
        select: { id: true }
      });
    } else if (targetClasses && targetClasses.length > 0) {
      // Students in specific classes
      targetUsers = await prisma.user.findMany({
        where: {
          schoolId: userSchool.schoolId,
          role: 'student',
          studentProfile: {
            className: { in: targetClasses }
          }
        },
        select: { id: true }
      });
    } else {
      return NextResponse.json({ error: 'Must specify target students or classes' }, { status: 400 });
    }

    // Create broadcast messages
    const messages = await Promise.all(
      targetUsers.map(user =>
        prisma.message.create({
          data: {
            fromUserId: userId,
            toUserId: user.id,
            schoolId: userSchool.schoolId,
            subject,
            content: content.trim(),
            messageType: 'broadcast',
            priority,
            isBroadcast: true
          }
        })
      )
    );

    return NextResponse.json({ messages, count: messages.length, success: true });
  } catch (error) {
    console.error('Error sending teacher broadcast:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}