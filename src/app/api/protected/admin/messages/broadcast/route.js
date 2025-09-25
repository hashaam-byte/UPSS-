
// /app/api/protected/admin/messages/broadcast/route.js
export async function POST(request) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    const decoded = await verifyJWT(token);
    
    if (decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { subject, content, targetRoles, priority = 'normal' } = await request.json();
    const userId = decoded.userId;

    if (!subject?.trim() || !content?.trim()) {
      return NextResponse.json({ error: 'Subject and content are required' }, { status: 400 });
    }

    const userInfo = await prisma.user.findUnique({
      where: { id: userId },
      select: { schoolId: true }
    });

    // Build target user query
    let whereClause = {
      schoolId: userInfo.schoolId,
      id: { not: userId }, // Don't send to self
      isActive: true
    };

    if (targetRoles && targetRoles.length > 0) {
      whereClause.role = { in: targetRoles };
    }

    // Get target users
    const targetUsers = await prisma.user.findMany({
      where: whereClause,
      select: { id: true }
    });

    // Create messages for each target user
    const messages = await Promise.all(
      targetUsers.map(user =>
        prisma.message.create({
          data: {
            fromUserId: userId,
            toUserId: user.id,
            schoolId: userInfo.schoolId,
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
    console.error('Error sending admin broadcast:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}