
// /app/api/protected/headadmin/messages/conversations/[id]/read/route.js
export async function POST(request, { params }) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    const decoded = await verifyJWT(token);
    
    if (decoded.role !== 'headadmin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const [schoolId, userId] = params.id.split('-');
    
    await prisma.message.updateMany({
      where: {
        schoolId,
        fromUserId: userId,
        toUserId: null,
        isRead: false
      },
      data: {
        isRead: true,
        readAt: new Date()
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
