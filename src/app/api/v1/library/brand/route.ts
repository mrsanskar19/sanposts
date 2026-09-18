import { NextRequest } from 'next/server';
import { apiError, apiSuccess } from '@/lib/api/response';
import { sandb } from '@/lib/api/sandb-client';
import { BrandDetails } from '@/types';

export async function GET(request: NextRequest) {
  const requestId = request.headers.get('x-request-id') || undefined;
  const userId = request.headers.get('x-user-id') || 'guest';
  const userNameRaw = request.headers.get('x-user-name');
  const userName = userNameRaw ? decodeURIComponent(userNameRaw) : 'My Brand';

  try {
    const details = await sandb.getBrandDetails(userId);

    const result: BrandDetails = details
      ? {
          brandName: details.brandName || '',
          tagline: details.tagline || '',
          toneOfVoice: details.toneOfVoice || '',
          targetAudience: details.targetAudience || '',
          defaultHashtags: Array.isArray(details.defaultHashtags) ? details.defaultHashtags : [],
        }
      : {
          brandName: userName,
          tagline: '',
          toneOfVoice: '',
          targetAudience: '',
          defaultHashtags: [],
        };

    return apiSuccess(result, { requestId });
  } catch (err: unknown) {
    console.error('Error fetching brand details:', err);
    return apiError('INTERNAL_ERROR', 'Failed to retrieve brand details', {
      status: 500,
      requestId,
    });
  }
}

export async function PUT(request: NextRequest) {
  const requestId = request.headers.get('x-request-id') || undefined;
  const userId = request.headers.get('x-user-id') || 'guest';

  try {
    const body = await request.json().catch(() => ({}));
    const { brandName, tagline, toneOfVoice, targetAudience, defaultHashtags } = body;

    const updated: BrandDetails = {
      brandName: typeof brandName === 'string' ? brandName.trim() : '',
      tagline: typeof tagline === 'string' ? tagline.trim() : '',
      toneOfVoice: typeof toneOfVoice === 'string' ? toneOfVoice.trim() : '',
      targetAudience: typeof targetAudience === 'string' ? targetAudience.trim() : '',
      defaultHashtags: Array.isArray(defaultHashtags)
        ? defaultHashtags.map(t => String(t).trim()).filter(Boolean)
        : [],
    };

    const saved = await sandb.updateBrandDetails(userId, updated);
    return apiSuccess(saved, { requestId });
  } catch (err: unknown) {
    console.error('Error updating brand details:', err);
    return apiError('INTERNAL_ERROR', 'Failed to update brand details', {
      status: 500,
      requestId,
    });
  }
}
