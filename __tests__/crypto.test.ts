/// <reference types="vitest" />
import { sha256, Xorshift32, seedFromHash, computeCommit, computeCombinedSeed, validateCommit } from '@/lib/crypto';
import { describe, it, expect } from 'vitest';


describe('Crypto Functions', () => {
  describe('sha256', () => {
    it('should hash correctly', () => {
      const result = sha256('test');
      expect(result).toBe('9f86d081884c7d6d9fdd72c97339cc0dfe9db41d8de0c07ceef75fac8f29fe10');
    });

    it('should match test vector', () => {
      const serverSeed = 'b2a5f3f32a4d9c6ee7a8c1d33456677890abcdeffedcba0987654321ffeeddcc';
      const nonce = '42';
      const result = sha256(`${serverSeed}:${nonce}`);
      expect(result).toBe('bb9acdc67f3f18f3345236a01f0e5072596657a9005c7d8a22cff061451a6b34');
    });
  });

  describe('Xorshift32 PRNG', () => {
    it('should generate deterministic sequence', () => {
      const seed = 0x12345678;
      const prng = new Xorshift32(seed);
      const values = [];
      for (let i = 0; i < 5; i++) {
        values.push(prng.rand());
      }

      // Verify sequence is deterministic
      const prng2 = new Xorshift32(seed);
      for (let i = 0; i < 5; i++) {
        expect(Math.abs(prng2.rand() - values[i]) < 1e-10).toBe(true);
      }
    });

    it('should match test vector values', () => {
      const seed = 0xe1dddf77; // first 4 bytes of test combinedSeed
      const prng = new Xorshift32(seed);
      const expected = [0.1106166649, 0.7625129214, 0.0439292176, 0.4578678815, 0.3438999297];
      
      for (let i = 0; i < 5; i++) {
        const val = prng.rand();
        expect(Math.abs(val - expected[i]) < 1e-9).toBe(true);
      }
    });
  });

  describe('seedFromHash', () => {
    it('should extract first 4 bytes', () => {
      const hash = 'e1dddf77de27d395ea2be2ed49aa2a59bd6bf12ee8d350c16c008abd406c07e0';
      const seed = seedFromHash(hash);
      expect(seed).toBe(0xe1dddf77);
    });
  });

  describe('computeCommit', () => {
    it('should match test vector', () => {
      const serverSeed = 'b2a5f3f32a4d9c6ee7a8c1d33456677890abcdeffedcba0987654321ffeeddcc';
      const nonce = '42';
      const result = computeCommit(serverSeed, nonce);
      expect(result).toBe('bb9acdc67f3f18f3345236a01f0e5072596657a9005c7d8a22cff061451a6b34');
    });
  });

  describe('computeCombinedSeed', () => {
    it('should match test vector', () => {
      const serverSeed = 'b2a5f3f32a4d9c6ee7a8c1d33456677890abcdeffedcba0987654321ffeeddcc';
      const clientSeed = 'candidate-hello';
      const nonce = '42';
      const result = computeCombinedSeed(serverSeed, clientSeed, nonce);
      expect(result).toBe('e1dddf77de27d395ea2be2ed49aa2a59bd6bf12ee8d350c16c008abd406c07e0');
    });
  });

  describe('validateCommit', () => {
    it('should validate correct commit', () => {
      const serverSeed = 'test-seed';
      const nonce = 'test-nonce';
      const commitHex = computeCommit(serverSeed, nonce);
      expect(validateCommit(commitHex, serverSeed, nonce)).toBe(true);
    });

    it('should reject invalid commit', () => {
      const commitHex = 'bad-hash';
      expect(validateCommit(commitHex, 'seed', 'nonce')).toBe(false);
    });
  });
});
