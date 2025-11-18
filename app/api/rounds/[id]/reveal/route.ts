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
    // No serverSeed required from client — server holds it in DB and will reveal it

    // Fetch round
    const result = await sql`
      SELECT * FROM "Round" WHERE id = ${id}
    `;

    if (result.length === 0) {
      return NextResponse.json({ error: 'Round not found' }, { status: 404 });
    }

    const round = result[0];

    const status = String(round.status ?? '').toUpperCase();

    // If the round has already been revealed, return the reveal info (idempotent)
    if (status === 'REVEALED') {
      console.info('[v0] Reveal requested for already revealed round, returning existing reveal', { id });
      return NextResponse.json({
        roundId: id,
        status: 'REVEALED',
        serverSeed: round.serverSeed,
        combinedSeed: round.combinedSeed,
        binIndex: round.binIndex,
        pathJson: round.pathJson,
      });
    }

    if (status !== 'STARTED') {
      console.error('[v0] Reveal attempted for round with wrong status', { id, status, round });
      return NextResponse.json(
        { error: 'Round not in started state', currentStatus: round.status },
        { status: 400 }
      );
    }

    // Validate server seed from DB against the stored commit
    const serverSeed = round.serverSeed;
    if (!serverSeed) {
      return NextResponse.json({ error: 'Server seed not available' }, { status: 400 });
    }

    if (!validateCommit(round.commitHex, serverSeed, round.nonce)) {
      return NextResponse.json({ error: 'Commit mismatch' }, { status: 500 });
    }

    // Update to REVEALED status
    await sql`
      UPDATE "Round"
      SET status = 'REVEALED', 
          "revealedAt" = CURRENT_TIMESTAMP
      WHERE id = ${id}
    `;

    return NextResponse.json({
      roundId: id,
      status: 'REVEALED',
      serverSeed,
      combinedSeed: round.combinedSeed,
      binIndex: round.binIndex,
      pathJson: round.pathJson,
    });
  } catch (error) {
    console.error('[v0] Reveal endpoint error:', error instanceof Error ? error.stack ?? error.message : error);
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: 'Failed to reveal round', details: msg }, { status: 500 });
  }
}
