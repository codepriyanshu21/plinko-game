/// <reference types="vitest" />
import { generatePegMap, pegMapHash, simulateDrop, computeDrop } from '@/lib/plinko-engine';
import { Xorshift32, seedFromHash } from '@/lib/crypto';
import { describe, it, expect } from 'vitest';


describe('Plinko Engine', () => {
  describe('generatePegMap', () => {
    it('should generate 12 rows with correct peg counts', () => {
      const seed = 0x12345678;
      const prng = new Xorshift32(seed);
      const pegMap = generatePegMap(prng);

      expect(pegMap.length).toBe(12);
      for (let r = 0; r < 12; r++) {
        expect(pegMap[r].pegs.length).toBe(r + 1);
      }
    });

    it('should generate leftBias values in [0.4, 0.6]', () => {
      const seed = 0x12345678;
      const prng = new Xorshift32(seed);
      const pegMap = generatePegMap(prng);

      for (let r = 0; r < 12; r++) {
        for (const peg of pegMap[r].pegs) {
          expect(peg.leftBias).toBeGreaterThanOrEqual(0.4);
          expect(peg.leftBias).toBeLessThanOrEqual(0.6);
        }
      }
    });

    it('should be deterministic for same seed', () => {
      const seed = 0x12345678;
      
      const prng1 = new Xorshift32(seed);
      const pegMap1 = generatePegMap(prng1);
      
      const prng2 = new Xorshift32(seed);
      const pegMap2 = generatePegMap(prng2);

      expect(JSON.stringify(pegMap1)).toBe(JSON.stringify(pegMap2));
    });
  });

  describe('pegMapHash', () => {
    it('should produce stable hash', () => {
      const seed = 0x12345678;
      const prng = new Xorshift32(seed);
      const pegMap = generatePegMap(prng);

      const hash1 = pegMapHash(pegMap);
      const hash2 = pegMapHash(pegMap);

      expect(hash1).toBe(hash2);
    });
  });

  describe('simulateDrop', () => {
    it('should return binIndex in [0, 12]', () => {
      const combinedSeed = 'e1dddf77de27d395ea2be2ed49aa2a59bd6bf12ee8d350c16c008abd406c07e0';
      const seed = seedFromHash(combinedSeed);
      const prng = new Xorshift32(seed);
      const pegMap = generatePegMap(prng);

      const outcome = simulateDrop(combinedSeed, 6, pegMap);
      expect(outcome.binIndex).toBeGreaterThanOrEqual(0);
      expect(outcome.binIndex).toBeLessThanOrEqual(12);
    });

    it('should return 12 path decisions', () => {
      const combinedSeed = 'e1dddf77de27d395ea2be2ed49aa2a59bd6bf12ee8d350c16c008abd406c07e0';
      const seed = seedFromHash(combinedSeed);
      const prng = new Xorshift32(seed);
      const pegMap = generatePegMap(prng);

      const outcome = simulateDrop(combinedSeed, 6, pegMap);
      expect(outcome.path.length).toBe(12);
      expect(outcome.path.every((v) => typeof v === 'boolean')).toBe(true);
    });
  });

  describe('computeDrop - test vector', () => {
    it('should match expected binIndex for test vector', () => {
      const serverSeed = 'b2a5f3f32a4d9c6ee7a8c1d33456677890abcdeffedcba0987654321ffeeddcc';
      const clientSeed = 'candidate-hello';
      const nonce = '42';
      const dropColumn = 6;

      const outcome = computeDrop(serverSeed, clientSeed, nonce, dropColumn);
      expect(outcome.binIndex).toBe(6);
    });
  });
});
