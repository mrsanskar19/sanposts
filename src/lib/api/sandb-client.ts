import { MultiConnection } from '@/modules/sandb';

export interface DbUserRecord {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  plan: 'Free' | 'Pro' | 'Enterprise';
  avatar: string;
  creditsUsed: number;
  creditsTotal: number;
  createdAt: string;
}

export interface PasswordResetRecord {
  email: string;
  token: string;
  expiresAt: number; // timestamp in ms
  used: boolean;
}

/**
 * SanDB Cluster Database Manager & Singleton Connector.
 * Uses src/sandb MultiConnection to distribute documents across MongoDB nodes.
 */
class SanDBClient {
  private static instance: SanDBClient;
  private db: MultiConnection;
  private isConnected = false;
  private connectionPromise: Promise<void> | null = null;

  // Resilient memory cache for active cluster session / fallback
  private inMemoryUsers = new Map<string, DbUserRecord>();
  private inMemoryResets = new Map<string, PasswordResetRecord>();

  private constructor() {
    this.db = new MultiConnection();
  }

  public static getInstance(): SanDBClient {
    if (!SanDBClient.instance) {
      SanDBClient.instance = new SanDBClient();
    }
    return SanDBClient.instance;
  }

  public async getDb(): Promise<MultiConnection> {
    if (!this.isConnected) {
      if (!this.connectionPromise) {
        this.connectionPromise = this.initConnection();
      }
      await this.connectionPromise;
    }
    return this.db;
  }

  private async initConnection() {
    const rawNodes =
      process.env.SANDB_NODES ||
      process.env.MONGODB_URI ||
      'mongodb://localhost:27017/sanposts_node1,mongodb://localhost:27017/sanposts_node2';

    const uris = rawNodes
      .split(',')
      .map(uri => uri.trim())
      .filter(Boolean);

    try {
      await this.db.connect(uris);
      this.isConnected = true;
      console.log(`[SanDB] Connected to ${uris.length} cluster node(s)`);
    } catch (err: unknown) {
      console.warn('[SanDB] Running in fallback mode (MongoDB nodes offline or unreachable):', err);
      this.isConnected = false;
    }
  }

  public async getNodeStats() {
    try {
      return await this.db.getNodeStats();
    } catch {
      return [];
    }
  }

  public getRawConnection(): MultiConnection {
    return this.db;
  }

  // ==========================================
  // User Management Methods
  // ==========================================
  public async findUserByEmail(email: string): Promise<DbUserRecord | null> {
    const normalizedEmail = email.trim().toLowerCase();
    try {
      const db = await this.getDb();
      const user = await db.findOne<DbUserRecord>('users', { email: normalizedEmail });
      if (user) return user;
    } catch {
      // ignore
    }
    return this.inMemoryUsers.get(normalizedEmail) || null;
  }

  public async findUserById(id: string): Promise<DbUserRecord | null> {
    try {
      const db = await this.getDb();
      const user = await db.findOne<DbUserRecord>('users', { id });
      if (user) return user;
    } catch {
      // ignore
    }
    for (const u of this.inMemoryUsers.values()) {
      if (u.id === id) return u;
    }
    return null;
  }

  public async saveUser(user: DbUserRecord): Promise<void> {
    const normalizedEmail = user.email.trim().toLowerCase();
    user.email = normalizedEmail;
    this.inMemoryUsers.set(normalizedEmail, user);

    try {
      const db = await this.getDb();
      await db.insertOne('users', user as any);
    } catch {
      // Stored in memory cache
    }
  }

  public async updateUserPassword(email: string, passwordHash: string): Promise<boolean> {
    const normalizedEmail = email.trim().toLowerCase();
    const memUser = this.inMemoryUsers.get(normalizedEmail);
    if (memUser) {
      memUser.passwordHash = passwordHash;
    }

    try {
      const db = await this.getDb();
      await db.updateOne('users', { email: normalizedEmail }, { $set: { passwordHash } });
      return true;
    } catch {
      return !!memUser;
    }
  }

  // ==========================================
  // Password Reset Methods
  // ==========================================
  public async createPasswordReset(email: string, token: string, expiresInMinutes = 60): Promise<PasswordResetRecord> {
    const record: PasswordResetRecord = {
      email: email.trim().toLowerCase(),
      token,
      expiresAt: Date.now() + expiresInMinutes * 60 * 1000,
      used: false,
    };

    this.inMemoryResets.set(token, record);

    try {
      const db = await this.getDb();
      await db.insertOne('password_resets', record as any);
    } catch {
      // Stored in memory
    }

    return record;
  }

