import crypto from 'crypto';

// SHA256 hash function
export function sha256(input: string): string {
  return crypto.createHash('sha256').update(input).digest('hex');
}

// Xorshift32 PRNG implementation
export class Xorshift32 {
  private state: number;

  constructor(seed: number) {
    this.state = seed;
    if (this.state === 0) this.state = 1;
  }

  // Returns a random number in [0, 1)
  rand(): number {
    let x = this.state;
    x ^= x << 13;
    x ^= x >> 17;
    x ^= x << 5;
    this.state = x;
    return (x >>> 0) / 0x100000000;
  }
}

// Extract 4-byte seed from combinedSeed (big-endian)
export function seedFromHash(hash: string): number {
  const hex = hash.substring(0, 8);
  return parseInt(hex, 16);
}

// Compute commit hash for fairness protocol
export function computeCommit(serverSeed: string, nonce: string): string {
  return sha256(`${serverSeed}:${nonce}`);
}

// Compute combined seed for RNG
export function computeCombinedSeed(
  serverSeed: string,
  clientSeed: string,
  nonce: string
): string {
  return sha256(`${serverSeed}:${clientSeed}:${nonce}`);
}

// Validate that commitHex matches serverSeed and nonce
export function validateCommit(
  commitHex: string,
  serverSeed: string,
  nonce: string
): boolean {
  return commitHex === computeCommit(serverSeed, nonce);
}
