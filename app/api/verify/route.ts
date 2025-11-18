import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import { computeCommit, computeCombinedSeed } from '@/lib/crypto';
import { computeDrop } from '@/lib/plinko-engine';

const sql = neon(process.env.DATABASE_URL!);

export async function GET(request: NextRequest) {
	try {
		const searchParams = request.nextUrl.searchParams;
		const serverSeed = searchParams.get('serverSeed');
		const clientSeed = searchParams.get('clientSeed');
		const nonce = searchParams.get('nonce');
		const dropColumn = searchParams.get('dropColumn') || '6';
		const roundId = searchParams.get('roundId');

		if (!serverSeed || !clientSeed || !nonce) {
			return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
		}

		const dropCol = parseInt(dropColumn, 10);

		const commitHex = computeCommit(serverSeed, nonce);
		const combinedSeed = computeCombinedSeed(serverSeed, clientSeed, nonce);

		const outcome = computeDrop(serverSeed, clientSeed, nonce, dropCol);

		let match = null;
		if (roundId) {
			try {
				const result = await sql`
					SELECT * FROM "Round" WHERE id = ${roundId}
				`;
				if (result.length > 0) {
					const round = result[0];
					match = {
						commitHexMatch: commitHex === round.commitHex,
						combinedSeedMatch: String(combinedSeed) === String(round.combinedSeed),
						pegMapHashMatch: outcome.pegMapHash === String(round.pegMapHash),
						binIndexMatch: outcome.binIndex === Number(round.binIndex),
					};
					if (process.env.NODE_ENV !== 'production') {
						// include stored values for convenience
						(match as any).stored = {
							commitHex: round.commitHex,
							combinedSeed: round.combinedSeed,
							pegMapHash: round.pegMapHash,
							binIndex: round.binIndex,
							pathJson: round.pathJson,
						};
					}
				}
			} catch (err) {
				console.error('[v0] Verify endpoint DB error:', err);
				return NextResponse.json({ error: 'DB error during verification' }, { status: 500 });
			}
		}

		return NextResponse.json({
			commitHex,
			combinedSeed,
			pegMapHash: outcome.pegMapHash,
			binIndex: outcome.binIndex,
			path: outcome.path,
			match,
		});
	} catch (error) {
		console.error('[v0] Verify endpoint error:', error);
		return NextResponse.json({ error: 'Verification failed' }, { status: 500 });
	}
}
