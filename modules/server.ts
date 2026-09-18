import "server-only";

import { SelfHealingModules } from "./index";
import { MemoryStorage } from "./detector/storage";
import type { DetectedError, DetectorStorage } from "./detector/types";
import { sandb } from "@/lib/api/sandb-client";

/**
 * Resilient SanDB cluster adapter for Self-Healing error storage.
 * Automatically persists to MongoDB cluster nodes when available,
 * while maintaining an in-memory store for high-speed retrieval
 * and zero-downtime fallback when database nodes are offline.
 */
class SanDBDetectorStorage implements DetectorStorage {
  private readonly memoryFallback = new MemoryStorage();
  private readonly collectionName = "self_healing_incidents";

  async save(error: DetectedError): Promise<void> {
    await this.memoryFallback.save(error);

    try {
      const db = await sandb.getDb();
      await db.upsertOne(
        this.collectionName,
        { fingerprint: error.fingerprint },
        { $set: error }
      );
    } catch {
      // Silently fall back to in-memory store when DB is unavailable
    }
  }

  async findByFingerprint(
    fingerprint: string
  ): Promise<DetectedError | undefined> {
    try {
      const db = await sandb.getDb();
      const found = await db.findOne<DetectedError>(this.collectionName, {
        fingerprint,
      });

      if (found) {
        const { _id, ...clean } = found as unknown as Record<string, unknown>;
        return clean as unknown as DetectedError;
      }
    } catch {
      // Fall through to memory store
    }

    return this.memoryFallback.findByFingerprint(fingerprint);
  }

  async getAll(): Promise<DetectedError[]> {
    try {
      const db = await sandb.getDb();
      const items = await db.find<DetectedError>(this.collectionName, {});

      if (items && items.length > 0) {
        return items.map((item: unknown) => {
          const { _id, ...clean } = item as Record<string, unknown>;
          return clean as unknown as DetectedError;
        });
      }
    } catch {
      // Fall through to memory store
    }

    return this.memoryFallback.getAll();
  }

  async clear(): Promise<void> {
    await this.memoryFallback.clear();

    try {
      const db = await sandb.getDb();
      await db.deleteMany(this.collectionName, {});
    } catch {
      // Ignored in fallback
    }
  }
}

const globalForSelfHealing = globalThis as typeof globalThis & {
  __selfHealing?: SelfHealingModules;
};

export const selfHealing =
  globalForSelfHealing.__selfHealing ??
  new SelfHealingModules({
    detector: {
      enabled: true,
      environment: process.env.NODE_ENV ?? "development",
      deduplicationWindowMs: 5 * 60 * 1000,
      captureRequestBody: false,
      captureHeaders: false,
      captureBrowser: true,
    },
    detectorStorage: new SanDBDetectorStorage(),
    openrouter: {
      apiKey: process.env.OPENROUTER_API_KEY,
      model: process.env.OPENROUTER_MODEL || "qwen/qwen3.8-27b:free",
    },
    jules: {
      apiKey: process.env.JULES_API_KEY,
      defaultRepo: process.env.GITHUB_REPOSITORY || "mrsanskar19/sanposts",
    },
  });

if (!globalForSelfHealing.__selfHealing) {
  globalForSelfHealing.__selfHealing = selfHealing;
  selfHealing.start();
}