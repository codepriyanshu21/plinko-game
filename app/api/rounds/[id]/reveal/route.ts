import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import { validateCommit } from '@/lib/crypto';

const sql = neon(process.env.DATABASE_URL!);

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { serverSeed } = body;

    // Fetch round
    const result = await sql`
      SELECT * FROM "Round" WHERE id = ${id}
    `;

    if (result.length === 0) {
      return NextResponse.json({ error: 'Round not found' }, { status: 404 });
    }

    const round = result[0];

    if (round.status !== 'STARTED') {
      return NextResponse.json(
        { error: 'Round not in started state' },
        { status: 400 }
      );
    }

    // Validate server seed against commit
    if (!validateCommit(round.commitHex, serverSeed, round.nonce)) {
      return NextResponse.json(
        { error: 'Invalid server seed' },
        { status: 400 }
      );
    }

    // Update to REVEALED status
    await sql`
      UPDATE "Round"
      SET status = 'REVEALED', 
          "serverSeed" = ${serverSeed},
          "revealedAt" = CURRENT_TIMESTAMP
      WHERE id = ${id}
    `;

    return NextResponse.json({
      roundId: id,
      status: 'REVEALED',
      serverSeed,
    });
  } catch (error) {
    console.error('[v0] Reveal endpoint error:', error);
    return NextResponse.json({ error: 'Failed to reveal round' }, { status: 500 });
  }
}
