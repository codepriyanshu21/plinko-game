import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

export async function POST() {
  try {
    if (!process.env.DATABASE_URL) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 500 }
      );
    }

    // If running in development, ensure any partial or stale table is removed
    // so the CREATE TABLE below can run cleanly after DB resets.
    if (process.env.NODE_ENV !== 'production') {
      await sql`DROP TABLE IF EXISTS "Round"`;
    }

    await sql`
      CREATE TABLE IF NOT EXISTS "Round" (
        id TEXT PRIMARY KEY,
        nonce TEXT NOT NULL,
        "commitHex" TEXT NOT NULL,
        "serverSeed" TEXT NOT NULL,
        "clientSeed" TEXT,
        "combinedSeed" TEXT,
        "pegMapHash" TEXT,
        "dropColumn" INTEGER,
        "binIndex" INTEGER,
        "payoutMultiplier" DECIMAL(10, 2),
        "betCents" INTEGER,
        "pathJson" TEXT,
        status TEXT NOT NULL DEFAULT 'CREATED',
        "revealedAt" TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    await sql`CREATE INDEX IF NOT EXISTS idx_round_status ON "Round"(status)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_round_created_at ON "Round"(created_at)`;

    return NextResponse.json({ success: true, message: 'Database initialized' });
  } catch (error) {
    console.error('[v0] Database initialization error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { 
        error: 'Failed to initialize database',
        details: errorMessage
      },
      { status: 500 }
    );
  }
}
