'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface GameControlsProps {
  onDrop: (dropColumn: number, bet: number, clientSeed: string) => void;
  isLoading: boolean;
  disabled: boolean;
}

export default function GameControls({
  onDrop,
  isLoading,
  disabled,
}: GameControlsProps) {
  const [dropColumn, setDropColumn] = useState(6);
  const [betAmount, setBetAmount] = useState(100);
  const [clientSeed, setClientSeed] = useState('');

  const handleDrop = () => {
    if (!clientSeed.trim()) {
      alert('Please enter a client seed');
      return;
    }
    onDrop(dropColumn, betAmount, clientSeed);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft' && dropColumn > 0) {
      setDropColumn(dropColumn - 1);
    } else if (e.key === 'ArrowRight' && dropColumn < 12) {
      setDropColumn(dropColumn + 1);
    } else if (e.code === 'Space') {
      e.preventDefault();
      handleDrop();
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-4 sm:p-6 bg-slate-800 rounded-lg border-2 border-cyan-400 space-y-4">
      <div>
        <label className="block text-sm font-mono text-cyan-300 mb-2">Drop Column (0-12)</label>
        <div className="flex gap-2 items-center">
          <input
            type="range"
            min="0"
            max="12"
            value={dropColumn}
            onChange={(e) => setDropColumn(parseInt(e.target.value))}
            onKeyDown={handleKeyDown}
            className="flex-1"
            disabled={disabled}
          />
          <span className="text-2xl sm:text-3xl font-mono font-bold text-magenta-400 w-12 text-center">{dropColumn}</span>
        </div>
      </div>

      <div>
        <label className="block text-sm font-mono text-cyan-300 mb-2">Bet Amount (cents)</label>
        <Input
          type="number"
          value={betAmount}
          onChange={(e) => setBetAmount(parseInt(e.target.value) || 100)}
          disabled={disabled}
          className="font-mono"
        />
      </div>

      <div>
        <label className="block text-sm font-mono text-cyan-300 mb-2">Client Seed</label>
        <Input
          type="text"
          value={clientSeed}
          onChange={(e) => setClientSeed(e.target.value)}
          placeholder="Enter a random string"
          disabled={disabled}
          className="font-mono"
        />
      </div>

      <Button
        onClick={handleDrop}
        disabled={disabled || isLoading}
        className="w-full bg-magenta-600 hover:bg-magenta-700 font-mono text-white sm:text-lg py-4 sm:py-6"
      >
        {isLoading ? 'DROPPING...' : 'DROP BALL'}
      </Button>
    </div>
  );
}
