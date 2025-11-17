import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

async function initDb() {
  console.log('[v0] Initializing database...');

  try {
    // Create rounds table if it doesn't exist
    await sql`
      CREATE TABLE IF NOT EXISTS "Round" (
        id VARCHAR(255) PRIMARY KEY,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        status VARCHAR(50) DEFAULT 'CREATED',
        nonce VARCHAR(255) NOT NULL,
        "commitHex" VARCHAR(255) NOT NULL,
        "serverSeed" VARCHAR(255),
        "clientSeed" VARCHAR(255) NOT NULL,
        "combinedSeed" VARCHAR(255) NOT NULL,
        "pegMapHash" VARCHAR(255) NOT NULL,
        rows INT DEFAULT 12,
        "dropColumn" INT NOT NULL,
        "binIndex" INT NOT NULL,
        "payoutMultiplier" FLOAT NOT NULL,
        "betCents" INT NOT NULL,
        "pathJson" JSONB NOT NULL,
        "revealedAt" TIMESTAMP
      );
    `;

    console.log('[v0] Database initialized successfully');
  } catch (error) {
    console.error('[v0] Database init error:', error);
    throw error;
  }
}

initDb();
