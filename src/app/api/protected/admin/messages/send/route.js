
// /app/api/protected/admin/messages/send/route.js
export async function POST(request) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    const decoded = await verifyJWT(token);
    
    if (decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { conversationId, content } = await request.json();
    const userId = decoded.userId;

    if (!content?.trim()) {
      return NextResponse.json({ error: 'Message content is required' }, { status: 400 });
    }

    const userInfo = await prisma.user.findUnique({
      where: { id: userId },
      select: { schoolId: true }
    });

    let message;

    if (conversationId === 'headadmin') {
      // Message to head admin
      message = await prisma.message.create({
        data: {
          fromUserId: userId,
          toUserId: null, // null represents head admin
          schoolId: userInfo.schoolId,
          content: content.trim(),
          messageType: 'direct',
          priority: 'normal'
        }
      });
    } else {
      // Message to another user
      message = await prisma.message.create({
        data: {
          fromUserId: userId,
          toUserId: conversationId,
          schoolId: userInfo.schoolId,
          content: content.trim(),
          messageType: 'direct',
          priority: 'normal'
        }
      });
    }

    return NextResponse.json({ message, success: true });
  } catch (error) {
    console.error('Error sending admin message:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
