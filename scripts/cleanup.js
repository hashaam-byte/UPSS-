
// scripts/cleanup.js - Cleanup expired sessions and tokens
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function cleanup() {
  console.log('🧹 Starting cleanup...');
  
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
    
    // Delete used password reset tokens older than 24 hours
    const oldUsedTokens = await prisma.passwordResetToken.deleteMany({
      where: {
        usedAt: {
          not: null,
          lt: new Date(now.getTime() - 24 * 60 * 60 * 1000)
        }
      }
    });

    console.log(`✅ Cleanup completed:`);
    console.log(`- Expired sessions: ${expiredSessions.count}`);
    console.log(`- Expired tokens: ${expiredTokens.count}`);
    console.log(`- Old used tokens: ${oldUsedTokens.count}`);
    
  } catch (error) {
    console.error('❌ Cleanup failed:', error);
  }
}

cleanup()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });