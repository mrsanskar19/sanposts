# Skill Guide: Shared And Balanced Database Module (`modules/sandb`)

This module houses the custom cluster database manager. It distributes documents across multiple active MongoDB nodes, load-balances searches, measures individual node latency, handles bulk writes, and supports full sharded insertions and collections rebalancing.

## Capabilities

- **Automatic Sharding & Insertion:** Intelligently balances documents to prevent overload on a single server node.
- **Fail-safe Connection Pooling:** Monitors individual node heartbeats and marks failed engines offline to avoid query locks.
- **Bulk Write & Transactions:** Supports atomic sharded transactions and batch operations across cluster groups.
- **Latency Diagnostics:** Measures individual connection latency and returns active operational stats.

## API Specification

```typescript
import { MultiConnection } from "@/modules/sandb";

const db = new MultiConnection();

// 1. Establish node connections
await db.connect([
    "mongodb://localhost:27017/socialdine_node1",
    "mongodb://localhost:27017/socialdine_node2"
]);

// 2. Insert document (sharded load balancing)
const insertResult = await db.insertOne("users", {
    email: "sanskar@example.com",
    name: "Sanskar"
});

// 3. Search document across all active nodes
const user = await db.findOne("users", { email: "sanskar@example.com" });

// 4. Retrieve paginated data
const pageResult = await db.findPaginated("posts", {}, 1, 10);
console.log(pageResult.data); // Array of documents
console.log(pageResult.total); // Sum counts from all nodes

// 5. Run aggregation pipelines
const aggregates = await db.aggregate("analytics_events", [
    { $match: { type: "login" } },
    { $group: { _id: "$userId", count: { $sum: 1 } } }
]);

// 6. Inspect node statistics and network latencies
const clusterStats = await db.getNodeStats();
console.log(clusterStats); // [{ status: "online", latency: 2 }, ...]
```
