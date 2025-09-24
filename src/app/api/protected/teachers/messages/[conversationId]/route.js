
// /app/api/protected/teachers/messages/[conversationId]/route.js
export async function GET(request, { params }) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    const decoded = await verifyJWT(token);
    
    const teacherRoles = ['teacher', 'director', 'coordinator', 'class_teacher', 'subject_teacher'];
    if (!teacherRoles.includes(decoded.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const userId = decoded.userId;
    const conversationId = params.conversationId;

    const userSchool = await prisma.user.findUnique({
      where: { id: userId },
      select: { schoolId: true }
    });

    let otherUserId = conversationId === 'headadmin' ? null : conversationId;

    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { fromUserId: userId, toUserId: otherUserId },
          { fromUserId: otherUserId, toUserId: userId }
        ],
        schoolId: userSchool.schoolId
      },
      orderBy: { createdAt: 'asc' },
      include: {
        fromUser: {
          select: { id: true, firstName: true, lastName: true }
        }
      }
    });

    // Add fromCurrentUser flag
    const processedMessages = messages.map(message => ({
      ...message,
      fromCurrentUser: message.fromUserId === userId
    }));

    return NextResponse.json({ messages: processedMessages });
  } catch (error) {
    console.error('Error fetching teacher messages:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
