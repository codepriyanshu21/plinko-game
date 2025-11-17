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
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
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

    return NextResponse.json({
      roundId,
      commitHex,
      nonce,
    });
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
