import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import crypto from 'crypto';
import { computeCommit } from '@/lib/crypto';

const sql = neon(process.env.DATABASE_URL!);

export async function POST(request: NextRequest) {
  try {
    if (!process.env.DATABASE_URL) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 500 }
      );
    }

    const serverSeed = crypto.randomBytes(32).toString('hex');
    const nonce = crypto.randomBytes(4).toString('hex');
    const commitHex = computeCommit(serverSeed, nonce);
    const roundId = crypto.randomBytes(12).toString('hex');
    
    const result = await sql.query(
      `INSERT INTO "Round" (
        id, 
        nonce, 
        "commitHex", 
        "serverSeed", 
        "clientSeed", 
        "combinedSeed", 
        "pegMapHash", 
        "dropColumn", 
        "binIndex", 
        "payoutMultiplier", 
        "betCents", 
        "pathJson", 
        status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING *`,
      [
        roundId,
        nonce,
        commitHex,
        serverSeed,
        null,
        null,
        null,
        0,
        0,
        1.0,
        0,
        '[]',
        'CREATED'
      ]
    );

    // For debugging: log the insert result and return the inserted row in dev
    console.info('[v0] Commit insert result:', result);

    const inserted = (result && (result.rows || result[0])) ? (result.rows ? result.rows[0] : result[0]) : null;

    const payload: any = { roundId, commitHex, nonce };
    if (process.env.NODE_ENV !== 'production') {
      // In dev include serverSeed so you can verify DB contents — do NOT expose in production
      payload.serverSeed = serverSeed;
      payload.inserted = inserted;
    }

    return NextResponse.json(payload);
  } catch (error) {
    console.error('[v0] Commit endpoint error:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { 
        error: 'Failed to create round',
        details: errorMessage
      },
      { status: 500 }
    );
  }
}