  public async findPasswordReset(token: string): Promise<PasswordResetRecord | null> {
    try {
      const db = await this.getDb();
      const reset = await db.findOne<PasswordResetRecord>('password_resets', { token });
      if (reset) return reset;
    } catch {
      // ignore
    }
    return this.inMemoryResets.get(token) || null;
  }

  public async markPasswordResetUsed(token: string): Promise<void> {
    const memReset = this.inMemoryResets.get(token);
    if (memReset) {
      memReset.used = true;
    }

    try {
      const db = await this.getDb();
      await db.updateOne('password_resets', { token }, { $set: { used: true } });
    } catch {
      // ignore
    }
  }

  // ==========================================
  // Content Library Management (Saved Posts, Brand, Assets)
  // ==========================================
  private inMemorySavedPosts = new Map<string, any[]>();
  private inMemoryBrandDetails = new Map<string, any>();
  private inMemoryBrandAssets = new Map<string, any[]>();

  public async getSavedPosts(userId: string): Promise<any[]> {
    try {
      const db = await this.getDb();
      const posts = await db.find('saved_posts', { userId });
      if (posts && posts.length > 0) return posts;
    } catch {
      // ignore
    }
    return this.inMemorySavedPosts.get(userId) || [];
  }

  public async savePost(userId: string, post: any): Promise<any> {
    const doc = {
      ...post,
      userId,
      isSaved: true,
      savedAt: new Date().toISOString(),
    };

    const currentList = this.inMemorySavedPosts.get(userId) || [];
    const filtered = currentList.filter(p => p.id !== post.id);
    filtered.unshift(doc);
    this.inMemorySavedPosts.set(userId, filtered);

    try {
      const db = await this.getDb();
      await db.deleteOne('saved_posts', { id: post.id, userId });
      await db.insertOne('saved_posts', doc);
    } catch {
      // Stored in memory
    }

    return doc;
  }

  public async deleteSavedPost(userId: string, postId: string): Promise<boolean> {
    const currentList = this.inMemorySavedPosts.get(userId) || [];
    this.inMemorySavedPosts.set(userId, currentList.filter(p => p.id !== postId));

    try {
      const db = await this.getDb();
      const res = await db.deleteOne('saved_posts', { id: postId, userId });
      return (res.deletedCount || 0) > 0;
    } catch {
      return true;
    }
  }

  public async getBrandDetails(userId: string): Promise<any | null> {
    try {
      const db = await this.getDb();
      const details = await db.findOne('brand_details', { userId });
      if (details) return details;
    } catch {
      // ignore
    }
    return this.inMemoryBrandDetails.get(userId) || null;
  }

  public async updateBrandDetails(userId: string, details: any): Promise<any> {
    const record = {
      ...details,
      userId,
      updatedAt: new Date().toISOString(),
    };

    this.inMemoryBrandDetails.set(userId, record);

    try {
      const db = await this.getDb();
      await db.upsertOne('brand_details', { userId }, { $set: record });
    } catch {
      // Stored in memory
    }

    return record;
  }

  public async getBrandAssets(userId: string): Promise<any[]> {
    try {
      const db = await this.getDb();
      const assets = await db.find('brand_assets', { userId });
      if (assets && assets.length > 0) return assets;
    } catch {
      // ignore
    }
    return this.inMemoryBrandAssets.get(userId) || [];
  }

  public async addBrandAsset(userId: string, asset: any): Promise<any> {
    const doc = {
      id: asset.id || `asset_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      title: asset.title,
      url: asset.url,
      category: asset.category || 'General',
      dimensions: asset.dimensions || '1920x1080',
      userId,
      createdAt: new Date().toISOString(),
    };

    const current = this.inMemoryBrandAssets.get(userId) || [];
    current.unshift(doc);
    this.inMemoryBrandAssets.set(userId, current);

    try {
      const db = await this.getDb();
      await db.insertOne('brand_assets', doc);
    } catch {
      // Stored in memory
    }

    return doc;
  }

  public async deleteBrandAsset(userId: string, assetId: string): Promise<boolean> {
    const current = this.inMemoryBrandAssets.get(userId) || [];
    this.inMemoryBrandAssets.set(userId, current.filter(a => a.id !== assetId));

    try {
      const db = await this.getDb();
      const res = await db.deleteOne('brand_assets', { id: assetId, userId });
      return (res.deletedCount || 0) > 0;
    } catch {
      return true;
    }
  }
}

export const sandb = SanDBClient.getInstance();

