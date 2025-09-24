
// /app/api/protected/headadmin/messages/send/route.js
export async function POST(request) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    const decoded = await verifyJWT(token);
    
    if (decoded.role !== 'headadmin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { toUserId, schoolId, content, messageType = 'direct' } = await request.json();

    if (!content?.trim()) {
      return NextResponse.json({ error: 'Message content is required' }, { status: 400 });
    }

    const message = await prisma.message.create({
      data: {
        fromUserId: null, // Head admin messages have null fromUserId
        toUserId,
        schoolId,
        content: content.trim(),
        messageType,
        priority: 'normal'
      }
    });

    return NextResponse.json({ message, success: true });
  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
