# Plinko Lab — Provably Fair Plinko Game


A lightweight, deterministic Plinko game with provable fairness using a commit-reveal protocol. Built with Next.js, TypeScript, and Neon Postgres backend.

## 🎮 Live Demo

🚀 **[Play Plinko Lab](https://plinko-game-zzjg.vercel.app)** 

## ✨ Features

- **Provably Fair**: Cryptographic commit-reveal protocol ensures game integrity
- **Deterministic Gameplay**: SHA256 + Xorshift32 PRNG for reproducible results
- **Real-time Animation**: Smooth HTML5 Canvas ball physics simulation
- **Responsive Design**: Mobile-first UI with Tailwind CSS
- **Verification Tool**: Independent verification of any round's fairness
- **Database Backend**: Neon Postgres with Prisma schema
- **Type-Safe**: Full TypeScript implementation
- **Tested**: Comprehensive unit tests with Vitest

## 🏗️ Architecture

### System Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   API Routes    │    │   Database      │
│   (Next.js)     │◄──►│   (Next.js)     │◄──►│   (Neon PG)     │
│                 │    │                 │    │                 │
│ • Game UI       │    │ • /api/rounds   │    │ • Round Table   │
│ • Canvas Board  │    │ • /api/verify   │    │ • Fairness Data │
│ • Controls      │    │ • /api/init-db  │    │ • Game State    │
│ • Paytable      │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Fairness Protocol

1. **Commit Phase**: Server generates `serverSeed` + `nonce`, computes `commitHex = SHA256(serverSeed:nonce)`
2. **Reveal Phase**: After game completion, server reveals `serverSeed` for verification
3. **Combined Seed**: `SHA256(serverSeed:clientSeed:nonce)` determines deterministic game outcome
4. **Verification**: Anyone can verify fairness using public seeds and parameters

### Game Flow

```
Client Request ──► Commit ──► Start ──► Reveal ──► Verify
     │               │         │         │         │
     ▼               ▼         ▼         ▼         ▼
  Create Round    Store     Compute    Reveal    Check
  (serverSeed)   Commit     Outcome   serverSeed Integrity
```

## 🛠️ Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript
- **Styling**: Tailwind CSS, Radix UI components
- **Backend**: Next.js API Routes, Neon Postgres
- **Database**: PostgreSQL with Prisma ORM
- **Crypto**: Node.js crypto module (SHA256)
- **PRNG**: Custom Xorshift32 implementation
- **Testing**: Vitest, React Testing Library
- **Deployment**: Vercel (recommended)

## 🚀 Installation & Setup

### Prerequisites

- Node.js 18+
- npm or pnpm
- Neon Postgres database (or any PostgreSQL)

### Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/plinko-lab.git
   cd plinko-lab
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   pnpm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   # Edit .env.local and add your DATABASE_URL
   ```

4. **Initialize database**
   ```bash
   npm run migrate-db
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

6. **Open in browser**
   ```
   http://localhost:3000
   ```

## 🎯 Running Locally

### Development Commands

```bash
# Start dev server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run database migration
npm run migrate-db

# Run tests
npm test

# Run linting
npm run lint
```

### Database Setup

The app uses Neon Postgres. Set up your database:

1. Create a Neon project at [neon.tech](https://neon.tech)
2. Get your connection string
3. Add to `.env.local`:
   ```
   DATABASE_URL="postgresql://user:password@host/db?sslmode=require"
   ```

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | Yes |

## 📡 API Documentation

### Endpoints

#### `POST /api/init-db`
Initialize database tables.

**Response:**
```json
{
  "success": true,
  "message": "Database initialized"
}
```

#### `POST /api/rounds/commit`
Create a new game round with commit hash.

**Response:**
```json
{
  "roundId": "abc123...",
  "commitHex": "sha256_hash...",
  "nonce": "hex_nonce"
}
```

#### `POST /api/rounds/{id}/start`
Start a round with client parameters.

**Request:**
```json
{
  "clientSeed": "user_seed",
  "dropColumn": 6,
  "betCents": 100
}
```

**Response:**
```json
{
  "roundId": "abc123...",
  "pegMapHash": "sha256_hash...",
  "binIndex": 6,
  "payoutMultiplier": 0.5,
  "path": [true, false, ...]
}
```

#### `POST /api/rounds/{id}/reveal`
Reveal server seed and complete round.

**Response:**
```json
{
  "roundId": "abc123...",
  "serverSeed": "revealed_seed...",
  "combinedSeed": "combined_hash...",
  "binIndex": 6
}
```

#### `GET /api/verify`
Verify round fairness independently.

**Query Parameters:**
- `serverSeed`: Server seed
- `clientSeed`: Client seed
- `nonce`: Nonce
- `dropColumn`: Drop column (default: 6)
- `roundId`: Optional round ID to compare

**Response:**
```json
{
  "commitHex": "sha256_hash...",
  "combinedSeed": "combined_hash...",
  "pegMapHash": "peg_hash...",
  "binIndex": 6,
  "path": [true, false, ...],
  "match": {
    "commitHexMatch": true,
    "combinedSeedMatch": true,
    "pegMapHashMatch": true,
    "binIndexMatch": true
  }
}
```

## 🔍 Verification Process

### How to Verify a Round

1. **Get Round Data**: After a game, note the `roundId`
2. **Wait for Reveal**: Server reveals `serverSeed` after game completion
3. **Use Verifier**: Visit `/verify` page or call `/api/verify` endpoint
4. **Check Results**: Verify all hashes and outcomes match

### Test Vector

For validation, use these known inputs:

- **serverSeed**: `b2a5f3f32a4d9c6ee7a8c1d33456677890abcdeffedcba0987654321ffeeddcc`
- **nonce**: `42`
- **clientSeed**: `candidate-hello`
- **dropColumn**: `6`
- **Expected binIndex**: `6`
- **Expected commitHex**: `bb9acdc67f3f18f3345236a01f0e5072596657a9005c7d8a22cff061451a6b34`

## 🧪 Testing

Run the test suite:

```bash
npm test
```

Tests cover:
- Cryptographic functions (SHA256, Xorshift32)
- Plinko engine (peg map generation, ball simulation)
- Fairness verification

## 🚀 Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Connect repo to Vercel
3. Add `DATABASE_URL` environment variable
4. Deploy

### Other Platforms

Build and deploy using standard Next.js deployment:

```bash
npm run build
npm start
```

## 🐛 Troubleshooting

### Common Issues

**ERESOLVE / Peer Dependency Errors**
```bash
npm install --legacy-peer-deps
```

**Window Reference Error (SSR)**
- Canvas code runs in `useEffect` to avoid SSR issues
- Restart dev server after changes

**Invalid Source Map Warnings**
- Usually benign, produced by third-party packages
- Can be silenced by identifying the problematic package

**TypeScript Script Execution**
- Use `npm run migrate-db` (uses `ts-node`)
- Don't run `.ts` files directly with `node`

**Database Connection**
- Ensure `DATABASE_URL` is set correctly
- Check Neon dashboard for connection issues

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

### Development Guidelines

- Use TypeScript for all new code
- Follow existing code style
- Add tests for new features
- Update documentation

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- UI components from [Radix UI](https://radix-ui.com/)
- Database hosting by [Neon](https://neon.tech)
- Styling with [Tailwind CSS](https://tailwindcss.com/)

---

**Plinko Lab** - Where probability meets provable fairness 🎲
