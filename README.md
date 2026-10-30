# 🌌 GAMEVERSE — Ultra-Premium Web Gaming Platform & In-Browser Launcher

[![Next.js](https://img.shields.io/badge/Next.js-16.4.3-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.3.0-blue?style=for-the-badge&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.x-38bdf8?style=for-the-badge&logo=tailwindcss)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-Database%20%26%20Auth-3ecf8e?style=for-the-badge&logo=supabase)](https://supabase.com/)
[![Three.js](https://img.shields.io/badge/Three.js-R3F%20%26%20Drei-black?style=for-the-badge&logo=three.js)](https://threejs.org/)
[![Playwright](https://img.shields.io/badge/Playwright-E2E%20Tested-green?style=for-the-badge&logo=playwright)](https://playwright.dev/)

---

## 🎮 Overview

**GAMEVERSE** is an ultra-premium, futuristic browser-based gaming launcher and multiplayer portal built to deliver the cinematic immersion of modern console and PC launchers (Steam, PlayStation 5, Xbox) combined with the zero-install web accessibility of Poki and CrazyGames.

No software installers, external gaming clients, or downloads are required. All games run directly inside modern web browsers with hardware-accelerated 60 FPS HTML5 Canvas loops, procedural Web Audio synthesis, real-time multiplayer lobbies, and an authentic virtual chip economy.

> **Legal Disclaimer**: *GAMEVERSE is strictly a non-monetary virtual gaming platform for entertainment, simulation, and skill training. Virtual chips have zero real-world cash value, cannot be purchased, redeemed, transferred for money, or cashed out.*

---

## ✨ Core Features

### 1. 🚀 Futuristic Gaming Launcher Interface
- **Aesthetic**: Deep space dark palette (`#000000`), dark navy surfaces, electric purple and neon cyan accents, soft glowing borders, and glassmorphism.
- **Interactive 3D Graphics**: Three.js / React Three Fiber / Drei interactive quantum dice and floating geometric mesh objects.
- **Floating Glassmorphic Navbar**: Real-time virtual chip balance display (`🪙 100,000`), friends online presence indicator, notifications drawer, quick search dialog, and player profile command center.

### 2. 🛡️ Authentication & User Command Center
- **Supabase Integration**: SSR session handling, email/password signup with strength validation, Google OAuth, magic link verification, and password reset flows.
- **Player Profiles**: Automated trigger generating a unique Player ID (`GV-XXXXXX`), player rank/level progression, total games played, and customizable avatars.
- **Gamer Command Center (`/dashboard`)**: Dedicated player dashboard displaying active session metrics, win/loss stats, favorite games, and recent activity.

### 3. 🕹️ Game Discovery Portal & In-Browser Launcher
- **Discovery Portal (`/games`)**:
  - Filterable by categories: *All Games*, *Arcade*, *Action & Shooter*, *Racing & Speed*, and *Board & Classic*.
  - Real-time instant search matching titles, descriptions, and tags.
  - Featured Originals carousel with play counts, player ratings, and instant launch buttons.
  - "Continue Playing" and favorite game pinning.
- **Game Launcher (`/play/[slug]`)**:
  - Cinematic HUD with dynamic loading calibration screen.
  - 60 FPS hardware-accelerated HTML5 Canvas runtime.
  - Fullscreen API support, procedural sound synthesizer mute toggle, restart (`KeyR`), and pause (`KeyP`).
  - Mobile touch controls (responsive virtual D-Pad and action buttons).
  - Physical Anti-Cheat Verification: Rate-limit heuristic checking maximum theoretical scores per second before committing to the database.

### 4. 🎴 Playable Game Catalog
- **Neon Snake (`neon-snake`)**: 24x24 cyber-grid retro arcade snake with quantum pellets, speed multiplier chains, and glowing particle bursts.
- **Space Defender (`space-defender`)**: 2D top-down arcade space shooter featuring procedural starfields, wave-based alien drone formations, shields, and plasma explosions.
- **Neon Racer (`neon-racer`)**: 3-lane cyberpunk highway speed racer with dynamic civilian traffic, reactive obstacle avoidance, and nitro energy boosts.
- **Ludo Cyber Champion (`ludo`)**: Multiplayer turn-based classic board race.
- **Neon Tic Tac Toe (`tic-tac-toe`)**: Cyber-grid X vs O with intelligent AI challenge.
- **Teen Patti Royale (`teen-patti`)**: Flagship 3-card Indian Poker multiplayer suite.

---

## 🃏 Teen Patti Royale Gaming Suite

A full-stack, production-grade 3-card Indian Poker experience built for 2–6 players:

```
┌────────────────────────────────────────────────────────┐
│                   AI DEALER: ARIA                      │
│        [Headset Mic]  [Sound: ON]  [Motion: ON]        │
│          "Cards dealt! Place your chaal or pack."      │
└───────────────────────────┬────────────────────────────┘
                            │
            ┌───────────────┴───────────────┐
            │       MAIN POT: 🪙 50,000      │
            │     Current Stake: 1,000      │
            └───────────────┬───────────────┘
                            │
   Seat 1 (Player)   Seat 2 (AI Bot)   Seat 3 (Player)
   [ 🪙 98,000 ]     [ 🪙 85,000 ]     [ 🪙 120,000 ]
     [Cards: ♥♦♠]      [Cards: 🂠🂠🂠]      [Cards: 🂠🂠🂠]
```

### Key Capabilities:
- **Routes**:
  - `/games/teen-patti`: Game overview, features, and official hand rankings chart.
  - `/games/teen-patti/lobby`: Public tables directory (1K, 5K, 25K, 100K boot stakes) and room code joiner.
  - `/games/teen-patti/create`: Private VIP suite creator with custom boot stakes.
  - `/games/teen-patti/join/[roomCode]`: Direct room joiner by 4-character invitation codes (`TP-XXXX`).
  - `/games/teen-patti/table/[tableId]`: 6-seat live table with oval felt table layout.
- **Authentic Hand Ranking Hierarchy**:
  1. **Trail / Trio / Set**: Three cards of the same rank (`A-A-A` > `K-K-K` > `2-2-2`).
  2. **Pure Sequence / Straight Flush**: Three consecutive suited cards. Follows the authentic Indian Teen Patti hierarchy where **`A-K-Q` is highest, `A-2-3` is second highest**, followed by `K-Q-J` down to `4-3-2`.
  3. **Sequence / Normal Run**: Three consecutive cards of mixed suits (`A-K-Q` > `A-2-3` > `K-Q-J` > ... > `4-3-2`).
  4. **Color / Flush**: Three suited non-consecutive cards.
  5. **Pair**: Two cards of identical rank + 1 kicker.
  6. **High Card**: Evaluated by highest card, then second, then third.
- **Betting Rules**: Blind players bet 1x to 2x current stake; seen players (chaal) bet 2x to 4x current stake.
- **Solo Practice Mode**: Built-in AI turn simulator with `Add AI Bot` allowing instant practice without waiting for other players.
- **Virtual AI Dealer "Aria"**:
  - Custom SVG vector illustration with cyber headset and live glowing status.
  - Contextual speech announcements and Web Audio synthesized chimes.
  - Sound and motion preference toggles.
  - **Zero Card Manipulation Guarantee**: Aria is strictly presentation-only. Card values are encrypted and masked on the server until showdown via PostgreSQL Row Level Security (`auth.uid() = user_id OR revealed_at_showdown = true`).

---

## 💰 Virtual Chip Wallet & Admin Management

- **100,000 Free Starting Chips**: Idempotently awarded to every player upon registration via the atomic database function `grant_starting_chips`.
- **Virtual Chip Vault (`/wallet`)**: Live balance, legal entertainment disclaimer, and double-entry transaction ledger tracking all grants, bets, wins, and bonus credits.
- **Player Bonus Requests (`/wallet/request-chips`)**: Presets (`10K`, `25K`, `50K`, `100K`, `250K`) and custom amounts (1,000 to 1,000,000 chips) with status tracker (`/wallet/requests`).
- **Admin Chip Management (`/admin/chips`)**: Search players by username, Player ID, or email, and execute atomic chip grants with 2-step confirmation and mandatory audit logging.
- **Admin Review Queue (`/admin/chip-requests`)**: Real-time review queue with single-credit guaranteed approval or rejection.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|:---|:---|
| **Frontend Framework** | **Next.js 16.4.3** (App Router, Partial Prerendering, Server Actions) |
| **Core Libraries** | **React 19.3.0**, **TypeScript 5.x**, **Tailwind CSS 4.x** |
| **Animation & 3D** | **Framer Motion**, **Three.js**, **@react-three/fiber**, **@react-three/drei** |
| **Icons & Audio** | **Lucide React**, **Web Audio API** (Procedural Synthesizer) |
| **Database & Auth** | **Supabase** (PostgreSQL, Row Level Security, Auth SSR, Database RPCs) |
| **Testing & Quality** | **Node.js Test Runner (`tsx --test`)**, **Playwright E2E Test Suite** |

---

## 📂 Project Structure

```
├── .github/                     # GitHub workflows and actions
├── public/                      # Static assets, textures, and icons
├── src/
│   ├── app/
│   │   ├── admin/               # Admin chip grants & request review queue
│   │   ├── api/                 # Secure API routes (wallet, admin, anti-cheat)
│   │   ├── auth/                # Login, signup, reset password, callback
│   │   ├── dashboard/           # Gamer Command Center & profile view
│   │   ├── games/               # Discovery portal & Teen Patti pages
│   │   │   └── teen-patti/      # Landing, lobby, create, join, table routes
│   │   ├── play/[slug]/         # 60 FPS HTML5 Canvas game launcher
│   │   ├── wallet/              # Virtual chip vault, request form, status
│   │   ├── layout.tsx           # Root layout with Supabase auth provider
│   │   └── page.tsx             # Futuristic gaming homepage
│   ├── components/
│   │   ├── teen-patti/          # CardView, DealerAvatar (Aria)
│   │   ├── Navbar.tsx           # Floating glassmorphic navigation with chip pill
│   │   └── ...                  # UI buttons, modals, badges
│   ├── lib/
│   │   ├── auth/                # Supabase authentication context and helpers
│   │   ├── games/               # Canvas game engines, registry, audio synthesizer
│   │   ├── supabase/            # Supabase client, server, and middleware
│   │   ├── teen-patti/          # Rules engine, deck generator, table manager
│   │   └── wallet/              # Wallet service, ledger management, transactions
│   └── types/                   # TypeScript schemas and database contracts
├── supabase/
│   └── migrations/              # SQL schemas, RLS policies, atomic RPC functions
└── tests/
    ├── e2e/                     # Playwright end-to-end browser test suites
    ├── security/                # Security audit and RLS enforcement tests
    └── unit/                    # Hand rankings, physics validation, wallet tests
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: `v18.18.0` or higher (Node 20+ recommended)
- **Package Manager**: `npm` (comes with Node.js)
- **Supabase Project** (Optional for local development; includes full offline demo fallback)

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/jaymodi993/gameverse.git
   cd gameverse
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
   Fill in your Supabase project credentials (or leave defaults for local offline mode):
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```

4. **Run the Development Server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Testing & Verification

GAMEVERSE includes automated test suites covering unit logic, database constraints, security audits, and browser end-to-end interactions.

```bash
# Run unit & anti-cheat tests (64 tests)
npm run test:unit

# Run security audit tests (5 tests)
npm run test:security

# Run all unit and security tests
npm test

# Run Playwright End-to-End browser tests (8 tests)
npm run test:e2e

# Run TypeScript compilation check
npx tsc --noEmit

# Run production build verification
npm run build
```

---

## 📜 Database Schema & Migrations

Database tables and stored procedures are located in `supabase/migrations/`:
- `20261028_auth_and_profiles.sql`: User profiles, level/XP metrics, trigger for automatic `GV-XXXXXX` Player ID creation.
- `20261030_games_and_sessions.sql`: Games catalog, sessions, high score storage, anti-cheat score submission RPC.
- `20261031_teen_patti_and_wallets.sql`: Virtual chip wallets, double-entry transaction ledgers, chip requests, live Teen Patti tables, competitor card privacy RLS, and atomic SECURITY DEFINER RPCs (`grant_starting_chips`, `admin_grant_chips`, `admin_review_chip_request`).

---

## ⚖️ License & Fair Play Notice

Distributed under the MIT License. Built with passion for high-performance web gaming.

- All gameplay involves strictly virtual currency with zero real-world value.
- Card dealing algorithms utilize cryptographic randomness.
- No real-money gambling, deposits, or withdrawals are supported.
