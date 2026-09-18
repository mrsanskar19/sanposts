import { NextRequest } from 'next/server';
import { apiError, apiSuccess } from '@/lib/api/response';
import { createAuthToken, hashPassword } from '@/lib/api/auth';
import { sandb, DbUserRecord } from '@/lib/api/sandb-client';

export async function POST(request: NextRequest) {
  const requestId = request.headers.get('x-request-id') || undefined;

  try {
    const body = await request.json().catch(() => ({}));
    const { email, name, password, plan } = body;

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return apiError('INVALID_INPUT', 'A valid email address is required', {
        status: 422,
        requestId,
      });
    }

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return apiError('INVALID_INPUT', 'Full name is required', {
        status: 422,
        requestId,
      });
    }

    if (!password || typeof password !== 'string' || password.length < 6) {
      console.log(password,body)
      return apiError('INVALID_INPUT', 'Password must be at least 6 characters long', {
        status: 422,
        requestId,
      });
    }

    // Check if user already exists
    const existing = await sandb.findUserByEmail(email);
    if (existing) {
      return apiError('USER_EXISTS', 'An account with this email address already exists. Please sign in.', {
        status: 409,
        requestId,
      });
    }

    const userId = `usr_${crypto.randomUUID().substring(0, 8)}`;
    const userPlan = (plan === 'Enterprise' ? 'Enterprise' : 'Pro') as 'Pro' | 'Enterprise';
    const passwordHash = await hashPassword(password);

    const newUser: DbUserRecord = {
      id: userId,
      email: email.trim().toLowerCase(),
      name: name.trim(),
      passwordHash,
      plan: userPlan,
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      creditsUsed: 0,
      creditsTotal: userPlan === 'Enterprise' ? 500 : 100,
      createdAt: new Date().toISOString(),
    };

    await sandb.saveUser(newUser);

    const token = await createAuthToken({
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
      plan: newUser.plan,
    });

    const userProfile = {
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
      plan: newUser.plan,
      avatar: newUser.avatar,
      creditsUsed: newUser.creditsUsed,
      creditsTotal: newUser.creditsTotal,
    };

    return apiSuccess(
      {
        token,
        tokenType: 'Bearer',
        expiresIn: 60 * 60 * 24 * 7,
        user: userProfile,
      },
      { status: 201, requestId }
    );
  } catch (err: unknown) {
    console.error('Signup error:', err);
    return apiError('INTERNAL_ERROR', 'An unexpected error occurred during account creation', {
      status: 500,
      requestId,
    });
  }
}
