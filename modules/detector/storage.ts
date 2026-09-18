import type {
  DetectedError,
  DetectorStorage,
} from "./types";

export class MemoryStorage implements DetectorStorage {
  private readonly errors = new Map<string, DetectedError>();

  async save(error: DetectedError): Promise<void> {
    this.errors.set(error.fingerprint, { ...error });
  }

  async findByFingerprint(
    fingerprint: string
  ): Promise<DetectedError | undefined> {
    const error = this.errors.get(fingerprint);
    return error ? { ...error } : undefined;
  }

  async getAll(): Promise<DetectedError[]> {
    return Array.from(this.errors.values()).map((e) => ({ ...e }));
  }

  async clear(): Promise<void> {
    this.errors.clear();
  }
}

export type { DetectorStorage };