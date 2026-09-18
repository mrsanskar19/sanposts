import { NextRequest } from 'next/server';
import { apiError, apiSuccess } from '@/lib/api/response';
import { sandb } from '@/lib/api/sandb-client';

export async function GET(request: NextRequest) {
  const requestId = request.headers.get('x-request-id') || undefined;
  const userId = request.headers.get('x-user-id') || 'guest';

  try {
    const posts = await sandb.getSavedPosts(userId);
    return apiSuccess(
      {
        count: posts.length,
        posts,
      },
      { requestId }
    );
  } catch (err: unknown) {
    console.error('Error fetching saved posts:', err);
    return apiError('INTERNAL_ERROR', 'Failed to retrieve saved posts', {
      status: 500,
      requestId,
    });
  }
}

export async function POST(request: NextRequest) {
  const requestId = request.headers.get('x-request-id') || undefined;
  const userId = request.headers.get('x-user-id') || 'guest';

  try {
    const body = await request.json().catch(() => ({}));
    const { id, platform, title, content, hashtags, imageUrl } = body;

    if (!content && !title) {
      return apiError('INVALID_INPUT', 'Post content or title is required', {
        status: 422,
        requestId,
      });
    }

    const postId = id || `post_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const savedPost = await sandb.savePost(userId, {
      id: postId,
      platform: platform || 'general',
      title: title || 'Saved Post',
      content: content || '',
      hashtags: Array.isArray(hashtags) ? hashtags : [],
      imageUrl,
    });

    return apiSuccess(savedPost, { status: 201, requestId });
  } catch (err: unknown) {
    console.error('Error saving post to library:', err);
    return apiError('INTERNAL_ERROR', 'Failed to save post to library', {
      status: 500,
      requestId,
    });
  }
}

export async function DELETE(request: NextRequest) {
  const requestId = request.headers.get('x-request-id') || undefined;
  const userId = request.headers.get('x-user-id') || 'guest';
  const { searchParams } = new URL(request.url);
  const postId = searchParams.get('id');

  if (!postId) {
    return apiError('INVALID_INPUT', 'Post ID is required to remove from library', {
      status: 422,
      requestId,
    });
  }

  try {
    await sandb.deleteSavedPost(userId, postId);
    return apiSuccess({ success: true, removedId: postId }, { requestId });
  } catch (err: unknown) {
    console.error('Error removing saved post:', err);
    return apiError('INTERNAL_ERROR', 'Failed to delete saved post', {
      status: 500,
      requestId,
    });
  }
}
