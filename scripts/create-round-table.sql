DROP TABLE IF EXISTS "Round";

CREATE TABLE "Round" (
  id TEXT PRIMARY KEY,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status TEXT DEFAULT 'CREATED',

  -- Fairness
  nonce TEXT NOT NULL,
  "commitHex" TEXT NOT NULL,
  "serverSeed" TEXT,          -- nullable
  "clientSeed" TEXT NOT NULL,
  "combinedSeed" TEXT NOT NULL,
  "pegMapHash" TEXT NOT NULL,

  -- Game State
  rows INTEGER DEFAULT 12,    -- added missing field
  "dropColumn" INTEGER NOT NULL,
  "binIndex" INTEGER NOT NULL,
  "payoutMultiplier" DOUBLE PRECISION NOT NULL,
  "betCents" INTEGER NOT NULL,

  -- Path JSON (correct type)
  "pathJson" JSONB NOT NULL,

  "revealedAt" TIMESTAMP
);

-- Correct index names
CREATE INDEX idx_round_createdAt ON "Round"("createdAt");
CREATE INDEX idx_round_status ON "Round"(status);
