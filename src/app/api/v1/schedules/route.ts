import { NextRequest } from 'next/server';
import { apiError, apiSuccess } from '@/lib/api/response';
import { ScheduledPost, SocialPlatform } from '@/types';
import { sandb } from '@/lib/api/sandb-client';

// In-memory schedules store for fallback
const scheduledPostsStore: ScheduledPost[] = [
  {
    id: 'sch-1',
    platform: 'linkedin',
    title: 'Modern Developer Tooling Blueprint',
    content: '5 architectural patterns every high-scale engineering team needs in 2026.',
    scheduledDate: '2026-09-15',
    scheduledTime: '14:30',
    status: 'scheduled',
    hashtags: ['#engineering', '#scale', '#tech'],
    imageUrl: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&auto=format&fit=crop&q=80',
  },
  {
    id: 'sch-2',
    platform: 'twitter',
    title: 'Product Launch Teaser',
    content: 'Shipping the fastest social content engine built for founders. Stay tuned tomorrow.',
    scheduledDate: '2026-09-16',
    scheduledTime: '09:00',
    status: 'draft',
    hashtags: ['#buildinpublic', '#startups'],
  },
];

export async function GET(request: NextRequest) {
  const requestId = request.headers.get('x-request-id') || undefined;
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');

  let results: ScheduledPost[] = [];

  try {
    const db = await sandb.getDb();
    const query: Record<string, unknown> = {};
    if (status) query.status = status;
    const dbSchedules = await db.find<ScheduledPost>('schedules', query);
    if (dbSchedules && dbSchedules.length > 0) {
      results = dbSchedules;
    }
  } catch {
    // Fallback to memory store if nodes offline
  }

  if (results.length === 0) {
    results = [...scheduledPostsStore];
    if (status) {
      results = results.filter(p => p.status === status);
    }
  }

  return apiSuccess(
    {
      count: results.length,
      schedules: results,
    },
    { requestId }
  );
}

export async function POST(request: NextRequest) {
  const requestId = request.headers.get('x-request-id') || undefined;

  try {
    const body = await request.json().catch(() => ({}));
    const { platform, title, content, scheduledDate, scheduledTime, imageUrl, hashtags } = body;

    if (!platform || !title || !content || !scheduledDate || !scheduledTime) {
      return apiError(
        'INVALID_INPUT',
        'Missing required fields: platform, title, content, scheduledDate, scheduledTime',
        {
          status: 422,
          requestId,
        }
      );
    }

    const newSchedule: ScheduledPost = {
      id: `sch_${crypto.randomUUID().substring(0, 8)}`,
      platform: platform as SocialPlatform,
      title,
      content,
      scheduledDate,
      scheduledTime,
      status: 'scheduled',
      imageUrl,
      hashtags: Array.isArray(hashtags) ? hashtags : [],
    };

    scheduledPostsStore.push(newSchedule);
    try {
      const db = await sandb.getDb();
      await db.insertOne('schedules', newSchedule as any);
    } catch {
      // In-memory fallback if cluster nodes offline
    }

    return apiSuccess(newSchedule, { status: 201, requestId });
  } catch (err: unknown) {
    console.error('Schedule creation error:', err);
    return apiError('INTERNAL_ERROR', 'Failed to schedule post', {
      status: 500,
      requestId,
    });
  }
}
