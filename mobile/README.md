# BU Catering Mobile App Setup Guide

Mobile app for the BU Catering Leftovers project. Built with Expo + React Native.

## Prerequisites

- Node 18+ and npm
- Expo CLI (npx expo)
- Firebase CLI (npm i -g firebase-tools)

## Setup Instructions

### Step 1: Install Dependencies

**Location:** Run from repo root (se-bu-catering-leftovers/)

```bash
npm install --legacy-peer-deps
cd mobile
npm install
cd ..  # Go back to repo root
```

### Step 2: Environment Variables

**Location:** Create file in mobile/ folder

```bash
# Create the file
touch mobile/.env.local
```

**File content:** Copy these keys (same as web app):

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain_here
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id_here
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket_here
NEXT_PUBLIC_FIREBASE_DATABASE_URL=your_database_url_here
```

⚠️ **Do not commit real values to Git**

### Step 3: Start Firestore Emulator

**Location:** Run from repo root (se-bu-catering-leftovers/)

```bash
npm run emulators
```

✅ Keep this terminal open - emulator must stay running

### Step 4: Seed Sample Data (First Time Only)

**Location:** Run from repo root (se-bu-catering-leftovers/) in a NEW terminal

```bash
npm run seed
```

✅ This creates sample Users, Events, and Reviews
✅ Data persists in .firebase-data/ folder
✅ Only run once unless you want fresh data

### Step 5: Run the Mobile App

**Location:** Run from mobile/ folder in a NEW terminal

```bash
cd mobile
npx expo start
```

✅ This opens Expo development server
✅ Scan QR code with Expo Go app on your phone

## Development Commands

### Format Code

**Location:** Run from repo root (se-bu-catering-leftovers/)

```bash
npm run format
```

## Terminal Setup Summary

You'll need 3 terminals open:

1. **Terminal 1:** `npm run emulators` (from repo root)
2. **Terminal 2:** `npm run seed` (from repo root, one-time only)
3. **Terminal 3:** `cd mobile && npx expo start` (from mobile folder)

## Troubleshooting

- If emulator fails: Make sure Firebase CLI is installed globally
- If mobile app fails: Make sure .env.local exists in mobile/ folder
- If data missing: Run `npm run seed` again
