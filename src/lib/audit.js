// /lib/audit.js
// Shared helper for writing to AuditLog. The table already existed in the
// schema but nothing wrote to it — wiring it up starting with the
// highest-value case (payment credential changes), since that's the kind
// of action you most want a record of "who did this and when."
import { prisma } from '@/lib/prisma';

export async function logAudit({ userId, action, resource, resourceId = null, description = null, metadata = null, request = null }) {
  try {
    await prisma.auditLog.create({
      data: {
        userId,
        action,
        resource,
        resourceId,
        description,
        metadata,
        ipAddress: request ? getIpFromRequest(request) : null,
        userAgent: request ? request.headers.get('user-agent') : null,
      },
    });
  } catch (error) {
    // Never let audit logging break the actual action it's logging
    console.error('Audit log write failed:', error);
  }
}

function getIpFromRequest(request) {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return request.headers.get('x-real-ip') || null;
}
