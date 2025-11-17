import { Xorshift32, seedFromHash, sha256 } from './crypto';

export interface PegMap {
  row: number;
  pegs: Array<{ index: number; leftBias: number }>;
}

export interface GameOutcome {
  binIndex: number;
  path: boolean[]; // true = left, false = right
  pegMapHash: string;
  pegMap: PegMap[];
}

const ROWS = 12;
const BINS = 13;

// Generate deterministic peg map from PRNG
export function generatePegMap(prng: Xorshift32): PegMap[] {
  const pegMap: PegMap[] = [];

  for (let r = 0; r < ROWS; r++) {
    const pegs: Array<{ index: number; leftBias: number }> = [];
    for (let p = 0; p <= r; p++) {
      const rand = prng.rand();
      const leftBias = +(0.5 + (rand - 0.5) * 0.2).toFixed(6);
      pegs.push({ index: p, leftBias });
    }
    pegMap.push({ row: r, pegs });
  }

  return pegMap;
}

// Compute stable hash of peg map
export function pegMapHash(pegMap: PegMap[]): string {
  return sha256(JSON.stringify(pegMap));
}

// Simulate ball drop through pegs
export function simulateDrop(
  combinedSeed: string,
  dropColumn: number,
  pegMap: PegMap[]
): GameOutcome {
  const seed = seedFromHash(combinedSeed);
  const prng = new Xorshift32(seed);

  // Skip peg generation in simulation (already generated)
  for (let r = 0; r < ROWS; r++) {
    for (let p = 0; p <= r; p++) {
      prng.rand();
    }
  }

  // Simulate path
  let pos = 0;
  const path: boolean[] = [];
  const adj = (dropColumn - Math.floor(ROWS / 2)) * 0.01;

  for (let r = 0; r < ROWS; r++) {
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

  return {
    binIndex: pos,
    path,
    pegMapHash: pegMapHash(pegMap),
    pegMap,
  };
}

// Full drop computation from seeds
export function computeDrop(
  serverSeed: string,
  clientSeed: string,
  nonce: string,
  dropColumn: number
): GameOutcome {
  const { computeCombinedSeed } = require('./crypto');
  const combinedSeed = computeCombinedSeed(serverSeed, clientSeed, nonce);
  const seed = seedFromHash(combinedSeed);
  const prng = new Xorshift32(seed);

  // Generate peg map
  const pegMap = generatePegMap(prng);

  // Simulate drop
  return simulateDrop(combinedSeed, dropColumn, pegMap);
}
