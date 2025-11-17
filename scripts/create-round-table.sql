-- Create the Round table for Plinko game
CREATE TABLE IF NOT EXISTS "Round" (
  id TEXT PRIMARY KEY,
  nonce TEXT NOT NULL,
  "commitHex" TEXT NOT NULL,
  "serverSeed" TEXT NOT NULL,
  "clientSeed" TEXT,
  "combinedSeed" TEXT,
  "pegMapHash" TEXT,
  "dropColumn" INTEGER,
  "binIndex" INTEGER,
  "payoutMultiplier" DECIMAL(10, 2),
  "betCents" INTEGER,
  "pathJson" TEXT,
  status TEXT NOT NULL DEFAULT 'CREATED',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index on status for efficient lookups
CREATE INDEX IF NOT EXISTS idx_round_status ON "Round"(status);
CREATE INDEX IF NOT EXISTS idx_round_created_at ON "Round"(created_at);
