// pages/api/protected/headadmin/settings/payment.js
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'headadmin') {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      settings: {
        paystackPublicKey: '',
        paystackSecretKey: '',
        flutterwavePublicKey: '',
        flutterwaveSecretKey: '',
        defaultCurrency: 'NGN',
        enablePaystack: true,
        enableFlutterwave: false
      }
    });
  } catch (error) {
    console.error('Payment settings error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
