import { NextRequest } from 'next/server';
import { apiSuccess } from '@/lib/api/response';

export async function GET(request: NextRequest) {
  const requestId = request.headers.get('x-request-id') || undefined;

  const catalog = {
    service: 'SanPosts API Engine',
    version: '1.0.0',
    documentationUrl: 'https://sanposts.ai/docs/api/v1',
    features: [
      'Edge Middleware Authentication',
      'Sliding Window Rate Limiting (15-600 req/min)',
      'Multi-Strategy Resilient Load Balancer with Circuit Breaker',
      'Distributed Tracing & Request ID Propagation',
      'Multi-Platform Social Post Generation Engine',
    ],
    endpoints: {
      discovery: {
        'GET /api/v1': 'API service discovery and version metadata',
        'GET /api/v1/health': 'System health check, memory & upstream cluster status',
      },
      auth: {
        'POST /api/v1/auth/login': 'Authenticate and receive Bearer JWT token',
        'POST /api/v1/auth/signup': 'Register new user and receive Bearer JWT token',
        'GET /api/v1/auth/me': 'Get current authenticated user profile [Protected]',
      },
      loadBalancer: {
        'GET /api/v1/load-balancer': 'Inspect upstream node health & metrics',
        'POST /api/v1/load-balancer': 'Update balancing strategy or configure nodes [Admin]',
      },
      resources: {
        'GET /api/v1/posts': 'List saved and generated posts [Protected]',
        'POST /api/v1/posts': 'Generate multi-platform social posts from prompt [Protected]',
        'POST /api/v1/chat': 'Dispatch AI chat completion via Load Balancer [Protected]',
        'GET /api/v1/schedules': 'List scheduled social posts [Protected]',
        'POST /api/v1/schedules': 'Schedule a social post publication [Protected]',
      },
    },
    rateLimiting: {
      auth: '15 requests / minute',
      public: '40 requests / minute',
      authenticated: '150 requests / minute',
      enterprise: '600 requests / minute',
    },
  };

  return apiSuccess(catalog, { requestId });
}
