/**
 * Enterprise Load Balancing & Circuit Breaker Engine for API v1.
 * Supports Round-Robin, Weighted Round-Robin, Least-Connections, Least-Latency, and Failover.
 */

export type BalancingStrategy =
  | 'round-robin'
  | 'weighted-round-robin'
  | 'least-connections'
  | 'least-latency'
  | 'random';

export type NodeStatus = 'healthy' | 'degraded' | 'unhealthy';

export interface UpstreamNode {
  id: string;
  name: string;
  url: string;
  region: string;
  weight: number;              // 1 to 100
  status: NodeStatus;
  activeConnections: number;
  totalRequests: number;
  totalErrors: number;
  consecutiveFailures: number;
  averageLatencyMs: number;
  lastCheckedAt: string;
}

export interface LoadBalancerMetrics {
  strategy: BalancingStrategy;
  totalNodes: number;
  healthyNodes: number;
  totalDispatchedRequests: number;
  uptimeSeconds: number;
  nodes: UpstreamNode[];
}

export class LoadBalancer {
  private nodes: Map<string, UpstreamNode> = new Map();
  private strategy: BalancingStrategy = 'round-robin';
  private roundRobinIndex = 0;
  private totalDispatched = 0;
  private startedAt = Date.now();

  // Circuit breaker settings
  private failureThreshold = 3;       // Trips node to unhealthy after 3 consecutive failures
  private recoveryCooldownMs = 30000; // 30s recovery probation window

  constructor(initialNodes?: UpstreamNode[], strategy: BalancingStrategy = 'round-robin') {
    this.strategy = strategy;
    if (initialNodes && initialNodes.length > 0) {
      initialNodes.forEach(node => this.nodes.set(node.id, { ...node }));
    } else {
      this.initDefaultNodes();
    }
  }

  private initDefaultNodes() {
    const defaultNodes: UpstreamNode[] = [
      {
        id: 'node-us-east',
        name: 'US East Core (Primary)',
        url: 'https://us-east.worker.sanposts.internal',
        region: 'us-east-1',
        weight: 5,
        status: 'healthy',
        activeConnections: 0,
        totalRequests: 0,
        totalErrors: 0,
        consecutiveFailures: 0,
        averageLatencyMs: 42,
        lastCheckedAt: new Date().toISOString(),
      },
      {
        id: 'node-eu-west',
        name: 'EU West Replica (Frankfurt)',
        url: 'https://eu-west.worker.sanposts.internal',
        region: 'eu-central-1',
        weight: 3,
        status: 'healthy',
        activeConnections: 0,
        totalRequests: 0,
        totalErrors: 0,
        consecutiveFailures: 0,
        averageLatencyMs: 65,
        lastCheckedAt: new Date().toISOString(),
      },
      {
        id: 'node-ap-south',
        name: 'Asia Pacific Edge (Mumbai)',
        url: 'https://ap-south.worker.sanposts.internal',
        region: 'ap-south-1',
        weight: 4,
        status: 'healthy',
        activeConnections: 0,
        totalRequests: 0,
        totalErrors: 0,
        consecutiveFailures: 0,
        averageLatencyMs: 38,
        lastCheckedAt: new Date().toISOString(),
      },
    ];

    defaultNodes.forEach(node => this.nodes.set(node.id, node));
  }

  public getNodes(): UpstreamNode[] {
    return Array.from(this.nodes.values());
  }

  public getStrategy(): BalancingStrategy {
    return this.strategy;
  }

  public setStrategy(strategy: BalancingStrategy) {
    this.strategy = strategy;
  }

  public addNode(node: UpstreamNode) {
    this.nodes.set(node.id, { ...node });
  }

  public removeNode(nodeId: string): boolean {
    return this.nodes.delete(nodeId);
  }

  public updateNodeStatus(nodeId: string, status: NodeStatus) {
    const node = this.nodes.get(nodeId);
    if (node) {
      node.status = status;
      node.lastCheckedAt = new Date().toISOString();
      if (status === 'healthy') {
        node.consecutiveFailures = 0;
      }
    }
  }

  /**
   * Filter nodes eligible to receive traffic.
   */
  private getAvailableNodes(): UpstreamNode[] {
    const available = Array.from(this.nodes.values()).filter(
      n => n.status === 'healthy' || n.status === 'degraded'
    );

    // Fallback: if all nodes are flagged unhealthy, attempt best-effort on any registered node
    if (available.length === 0) {
      return Array.from(this.nodes.values());
    }

    return available;
  }

