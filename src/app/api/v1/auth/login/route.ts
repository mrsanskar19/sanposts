import { NextRequest } from 'next/server';
import { apiError, apiSuccess } from '@/lib/api/response';
import { createAuthToken, verifyPassword } from '@/lib/api/auth';
import { sandb } from '@/lib/api/sandb-client';

export async function POST(request: NextRequest) {
  const requestId = request.headers.get('x-request-id') || undefined;

  try {
    const body = await request.json().catch(() => ({}));
    const { email, password } = body;

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return apiError('INVALID_INPUT', 'Please enter a valid email address', {
        status: 422,
        requestId,
      });
    }

    if (!password || typeof password !== 'string' || password.length < 6) {
      return apiError('INVALID_INPUT', 'Password must be at least 6 characters.', {
        status: 422,
        requestId,
      });
    }

    const user = await sandb.findUserByEmail(email);
    if (!user) {
      return apiError('INVALID_CREDENTIALS', 'Invalid email or password. Please check your credentials.', {
        status: 401,
        requestId,
      });
    }

    // Verify password hash
    const isValidPassword = await verifyPassword(password, user.passwordHash);
    if (!isValidPassword) {
      return apiError('INVALID_CREDENTIALS', 'Invalid email or password. Please check your credentials.', {
        status: 401,
        requestId,
      });
    }

    const token = await createAuthToken({
      id: user.id,
      email: user.email,
      name: user.name,
      plan: user.plan,
    });

    const userProfile = {
      id: user.id,
      email: user.email,
      name: user.name,
      plan: user.plan,
      avatar: user.avatar,
      creditsUsed: user.creditsUsed,
      creditsTotal: user.creditsTotal,
    };

    return apiSuccess(
      {
        token,
        tokenType: 'Bearer',
        expiresIn: 60 * 60 * 24 * 7,
        user: userProfile,
      },
      { requestId }
    );
  } catch (err: unknown) {
    console.error('Login error:', err);
    return apiError('INTERNAL_ERROR', 'An unexpected error occurred during authentication', {
      status: 500,
      requestId,
    });
  }
}
