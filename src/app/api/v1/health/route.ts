import { NextRequest } from 'next/server';
import { apiSuccess } from '@/lib/api/response';
import { globalLoadBalancer } from '@/lib/api/load-balancer';
import { sandb } from '@/lib/api/sandb-client';

const serverStartTime = Date.now();

export async function GET(request: NextRequest) {
  const requestId = request.headers.get('x-request-id') || undefined;
  const lbMetrics = globalLoadBalancer.getMetrics();
  const dbNodeStats = await sandb.getNodeStats();

  const healthData = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor((Date.now() - serverStartTime) / 1000),
    environment: process.env.NODE_ENV || 'development',
    system: {
      memoryUsageMb: Math.round((process.memoryUsage?.().heapUsed || 0) / 1024 / 1024),
      nodeVersion: process.version,
    },
    database: {
      engine: 'SanDB (MultiConnection)',
      nodesConfigured: dbNodeStats.length,
      activeNodes: dbNodeStats.filter(n => n.status === 'online').length,
      nodeStats: dbNodeStats,
    },
    loadBalancer: {
      strategy: lbMetrics.strategy,
      totalNodes: lbMetrics.totalNodes,
      healthyNodes: lbMetrics.healthyNodes,
      clusterStatus: lbMetrics.healthyNodes > 0 ? 'operational' : 'degraded',
    },
  };

  return apiSuccess(healthData, { requestId });
}
