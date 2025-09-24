
// /app/api/protected/headadmin/messages/conversations/[id]/route.js
export async function GET(request, { params }) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    const decoded = await verifyJWT(token);
    
    if (decoded.role !== 'headadmin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const [schoolId, userId] = params.id.split('-');
    
    const messages = await prisma.message.findMany({
      where: {
        schoolId,
        OR: [
          { fromUserId: null, toUserId: userId },
          { fromUserId: userId, toUserId: null }
        ]
      },
      orderBy: { createdAt: 'asc' },
      include: {
        fromUser: {
          select: { id: true, firstName: true, lastName: true }
        }
      }
    });

    return NextResponse.json({ messages });
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
