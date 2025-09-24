
// /app/api/protected/headadmin/messages/broadcast/route.js
export async function POST(request) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    const decoded = await verifyJWT(token);
    
    if (decoded.role !== 'headadmin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { subject, content, priority = 'normal' } = await request.json();

    if (!subject?.trim() || !content?.trim()) {
      return NextResponse.json({ error: 'Subject and content are required' }, { status: 400 });
    }

    // Get all school admins
    const schoolAdmins = await prisma.user.findMany({
      where: { role: 'admin' },
      select: { id: true, schoolId: true }
    });

    // Create broadcast messages
    const messages = await Promise.all(
      schoolAdmins.map(admin =>
        prisma.message.create({
          data: {
            fromUserId: null,
            toUserId: admin.id,
            schoolId: admin.schoolId,
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
    console.error('Error sending broadcast:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}