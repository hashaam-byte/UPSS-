
// /app/api/protected/admin/messages/[conversationId]/route.js
export async function GET(request, { params }) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    const decoded = await verifyJWT(token);
    
    if (decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const userId = decoded.userId;
    const conversationId = params.conversationId;

    const userInfo = await prisma.user.findUnique({
      where: { id: userId },
      select: { schoolId: true }
    });

    let messages = [];

    if (conversationId === 'headadmin') {
      // Messages with head admin
      messages = await prisma.message.findMany({
        where: {
          schoolId: userInfo.schoolId,
          OR: [
            { fromUserId: null, toUserId: userId },
            { fromUserId: userId, toUserId: null }
          ]
        },
        orderBy: { createdAt: 'asc' }
      });
    } else {
      // Messages with other users
      messages = await prisma.message.findMany({
        where: {
          OR: [
            { fromUserId: userId, toUserId: conversationId },
            { fromUserId: conversationId, toUserId: userId }
          ],
          schoolId: userInfo.schoolId
        },
        orderBy: { createdAt: 'asc' },
        include: {
          fromUser: {
            select: { id: true, firstName: true, lastName: true }
          }
        }
      });
    }

    // Mark messages as read
    await prisma.message.updateMany({
      where: {
        OR: [
          { fromUserId: null, toUserId: userId, isRead: false },
          { fromUserId: conversationId, toUserId: userId, isRead: false }
        ],
        schoolId: userInfo.schoolId
      },
      data: {
        isRead: true,
        readAt: new Date()
      }
    });

    // Add fromCurrentUser flag
    const processedMessages = messages.map(message => ({
      ...message,
      fromCurrentUser: message.fromUserId === userId
    }));

    return NextResponse.json({ messages: processedMessages });
  } catch (error) {
    console.error('Error fetching admin messages:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
