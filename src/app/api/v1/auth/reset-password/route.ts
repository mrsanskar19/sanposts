import { NextRequest } from 'next/server';
import { apiError, apiSuccess } from '@/lib/api/response';
import { hashPassword } from '@/lib/api/auth';
import { sandb } from '@/lib/api/sandb-client';

export async function POST(request: NextRequest) {
  const requestId = request.headers.get('x-request-id') || undefined;

  try {
    const body = await request.json().catch(() => ({}));
    const { token, newPassword } = body;

    if (!token || typeof token !== 'string') {
      return apiError('INVALID_INPUT', 'A valid password reset token is required', {
        status: 422,
        requestId,
      });
    }

    if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 8) {
      return apiError('INVALID_INPUT', 'New password must be at least 8 characters long', {
        status: 422,
        requestId,
      });
    }

    const resetRecord = await sandb.findPasswordReset(token);
    if (!resetRecord) {
      return apiError('INVALID_TOKEN', 'Reset token is invalid or does not exist', {
        status: 400,
        requestId,
      });
    }

    if (resetRecord.used) {
      return apiError('TOKEN_USED', 'This password reset token has already been used', {
        status: 400,
        requestId,
      });
    }

    if (Date.now() > resetRecord.expiresAt) {
      return apiError('TOKEN_EXPIRED', 'This password reset link has expired. Please request a new one.', {
        status: 410,
        requestId,
      });
    }

    // Hash new password and update user in database
    const newPasswordHash = await hashPassword(newPassword);
    const updated = await sandb.updateUserPassword(resetRecord.email, newPasswordHash);

    if (!updated) {
      return apiError('UPDATE_FAILED', 'Could not update user password in database', {
        status: 500,
        requestId,
      });
    }

    await sandb.markPasswordResetUsed(token);

    return apiSuccess(
      {
        message: 'Password has been successfully reset. You may now log in with your new credentials.',
        email: resetRecord.email,
      },
      { requestId }
    );
  } catch (err: unknown) {
    console.error('Reset password error:', err);
    return apiError('INTERNAL_ERROR', 'Failed to reset password', {
      status: 500,
      requestId,
    });
  }
}
