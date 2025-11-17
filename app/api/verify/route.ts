import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import { computeCommit, computeCombinedSeed, seedFromHash, Xorshift32 } from '@/lib/crypto';
import { generatePegMap, pegMapHash } from '@/lib/plinko-engine';

const sql = neon(process.env.DATABASE_URL!);

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const serverSeed = searchParams.get('serverSeed');
    const clientSeed = searchParams.get('clientSeed');
    const nonce = searchParams.get('nonce');
    const dropColumn = searchParams.get('dropColumn');
    const roundId = searchParams.get('roundId');

    if (!serverSeed || !clientSeed || !nonce || dropColumn === null) {
      return NextResponse.json(
        { error: 'Missing parameters' },
        { status: 400 }
      );
    }

    const dropCol = parseInt(dropColumn, 10);

    // Recompute everything from scratch
    const commitHex = computeCommit(serverSeed, nonce);
    const combinedSeed = computeCombinedSeed(serverSeed, clientSeed, nonce);

    // Generate peg map and compute path
    const seed = seedFromHash(combinedSeed);
    const prng = new Xorshift32(seed);
    const pegMap = generatePegMap(prng);
    const pMapHash = pegMapHash(pegMap);

    // Simulate drop
    let pos = 0;
    const path: boolean[] = [];
    const adj = (dropCol - Math.floor(12 / 2)) * 0.01;

    for (let r = 0; r < 12; r++) {
      const pegIndex = Math.min(pos, r);
      const peg = pegMap[r].pegs[pegIndex];
      const bias = Math.max(0, Math.min(1, peg.leftBias + adj));
      const rnd = prng.rand();
      const goLeft = rnd < bias;
      path.push(goLeft);
      if (!goLeft) pos += 1;
    }

    const binIndex = pos;

    // If roundId provided, compare against stored round
    let match = null;
    if (roundId) {
      const result = await sql`
        SELECT * FROM "Round" WHERE id = ${roundId}
      `;
      if (result.length > 0) {
        const round = result[0];
        match = {
          commitHexMatch: commitHex === round.commitHex,
          combinedSeedMatch: combinedSeed === round.combinedSeed,
          pegMapHashMatch: pMapHash === round.pegMapHash,
          binIndexMatch: binIndex === round.binIndex,
        };
      }
    }

    return NextResponse.json({
      commitHex,
      combinedSeed,
      pegMapHash: pMapHash,
      binIndex,
      path,
      match,
    });
  } catch (error) {
    console.error('[v0] Verify endpoint error:', error);
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 });
  }
}
