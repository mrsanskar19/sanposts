import { NextRequest } from 'next/server';
import { apiError, apiSuccess } from '@/lib/api/response';
import { sandb } from '@/lib/api/sandb-client';

export async function POST(request: NextRequest) {
  const requestId = request.headers.get('x-request-id') || undefined;

  try {
    const body = await request.json().catch(() => ({}));
    const { email } = body;

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return apiError('INVALID_INPUT', 'Please enter a valid email address', {
        status: 422,
        requestId,
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await sandb.findUserByEmail(normalizedEmail);

    if (!user) {
      return apiError('USER_NOT_FOUND', 'No account found with this email address. Please sign up.', {
        status: 404,
        requestId,
      });
    }

    // Generate secure password reset token
    const resetToken = `rst_${crypto.randomUUID().replace(/-/g, '')}`;
    await sandb.createPasswordReset(normalizedEmail, resetToken, 60);

    return apiSuccess(
      {
        message: 'Password reset instructions have been generated.',
        email: normalizedEmail,
        resetToken,
        resetUrl: `/reset-password?token=${resetToken}`,
      },
      { requestId }
    );
  } catch (err: unknown) {
    console.error('Forgot password error:', err);
    return apiError('INTERNAL_ERROR', 'Failed to process forgot password request', {
      status: 500,
      requestId,
    });
  }
}
