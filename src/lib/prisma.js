
// /lib/prisma.js
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis;

export const prisma = globalForPrisma.prisma || new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// Connection test function
export async function testDatabaseConnection() {
  try {
    await prisma.$connect();
    console.log('✅ Database connected successfully');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  } finally {
    await prisma.$disconnect();
  }
}

// Cleanup function for expired sessions and tokens
export async function cleanupExpiredData() {
  try {
    const now = new Date();
    
    // Delete expired sessions
    const expiredSessions = await prisma.userSession.deleteMany({
      where: {
        expiresAt: {
          lt: now
        }
      }
    });
    
    // Delete expired password reset tokens
    const expiredTokens = await prisma.passwordResetToken.deleteMany({
      where: {
        expiresAt: {
          lt: now
        }
      }
    });
    
    console.log(`🧹 Cleanup completed: ${expiredSessions.count} sessions, ${expiredTokens.count} tokens deleted`);
    
    return {
      sessionsDeleted: expiredSessions.count,
      tokensDeleted: expiredTokens.count
    };
  } catch (error) {
    console.error('❌ Cleanup failed:', error);
    throw error;
  }
}