
// /app/api/protected/teachers/messages/send/route.js
export async function POST(request) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    const decoded = await verifyJWT(token);
    
    const teacherRoles = ['teacher', 'director', 'coordinator', 'class_teacher', 'subject_teacher'];
    if (!teacherRoles.includes(decoded.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { conversationId, content, messageType = 'direct' } = await request.json();
    const userId = decoded.userId;

    if (!content?.trim()) {
      return NextResponse.json({ error: 'Message content is required' }, { status: 400 });
    }

    const userSchool = await prisma.user.findUnique({
      where: { id: userId },
      select: { schoolId: true }
    });

    let toUserId = conversationId === 'headadmin' ? null : conversationId;

    const message = await prisma.message.create({
      data: {
        fromUserId: userId,
        toUserId,
        schoolId: userSchool.schoolId,
        content: content.trim(),
        messageType,
        priority: 'normal'
      },
      include: {
        fromUser: {
          select: { id: true, firstName: true, lastName: true }
        }
      }
    });

    return NextResponse.json({ message, success: true });
  } catch (error) {
    console.error('Error sending teacher message:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