  /**
   * Select best upstream node according to active balancing strategy.
   */
  public selectNode(): UpstreamNode {
    const candidates = this.getAvailableNodes();
    if (candidates.length === 0) {
      throw new Error('LoadBalancer: No upstream nodes configured');
    }

    let selected: UpstreamNode;

    switch (this.strategy) {
      case 'least-connections': {
        selected = candidates.reduce((best, curr) =>
          curr.activeConnections < best.activeConnections ? curr : best
        );
        break;
      }

      case 'least-latency': {
        selected = candidates.reduce((best, curr) =>
          curr.averageLatencyMs < best.averageLatencyMs ? curr : best
        );
        break;
      }

      case 'weighted-round-robin': {
        // Build lottery pool based on weights
        const weightedPool: UpstreamNode[] = [];
        candidates.forEach(node => {
          const count = Math.max(1, Math.round(node.weight));
          for (let i = 0; i < count; i++) {
            weightedPool.push(node);
          }
        });
        const index = this.roundRobinIndex % weightedPool.length;
        this.roundRobinIndex++;
        selected = weightedPool[index];
        break;
      }

      case 'random': {
        const randomIndex = Math.floor(Math.random() * candidates.length);
        selected = candidates[randomIndex];
        break;
      }

      case 'round-robin':
      default: {
        const index = this.roundRobinIndex % candidates.length;
        this.roundRobinIndex++;
        selected = candidates[index];
        break;
      }
    }

    this.totalDispatched++;
    selected.activeConnections++;
    selected.totalRequests++;

    return selected;
  }

  /**
   * Record operation completion and latency.
   */
  public recordResult(nodeId: string, latencyMs: number, success: boolean) {
    const node = this.nodes.get(nodeId);
    if (!node) return;

    node.activeConnections = Math.max(0, node.activeConnections - 1);

    if (success) {
      node.consecutiveFailures = 0;
      // Exponential moving average for latency
      node.averageLatencyMs = Math.round(
        node.averageLatencyMs * 0.8 + latencyMs * 0.2
      );
      if (node.status === 'degraded') {
        node.status = 'healthy';
      }
    } else {
      node.totalErrors++;
      node.consecutiveFailures++;

      // Circuit Breaker logic
      if (node.consecutiveFailures >= this.failureThreshold) {
        node.status = 'unhealthy';
        node.lastCheckedAt = new Date().toISOString();

        // Schedule probation retry
        setTimeout(() => {
          if (this.nodes.has(nodeId)) {
            const n = this.nodes.get(nodeId)!;
            if (n.status === 'unhealthy') {
              n.status = 'degraded'; // Probation trial
            }
          }
        }, this.recoveryCooldownMs);
      }
    }
  }

  /**
   * High-level dispatch helper with circuit-breaker failover.
   */
  public async executeWithFailover<T>(
    workload: (node: UpstreamNode) => Promise<T>,
    maxRetries = 2
  ): Promise<{ result: T; node: UpstreamNode; latencyMs: number }> {
    let lastError: unknown;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      const node = this.selectNode();
      const startTime = performance.now();

      try {
        const result = await workload(node);
        const latency = Math.round(performance.now() - startTime);
        this.recordResult(node.id, latency, true);
        return { result, node, latencyMs: latency };
      } catch (err) {
        const latency = Math.round(performance.now() - startTime);
        this.recordResult(node.id, latency, false);
        lastError = err;
        console.warn(`[LoadBalancer] Node ${node.id} failed attempt ${attempt + 1}:`, err);
      }
    }

    throw lastError || new Error('LoadBalancer: All upstream attempts failed');
  }

  /**
   * Export diagnostic metrics for load-balancer health monitoring.
   */
  public getMetrics(): LoadBalancerMetrics {
    const nodes = Array.from(this.nodes.values());
    const healthy = nodes.filter(n => n.status === 'healthy').length;

    return {
      strategy: this.strategy,
      totalNodes: nodes.length,
      healthyNodes: healthy,
      totalDispatchedRequests: this.totalDispatched,
      uptimeSeconds: Math.floor((Date.now() - this.startedAt) / 1000),
      nodes,
    };
  }
}

// Global Singleton Instance
export const globalLoadBalancer = new LoadBalancer();
