# BU Catering Mobile App

Mobile app for the BU Catering Leftovers project. Built with [Expo](https://expo.dev) + [React Native](https://reactnative.dev/).

> Database schema is documented in **DATABASE.md** at repo root.

---

## Prerequisites

- Node 18+ and npm
- Expo CLI (`npx expo`)
- Firebase CLI (`npm i -g firebase-tools`)

## Setup

All commands start from the repo's root, not the `mobile/` folder.

### 1. Install dependencies

```bash
npm install --legacy-peer-deps
cd mobile
npm install
```

### 2. Environment variables

Create `mobile/.env.local` (same keys as web app, same file works for both web and mobile):

```
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_DATABASE_URL=...
```

**Do not commit real values.**

### 3. Start Firestore emulator

```bash
npm run emulators
```

### 4. Seed sample data

Data persists in `.firebase-data/`, you do not need to run this every time.

```bash
npm run seed
```

Seeds Users, Events, and Reviews into the running emulator.

### 5. Run the app

```bash
cd mobile
npx expo start
```

---

## Formatting

```bash
npm run format
```
