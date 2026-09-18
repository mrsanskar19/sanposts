import { NextRequest } from 'next/server';
import { apiError, apiSuccess } from '@/lib/api/response';

export async function GET(request: NextRequest) {
  const requestId = request.headers.get('x-request-id') || undefined;
  const userId = request.headers.get('x-user-id');
  const userEmail = request.headers.get('x-user-email');
  const userNameRaw = request.headers.get('x-user-name');
  const userPlan = request.headers.get('x-user-plan') || 'Pro';

  if (!userId || !userEmail) {
    return apiError('UNAUTHORIZED', 'Invalid or missing user context', {
      status: 401,
      requestId,
    });
  }

  const userName = userNameRaw ? decodeURIComponent(userNameRaw) : 'SanPosts User';

  const profile = {
    id: userId,
    email: userEmail,
    name: userName,
    plan: userPlan,
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    creditsUsed: 28,
    creditsTotal: userPlan === 'Enterprise' ? 500 : 100,
    isLoggedIn: true,
  };

  return apiSuccess(profile, { requestId });
}
