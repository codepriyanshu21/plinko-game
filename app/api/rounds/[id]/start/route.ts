import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import { computeCombinedSeed } from '@/lib/crypto';
import { computeDrop, generatePegMap, pegMapHash } from '@/lib/plinko-engine';
import { Xorshift32, seedFromHash } from '@/lib/crypto';
import { getPayoutMultiplier } from '@/lib/paytable';

const sql = neon(process.env.DATABASE_URL!);

interface StartParams {
  clientSeed: string;
  dropColumn: number;
  betCents: number;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { clientSeed, dropColumn, betCents } = (await request.json()) as StartParams;

    // Fetch round from database
    const result = await sql`
      SELECT * FROM "Round" WHERE id = ${id}
    `;

    if (result.length === 0) {
      return NextResponse.json({ error: 'Round not found' }, { status: 404 });
    }

    const round = result[0];

    if (round.status !== 'CREATED') {
      return NextResponse.json(
        { error: 'Round already started' },
        { status: 400 }
      );
    }

    // Compute combined seed
    const combinedSeed = computeCombinedSeed(round.serverSeed, clientSeed, round.nonce);

    // Generate peg map and simulate drop
    const seed = seedFromHash(combinedSeed);
    const prng = new Xorshift32(seed);
    const pegMap = generatePegMap(prng);
    const pMapHash = pegMapHash(pegMap);

    // Simulate drop path
    let pos = 0;
    const path: boolean[] = [];
    const adj = (dropColumn - Math.floor(12 / 2)) * 0.01;

    for (let r = 0; r < 12; r++) {
      const pegIndex = Math.min(pos, r);
      const peg = pegMap[r].pegs[pegIndex];
      const bias = Math.max(0, Math.min(1, peg.leftBias + adj));

      const rnd = prng.rand();
      const goLeft = rnd < bias;
      path.push(goLeft);

      if (!goLeft) {
        pos += 1;
      }
    }

    const binIndex = pos;
    const payoutMultiplier = getPayoutMultiplier(binIndex);

    // Update round with STARTED status
    await sql`
      UPDATE "Round"
      SET status = 'STARTED', 
          "clientSeed" = ${clientSeed},
          "combinedSeed" = ${combinedSeed},
          "pegMapHash" = ${pMapHash},
          "dropColumn" = ${dropColumn},
          "binIndex" = ${binIndex},
          "payoutMultiplier" = ${payoutMultiplier},
          "betCents" = ${betCents},
          "pathJson" = ${JSON.stringify(path)}
      WHERE id = ${id}
    `;

    return NextResponse.json({
      roundId: id,
      pegMapHash: pMapHash,
      rows: 12,
      binIndex,
      payoutMultiplier,
    });
  } catch (error) {
    console.error('[v0] Start endpoint error:', error);
    return NextResponse.json({ error: 'Failed to start round' }, { status: 500 });
  }
}
