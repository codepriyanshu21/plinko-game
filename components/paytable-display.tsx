'use client';

import React from 'react';
import { PAYTABLE } from '@/lib/paytable';

export default function PaytableDisplay() {
  return (
    <div className="w-full max-w-2xl mx-auto p-4 sm:p-6 bg-slate-800 rounded-lg border-2 border-green-400">
      <h2 className="text-lg sm:text-xl font-mono font-bold text-green-400 mb-4">PAYOUT TABLE</h2>
      <div className="grid grid-cols-4 md:grid-cols-13 gap-2">
        {Object.entries(PAYTABLE).map(([bin, multiplier]) => (
          <div key={bin} className="text-center px-1">
            <div className="text-xs sm:text-sm font-mono text-cyan-300">Bin {bin}</div>
            <div className="text-base sm:text-lg font-bold text-yellow-400">{multiplier.toFixed(1)}x</div>
          </div>
        ))}
      </div>
    </div>
  );
}
