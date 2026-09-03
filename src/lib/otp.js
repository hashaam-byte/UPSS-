// /lib/otp.js
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { sendSms } from '@/lib/sms';

const OTP_LENGTH = 6;
const OTP_TTL_MINUTES = 10;
const MAX_ATTEMPTS = 5;
const RESEND_COOLDOWN_SECONDS = 60;

function generateCode() {
  // 6-digit numeric code, zero-padded
  return crypto.randomInt(0, 1_000_000).toString().padStart(OTP_LENGTH, '0');
}

/**
 * Creates and sends a new OTP for the given phone/purpose.
 * Rate-limited: refuses to re-issue within RESEND_COOLDOWN_SECONDS of the last one.
 */
export async function issueOtp({ phone, purpose, schoolId = null, studentId = null }) {
  const recent = await prisma.otpVerification.findFirst({
    where: { phone, purpose, consumedAt: null },
    orderBy: { createdAt: 'desc' }
  });

  if (recent) {
    const secondsSinceLast = (Date.now() - new Date(recent.createdAt).getTime()) / 1000;
    if (secondsSinceLast < RESEND_COOLDOWN_SECONDS) {
      const waitSeconds = Math.ceil(RESEND_COOLDOWN_SECONDS - secondsSinceLast);
      const err = new Error(`Please wait ${waitSeconds}s before requesting another code`);
      err.code = 'RATE_LIMITED';
      throw err;
    }
  }

  const code = generateCode();
  const codeHash = await bcrypt.hash(code, 10);
  const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);

  await prisma.otpVerification.create({
    data: { phone, codeHash, purpose, schoolId, studentId, expiresAt }
  });

  const message = `Your U-Plus verification code is ${code}. It expires in ${OTP_TTL_MINUTES} minutes. Do not share this code with anyone.`;
  await sendSms(phone, message);

  return { expiresAt };
}

/**
 * Verifies a submitted code against the most recent unconsumed OTP for
 * phone+purpose. On success, marks it consumed (single-use) and returns
 * the record (including studentId/schoolId, if any). Throws on failure.
 */
export async function verifyOtp({ phone, purpose, code }) {
  const otp = await prisma.otpVerification.findFirst({
    where: { phone, purpose, consumedAt: null },
    orderBy: { createdAt: 'desc' }
  });

  if (!otp) {
    const err = new Error('No pending verification code found. Please request a new one.');
    err.code = 'NOT_FOUND';
    throw err;
  }

  if (new Date(otp.expiresAt) < new Date()) {
    const err = new Error('This code has expired. Please request a new one.');
    err.code = 'EXPIRED';
    throw err;
  }

  if (otp.attempts >= MAX_ATTEMPTS) {
    const err = new Error('Too many incorrect attempts. Please request a new code.');
    err.code = 'LOCKED';
    throw err;
  }

  const isValid = await bcrypt.compare(code, otp.codeHash);

  if (!isValid) {
    await prisma.otpVerification.update({
      where: { id: otp.id },
      data: { attempts: { increment: 1 } }
    });
    const err = new Error('Incorrect code. Please try again.');
    err.code = 'INVALID';
    throw err;
  }

  await prisma.otpVerification.update({
    where: { id: otp.id },
    data: { consumedAt: new Date() }
  });

  return otp;
}
