'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface VerifyResult {
  commitHex: string;
  combinedSeed: string;
  pegMapHash: string;
  binIndex: number;
  path: boolean[];
  match?: {
    commitHexMatch: boolean;
    combinedSeedMatch: boolean;
    pegMapHashMatch: boolean;
    binIndexMatch: boolean;
  };
}

export default function VerifyPage() {
  const [formData, setFormData] = useState({
    serverSeed: '',
    clientSeed: '',
    nonce: '',
    dropColumn: '6',
    roundId: '',
  });
  const [result, setResult] = useState<VerifyResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleVerify = async () => {
    setError(null);
    setResult(null);

    if (!formData.serverSeed || !formData.clientSeed || !formData.nonce) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        serverSeed: formData.serverSeed,
        clientSeed: formData.clientSeed,
        nonce: formData.nonce,
        dropColumn: formData.dropColumn,
        ...(formData.roundId && { roundId: formData.roundId }),
      });

      const res = await fetch(`/api/verify?${params}`, { method: 'GET' });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Verification failed');
        return;
      }

      setResult(data);
    } catch (err) {
      setError('Error during verification');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-5xl font-mono font-black text-center mb-2 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-magenta-400">
          PLINKO VERIFIER
        </h1>
        <p className="text-center text-cyan-300 font-mono text-sm mb-8">Verify round fairness and outcomes</p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Form */}
          <div className="bg-slate-800 rounded-lg border-2 border-cyan-400 p-6 space-y-4">
            <h2 className="text-xl font-mono font-bold text-cyan-400 mb-4">Round Parameters</h2>

            <div>
              <label className="block text-sm font-mono text-cyan-300 mb-2">Server Seed *</label>
              <Input
                name="serverSeed"
                value={formData.serverSeed}
                onChange={handleInputChange}
                placeholder="Hex string from server"
                className="font-mono text-xs"
              />
            </div>

            <div>
              <label className="block text-sm font-mono text-cyan-300 mb-2">Client Seed *</label>
              <Input
                name="clientSeed"
                value={formData.clientSeed}
                onChange={handleInputChange}
                placeholder="Your chosen seed"
                className="font-mono text-xs"
              />
            </div>

            <div>
              <label className="block text-sm font-mono text-cyan-300 mb-2">Nonce *</label>
              <Input
                name="nonce"
                value={formData.nonce}
                onChange={handleInputChange}
                placeholder="Hex nonce"
                className="font-mono text-xs"
              />
            </div>

            <div>
              <label className="block text-sm font-mono text-cyan-300 mb-2">Drop Column</label>
              <Input
                name="dropColumn"
                type="number"
                min="0"
                max="12"
                value={formData.dropColumn}
                onChange={handleInputChange}
                className="font-mono"
              />
            </div>

            <div>
              <label className="block text-sm font-mono text-cyan-300 mb-2">Round ID (optional)</label>
              <Input
                name="roundId"
                value={formData.roundId}
                onChange={handleInputChange}
                placeholder="To compare against stored round"
                className="font-mono text-xs"
              />
            </div>

            <Button
              onClick={handleVerify}
              disabled={isLoading}
              className="w-full bg-cyan-600 hover:bg-cyan-700 font-mono text-lg py-6"
            >
              {isLoading ? 'VERIFYING...' : 'VERIFY'}
            </Button>

            {error && <div className="p-3 bg-red-900 border-2 border-red-500 text-red-100 font-mono text-sm rounded">{error}</div>}
          </div>

          {/* Results */}
          {result && (
            <div className="bg-slate-800 rounded-lg border-2 border-green-400 p-6 space-y-4">
              <h2 className="text-xl font-mono font-bold text-green-400 mb-4">Verification Results</h2>

              <div>
                <label className="text-xs font-mono text-green-300 opacity-70">Commit Hash</label>
                <div className="text-xs font-mono text-green-400 break-all">{result.commitHex}</div>
              </div>

              <div>
                <label className="text-xs font-mono text-green-300 opacity-70">Combined Seed</label>
                <div className="text-xs font-mono text-green-400 break-all">{result.combinedSeed}</div>
              </div>

              <div>
                <label className="text-xs font-mono text-green-300 opacity-70">Peg Map Hash</label>
                <div className="text-xs font-mono text-green-400 break-all">{result.pegMapHash}</div>
              </div>

              <div>
                <label className="text-sm font-mono text-yellow-300">Final Bin Index</label>
                <div className="text-3xl font-mono font-bold text-yellow-400">{result.binIndex}</div>
              </div>

              <div>
                <label className="text-xs font-mono text-cyan-300 opacity-70">Path ({result.path.length} rows)</label>
                <div className="text-xs font-mono text-cyan-400 bg-slate-900 p-2 rounded break-all">
                  {result.path.map((l) => (l ? 'L' : 'R')).join('')}
                </div>
              </div>

              {result.match && (
                <div className="border-t border-green-400 pt-4 space-y-2">
                  <h3 className="text-sm font-mono font-bold text-green-400">Match Against Stored Round</h3>
                  <div className="text-xs font-mono space-y-1">
                    <div className={result.match.commitHexMatch ? 'text-green-400' : 'text-red-400'}>
                      {result.match.commitHexMatch ? '✓' : '✗'} Commit Hash: {result.match.commitHexMatch ? 'PASS' : 'FAIL'}
                    </div>
                    <div className={result.match.combinedSeedMatch ? 'text-green-400' : 'text-red-400'}>
                      {result.match.combinedSeedMatch ? '✓' : '✗'} Combined Seed: {result.match.combinedSeedMatch ? 'PASS' : 'FAIL'}
                    </div>
                    <div className={result.match.pegMapHashMatch ? 'text-green-400' : 'text-red-400'}>
                      {result.match.pegMapHashMatch ? '✓' : '✗'} Peg Map Hash: {result.match.pegMapHashMatch ? 'PASS' : 'FAIL'}
                    </div>
                    <div className={result.match.binIndexMatch ? 'text-green-400' : 'text-red-400'}>
                      {result.match.binIndexMatch ? '✓' : '✗'} Bin Index: {result.match.binIndexMatch ? 'PASS' : 'FAIL'}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Test Vector */}
        <div className="mt-8 bg-slate-800 rounded-lg border-2 border-yellow-400 p-6">
          <h2 className="text-lg font-mono font-bold text-yellow-400 mb-4">Test Vector (for validation)</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
            <div>
              <label className="text-yellow-300 opacity-70">serverSeed</label>
              <div className="text-yellow-400 break-all">b2a5f3f32a4d9c6ee7a8c1d33456677890abcdeffedcba0987654321ffeeddcc</div>
            </div>
            <div>
              <label className="text-yellow-300 opacity-70">nonce</label>
              <div className="text-yellow-400">42</div>
            </div>
            <div>
              <label className="text-yellow-300 opacity-70">clientSeed</label>
              <div className="text-yellow-400">candidate-hello</div>
            </div>
            <div>
              <label className="text-yellow-300 opacity-70">dropColumn</label>
              <div className="text-yellow-400">6</div>
            </div>
            <div>
              <label className="text-yellow-300 opacity-70">Expected commitHex</label>
              <div className="text-yellow-400 break-all">bb9acdc67f3f18f3345236a01f0e5072596657a9005c7d8a22cff061451a6b34</div>
            </div>
            <div>
              <label className="text-yellow-300 opacity-70">Expected binIndex</label>
              <div className="text-yellow-400">6</div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
