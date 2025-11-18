'use client';

import React, { useState, useEffect } from 'react';
import PlinkoBoard from '@/components/plinko-board';
import GameControls from '@/components/game-controls';
import PaytableDisplay from '@/components/paytable-display';

export default function Home() {
  const [roundId, setRoundId] = useState<string | null>(null);
  const [commitHex, setCommitHex] = useState<string | null>(null);
  const [path, setPath] = useState<boolean[]>([]);
  const [pegMap, setPegMap] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [gameActive, setGameActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [dbInitialized, setDbInitialized] = useState(false);

  const handleCreateRound = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/rounds/commit', { method: 'POST' });
      const data = await res.json();
      setRoundId(data.roundId);
      setCommitHex(data.commitHex);
    } catch (error) {
      console.error('Error creating round:', error);
      alert('Failed to create round');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDrop = async (dropColumn: number, bet: number, clientSeed: string) => {
    if (!roundId) {
      alert('No round created');
      return;
    }

    try {
      setIsLoading(true);
      setGameActive(true);

      // Start round
      const startRes = await fetch(`/api/rounds/${roundId}/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientSeed, dropColumn, betCents: bet }),
      });

      const startData = await startRes.json();

      // Use the deterministic path returned by the start API when available
      if (startData && Array.isArray(startData.path)) {
        setPath(startData.path);
      } else {
        const simulatedPath = Array.from({ length: 12 }, (_, i) => Math.random() < 0.5);
        setPath(simulatedPath);
      }

      // Mock peg map
      setPegMap(Array.from({ length: 12 }, (_, r) =>
        ({
          row: r,
          pegs: Array.from({ length: r + 1 }, (_, p) => ({
            index: p,
            leftBias: 0.5 + Math.sin(r + p) * 0.1,
          })),
        })
      ));
    } catch (error) {
      console.error('Error dropping ball:', error);
      alert('Failed to drop ball');
      setGameActive(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnimationComplete = async () => {
    setGameActive(false);
    // Reveal round
    if (roundId) {
      try {
        const revealRes = await fetch(`/api/rounds/${roundId}/reveal`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });

        const revealData = await revealRes.json();
        if (!revealRes.ok || revealData.error) {
          console.error('Reveal failed:', revealData);
          alert('Reveal failed: ' + (revealData?.error || 'unknown'));
          return;
        }

        console.log('Reveal result:', revealData);
        // Show result to user
        alert(`Round revealed — bin: ${revealData.binIndex}, serverSeed: ${String(revealData.serverSeed).slice(0,8)}...`);
      } catch (error) {
        console.error('Error revealing round:', error);
      }
    }
  };

  useEffect(() => {
    const initializeDb = async () => {
      try {
        const res = await fetch('/api/init-db', { method: 'POST' });
        if (res.ok) {
          setDbInitialized(true);
          handleCreateRound();
        } else {
          console.error('Failed to initialize database');
        }
      } catch (error) {
        console.error('Error initializing database:', error);
      }
    };
    
    initializeDb();
  }, []);

  return (
    <main className="min-h-screen bg-linear-to-br from-slate-900 via-purple-900 to-slate-900 px-4 py-6 sm:px-6">
      <div className="max-w-4xl mx-auto px-2 sm:px-0">
        <h1 className="text-4xl sm:text-5xl font-mono font-black text-center mb-2 text-transparent bg-clip-text bg-linear-to-r from-cyan-400 to-magenta-400">
          PLINKO LAB
        </h1>
        <p className="text-center text-cyan-300 font-mono text-sm sm:text-base mb-8">Provably Fair • Deterministic • On-Chain Verifiable</p>

        {roundId && (
          <div className="text-center mb-6 font-mono text-xs text-slate-400">
            Round ID: {roundId.slice(0, 8)}...
          </div>
        )}

        <div className="space-y-6 sm:space-y-8">
          <div className="bg-slate-800 rounded-lg border-2 border-cyan-400 p-4 sm:p-6">
            <PlinkoBoard
              path={path}
              pegMap={pegMap}
              onAnimationComplete={handleAnimationComplete}
              isMuted={isMuted}
            />
          </div>

          <GameControls
            onDrop={handleDrop}
            isLoading={isLoading}
            disabled={gameActive}
          />

          <PaytableDisplay />

          <div className="flex justify-center gap-4">
            <button
              onClick={() => setIsMuted(!isMuted)}
              className="px-4 py-2 bg-slate-700 border-2 border-cyan-400 text-cyan-300 font-mono rounded hover:bg-slate-600"
            >
              {isMuted ? 'UNMUTE' : 'MUTE'}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
