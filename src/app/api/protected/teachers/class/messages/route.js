
// /app/api/protected/teachers/class/messages/route.js - For Class Teacher specific functionality
export async function GET(request) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    const decoded = await verifyJWT(token);
    
    if (decoded.role !== 'class_teacher') {
      return NextResponse.json({ error: 'Unauthorized - Class teacher only' }, { status: 403 });
    }

    const userId = decoded.userId;
    const userInfo = await prisma.user.findUnique({
      where: { id: userId },
      select: { schoolId: true },
      include: {
        teacherProfile: {
          select: { coordinatorClass: true }
        }
      }
    });

    if (!userInfo.teacherProfile?.coordinatorClass) {
      return NextResponse.json({ error: 'No assigned class found' }, { status: 400 });
    }

    // Get all students in the class teacher's assigned class
    const classStudents = await prisma.user.findMany({
      where: {
        schoolId: userInfo.schoolId,
        role: 'student',
        studentProfile: {
          className: userInfo.teacherProfile.coordinatorClass
        }
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        studentProfile: {
          select: { className: true, section: true }
        }
      }
    });

    // Get recent messages with these students
    const recentMessages = await prisma.message.findMany({
      where: {
        schoolId: userInfo.schoolId,
        OR: [
          { fromUserId: userId, toUserId: { in: classStudents.map(s => s.id) } },
          { fromUserId: { in: classStudents.map(s => s.id) }, toUserId: userId }
        ]
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: {
        fromUser: {
          select: { firstName: true, lastName: true }
        },
        toUser: {
          select: { firstName: true, lastName: true }
        }
      }
    });

    return NextResponse.json({ 
      messages: recentMessages,
      classStudents,
      assignedClass: userInfo.teacherProfile.coordinatorClass
    });
  } catch (error) {
    console.error('Error fetching class teacher messages:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
