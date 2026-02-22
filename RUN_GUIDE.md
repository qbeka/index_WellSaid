# WellSaid – Quick Run Guide

From a fresh clone, follow these steps to run the web and mobile apps.

## Prerequisites

- **Node.js** 18+ and **npm**
- **Expo Go** on your phone (for mobile), or **Xcode** (iOS) / **Android Studio** (Android) for simulators

## 1. Clone and Install

```bash
git clone <repo-url>
cd WellSaid
npm install
```

## 2. Environment Setup

### Web

```bash
cp apps/web/.env.template apps/web/.env.local
```

Edit `apps/web/.env.local` and fill in:

- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` – from Supabase project settings
- `OPENAI_API_KEY` – from OpenAI
- `NEXT_PUBLIC_SITE_URL` – e.g. `http://localhost:3000` for local dev
- `ASSEMBLYAI_API_KEY`, `VAPI_*`, `UPSTASH_*` – for voice/transcription features

### Mobile

```bash
cp apps/mobile/.env.template apps/mobile/.env
```

Edit `apps/mobile/.env` and fill in the same services. Set `EXPO_PUBLIC_API_URL` to your web app URL (e.g. `http://localhost:3000` or your deployed URL).

## 3. Database

Create a Supabase project and run the schema migrations in `packages/shared/src/sql/` against your database.

## 4. Run

### Web

```bash
npm run dev:web
```

Open [http://localhost:3000](http://localhost:3000).

### Mobile

```bash
npm run dev:mobile
```

Scan the QR code with Expo Go (Android) or the Camera app (iOS), or press `i` for iOS simulator / `a` for Android emulator.

## Tips

- Web must be running (or deployed) for mobile to use the API.
- For local mobile testing, use your machine’s LAN IP for `EXPO_PUBLIC_API_URL` (e.g. `http://192.168.1.x:3000`) if the device is not on the same host.
