import { NextRequest } from 'next/server';
import { apiError, apiSuccess } from '@/lib/api/response';
import { sandb } from '@/lib/api/sandb-client';
import { BrandAsset } from '@/types';

export async function GET(request: NextRequest) {
  const requestId = request.headers.get('x-request-id') || undefined;
  const userId = request.headers.get('x-user-id') || 'guest';

  try {
    const assets = await sandb.getBrandAssets(userId);
    return apiSuccess(
      {
        count: assets.length,
        assets,
      },
      { requestId }
    );
  } catch (err: unknown) {
    console.error('Error fetching brand assets:', err);
    return apiError('INTERNAL_ERROR', 'Failed to retrieve brand assets', {
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
    const { title, url, category, dimensions } = body;

    if (!url || typeof url !== 'string' || !url.trim()) {
      return apiError('INVALID_INPUT', 'Image or media URL is required', {
        status: 422,
        requestId,
      });
    }

    const newAsset: BrandAsset = {
      id: `asset_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      title: title && typeof title === 'string' ? title.trim() : 'Media Asset',
      url: url.trim(),
      category: category && typeof category === 'string' ? category.trim() : 'General',
      dimensions: dimensions && typeof dimensions === 'string' ? dimensions.trim() : '1920x1080',
    };

    const saved = await sandb.addBrandAsset(userId, newAsset);
    return apiSuccess(saved, { status: 201, requestId });
  } catch (err: unknown) {
    console.error('Error adding brand asset:', err);
    return apiError('INTERNAL_ERROR', 'Failed to add brand asset', {
      status: 500,
      requestId,
    });
  }
}

export async function DELETE(request: NextRequest) {
  const requestId = request.headers.get('x-request-id') || undefined;
  const userId = request.headers.get('x-user-id') || 'guest';
  const { searchParams } = new URL(request.url);
  const assetId = searchParams.get('id');

  if (!assetId) {
    return apiError('INVALID_INPUT', 'Asset ID is required for deletion', {
      status: 422,
      requestId,
    });
  }

  try {
    await sandb.deleteBrandAsset(userId, assetId);
    return apiSuccess({ success: true, removedId: assetId }, { requestId });
  } catch (err: unknown) {
    console.error('Error deleting brand asset:', err);
    return apiError('INTERNAL_ERROR', 'Failed to delete brand asset', {
      status: 500,
      requestId,
    });
  }
}
