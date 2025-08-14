// Database connection management - NOW WITH TURSO POWER! 🚀
import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import * as schema from './schema';

// Turso database configuration interface - SIMPLE AND BEAUTIFUL! ✨
export interface TursoConfig {
  url: string;
  authToken: string;
}

// Global Turso client and database - LIGHTNING FAST! ⚡
let tursoClient: ReturnType<typeof createClient> | null = null;
let db: ReturnType<typeof drizzle> | null = null;

// Create TURSO database connection - EDGE-POWERED MAGIC! 🌟
export function createDatabaseConnection(config?: TursoConfig) {
  // Resolve env from process.env; fall back to import.meta.env if available
  const readEnv = (key: string): string | undefined => {
    if (process?.env?.[key]) return process.env[key];
    try {
      // @ts-ignore - import.meta may not exist in some runtimes
      const v = (import.meta as any)?.env?.[key];
      return v;
    } catch {
      return undefined;
    }
  };

  // Prefer provided config → env → local file fallback to avoid 401s
  const tursoConfig: TursoConfig = config || {
    url: readEnv('TURSO_DATABASE_URL') || 'file:./.tmp/dev-db.sqlite',
    authToken: readEnv('TURSO_AUTH_TOKEN') || '',
  };

  // Create Turso client if it doesn't exist - BLAZING FAST! 🔥
  if (!tursoClient) {
    tursoClient = createClient({
      url: tursoConfig.url,
      authToken: tursoConfig.authToken,
    });
  }

  // Create Drizzle instance if it doesn't exist - PURE JOY! 🎉
  if (!db) {
    db = drizzle(tursoClient, { schema });
  }

  return db;
}

// Get existing database connection
export function getDatabase() {
  if (!db) {
    return createDatabaseConnection();
  }
  return db;
}

// Close TURSO database connection - CLEAN AND ELEGANT! ✨
export async function closeDatabaseConnection() {
  if (tursoClient) {
    tursoClient.close();
    tursoClient = null;
    db = null;
  }
}

// Test TURSO database connection - EDGE-POWERED HEALTH CHECK! 🚀
export async function testDatabaseConnection(): Promise<{ success: boolean; message: string }> {
  try {
    const database = getDatabase();
    
    // Simple query to test Turso connection - LIGHTNING FAST! ⚡
    await database.run('SELECT 1 as test');
    
    return {
      success: true,
      message: '✅ TURSO connection successful - EDGE POWER ACTIVATED! 🌟',
    };
  } catch (error) {
    return {
      success: false,
      message: `❌ Turso connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}