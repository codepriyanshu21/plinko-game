'use client';

import React, { useRef, useEffect, useState } from 'react';

interface BallState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  binIndex: number;
  isLanding: boolean;
}

interface PlinkoProps {
  path: boolean[];
  pegMap: any[];
  onAnimationComplete: () => void;
  isMuted: boolean;
}

export default function PlinkoBoard({
  path,
  pegMap,
  onAnimationComplete,
  isMuted,
}: PlinkoProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ball, setBall] = useState<BallState | null>(null);
  const animationRef = useRef<number | null>(null);
  const completionRef = useRef<boolean>(false);
  const completionTimeoutRef = useRef<number | null>(null);

  const ROWS = 12;
  const COLS = 13;
  const BALL_RADIUS = 6;
  const PEG_RADIUS = 4;
  const GRAVITY = 0.15;

  // Canvas dimensions (measure container to be responsive)
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [canvasWidth, setCanvasWidth] = useState<number>(800);
  const canvasHeight = 600;

  useEffect(() => {
    if (!containerRef.current) {
      setCanvasWidth(800);
      return;
    }

    const computeWidth = (w: number) => Math.min(800, Math.max(320, w - 32));

    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = entry.contentRect.width;
        setCanvasWidth(computeWidth(w));
      }
    });

    ro.observe(containerRef.current);
    // Initialize
    setCanvasWidth(computeWidth(containerRef.current.clientWidth));

    return () => ro.disconnect();
  }, []);

  const pegSpacingX = canvasWidth / (COLS + 1);
  const pegSpacingY = canvasHeight / (ROWS + 2);
  const boardLeft = pegSpacingX;
  const boardTop = pegSpacingY;

  // Get peg position
  const getPegPosition = (row: number, col: number) => {
    const x = boardLeft + (col + 0.5) * pegSpacingX;
    const y = boardTop + (row + 0.5) * pegSpacingY;
    return { x, y };
  };

  // Draw board
  function drawBoard(ctx: CanvasRenderingContext2D, ballState: BallState | null) {
    // Clear canvas
    ctx.fillStyle = '#0f1729';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // Draw pegs
    ctx.fillStyle = '#00d9ff';
    for (let r = 0; r < ROWS; r++) {
      for (let p = 0; p <= r; p++) {
        const { x, y } = getPegPosition(r, p);
        ctx.beginPath();
        ctx.arc(x, y, PEG_RADIUS, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Draw bins
    ctx.strokeStyle = '#00ff00';
    ctx.lineWidth = 2;
    ctx.fillStyle = 'transparent';
    for (let i = 0; i < COLS; i++) {
      const x = boardLeft + i * pegSpacingX;
      const y = boardTop + (ROWS + 1) * pegSpacingY;
      const w = pegSpacingX * 0.8;
      const h = pegSpacingY * 0.6;
      ctx.fillRect(x - w / 2, y, w, h);
      ctx.strokeRect(x - w / 2, y, w, h);
    }

    // Draw bin numbers
    ctx.fillStyle = '#00ff00';
    ctx.font = '12px monospace';
    ctx.textAlign = 'center';
    for (let i = 0; i < COLS; i++) {
      const x = boardLeft + i * pegSpacingX;
      const y = boardTop + (ROWS + 1.8) * pegSpacingY;
      ctx.fillText(i.toString(), x, y);
    }

    // Draw ball
    if (ballState) {
      ctx.fillStyle = '#ff00ff';
      ctx.beginPath();
      ctx.arc(ballState.x, ballState.y, BALL_RADIUS, 0, Math.PI * 2);
      ctx.fill();

      // Draw ball glow
      ctx.strokeStyle = '#ff00ff';
      ctx.lineWidth = 1;
      ctx.globalAlpha = 0.3;
      ctx.beginPath();
      ctx.arc(ballState.x, ballState.y, BALL_RADIUS + 4, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
  }

  // Simulate ball drop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Initialize ball at top center
    let currentBall: BallState = {
      x: boardLeft + (COLS / 2) * pegSpacingX,
      y: boardTop,
      vx: 0,
      vy: 0,
      radius: BALL_RADIUS,
      binIndex: -1,
      isLanding: false,
    };

    let pathIndex = 0;

    const animate = () => {
      // Physics simulation
      if (pathIndex < path.length) {
        currentBall.vy += GRAVITY;

        // Check collision with pegs
        const row = Math.floor((currentBall.y - boardTop) / pegSpacingY);
        if (row >= 0 && row < ROWS && row === Math.round((currentBall.y - boardTop) / pegSpacingY - 0.5)) {
          const goLeft = path[pathIndex];
          pathIndex++;

          const pegX = boardLeft + (goLeft ? (COLS / 2 - 0.5) : (COLS / 2 + 0.5)) * pegSpacingX;
          const targetX = boardLeft + (goLeft ? pegX - pegSpacingX * 0.3 : pegX + pegSpacingX * 0.3);

          currentBall.vx = (targetX - currentBall.x) * 0.05;
        }
      }

      currentBall.x += currentBall.vx;
      currentBall.y += currentBall.vy;

      // Check if reached bin
      const binY = boardTop + (ROWS + 1) * pegSpacingY;
      if (currentBall.y >= binY && !currentBall.isLanding) {
        currentBall.isLanding = true;
        const binIndex = Math.max(0, Math.min(COLS - 1, Math.round((currentBall.x - boardLeft) / pegSpacingX)));
        currentBall.binIndex = binIndex;
        currentBall.vy = 0;
      }

      // Stop animation after landing
      if (currentBall.isLanding && pathIndex >= path.length) {
        drawBoard(ctx, currentBall);
        if (!completionRef.current) {
          completionRef.current = true;
          // schedule completion callback and store timeout so it can be cleared on cleanup
          const t = window.setTimeout(() => {
            try {
              onAnimationComplete();
            } finally {
              completionRef.current = false;
              completionTimeoutRef.current = null;
            }
          }, 500);
          completionTimeoutRef.current = t;
        }
        return;
      }

      setBall({ ...currentBall });
      drawBoard(ctx, currentBall);
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (completionTimeoutRef.current) {
        clearTimeout(completionTimeoutRef.current);
        completionTimeoutRef.current = null;
      }
      completionRef.current = false;
    };
  }, [path, pegMap, onAnimationComplete, canvasWidth]);

  return (
    <div ref={containerRef} className="flex justify-center items-center w-full">
      <canvas
        ref={canvasRef}
        width={canvasWidth}
        height={canvasHeight}
        className="border-2 border-cyan-400 rounded-lg shadow-lg"
      />
    </div>
  );
}
