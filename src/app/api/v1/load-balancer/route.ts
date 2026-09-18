import { NextRequest } from 'next/server';
import { apiError, apiSuccess } from '@/lib/api/response';
import {
  BalancingStrategy,
  globalLoadBalancer,
  UpstreamNode,
} from '@/lib/api/load-balancer';

export async function GET(request: NextRequest) {
  const requestId = request.headers.get('x-request-id') || undefined;
  const metrics = globalLoadBalancer.getMetrics();

  return apiSuccess(metrics, { requestId });
}

export async function POST(request: NextRequest) {
  const requestId = request.headers.get('x-request-id') || undefined;

  try {
    const body = await request.json().catch(() => ({}));
    const { action, strategy, node } = body;

    // Action: update strategy
    if (action === 'set_strategy' || strategy) {
      const validStrategies: BalancingStrategy[] = [
        'round-robin',
        'weighted-round-robin',
        'least-connections',
        'least-latency',
        'random',
      ];

      const targetStrategy = strategy as BalancingStrategy;
      if (!validStrategies.includes(targetStrategy)) {
        return apiError(
          'INVALID_STRATEGY',
          `Strategy must be one of: ${validStrategies.join(', ')}`,
          { status: 422, requestId }
        );
      }

      globalLoadBalancer.setStrategy(targetStrategy);

      return apiSuccess(
        {
          message: `Balancing strategy updated to ${targetStrategy}`,
          metrics: globalLoadBalancer.getMetrics(),
        },
        { requestId }
      );
    }

    // Action: register or update an upstream node
    if (action === 'add_node' && node) {
      const newNode: UpstreamNode = {
        id: node.id || `node-${crypto.randomUUID().substring(0, 6)}`,
        name: node.name || 'Custom Worker Node',
        url: node.url || 'https://custom.worker.sanposts.internal',
        region: node.region || 'us-central-1',
        weight: Number(node.weight) || 1,
        status: 'healthy',
        activeConnections: 0,
        totalRequests: 0,
        totalErrors: 0,
        consecutiveFailures: 0,
        averageLatencyMs: 50,
        lastCheckedAt: new Date().toISOString(),
      };

      globalLoadBalancer.addNode(newNode);

      return apiSuccess(
        {
          message: `Node ${newNode.id} registered successfully`,
          metrics: globalLoadBalancer.getMetrics(),
        },
        { status: 201, requestId }
      );
    }

    // Action: update node status manually
    if (action === 'set_node_status' && body.nodeId && body.status) {
      globalLoadBalancer.updateNodeStatus(body.nodeId, body.status);
      return apiSuccess(
        {
          message: `Node ${body.nodeId} status set to ${body.status}`,
          metrics: globalLoadBalancer.getMetrics(),
        },
        { requestId }
      );
    }

    return apiError('UNKNOWN_ACTION', 'Action must be set_strategy, add_node, or set_node_status', {
      status: 400,
      requestId,
    });
  } catch (err: unknown) {
    console.error('Load balancer management error:', err);
    return apiError('INTERNAL_ERROR', 'Failed to update load balancer configuration', {
      status: 500,
      requestId,
    });
  }
}
