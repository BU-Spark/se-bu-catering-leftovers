## BU Catering Mobile App – Deployment Guide

This document focuses **only on deployment** of the Expo mobile app.  
Use it when you are ready to share a stable build with testers or the app stores.

---

## 1. Environments & Assumptions

- **App type**: Expo-managed React Native app (see `app.config.ts`).
- **Back end**:
  - Local development usually talks to the **Firebase emulator**.
  - Production builds should point to a **real Firebase project** (no emulators).
- **Where you can deploy**:
  - For **testers**: Expo Go or installable `.apk` / `.aab` (Android) and `.ipa` (iOS).
  - For **stores**: Google Play Store, Apple App Store (via EAS Build or your CI).

---

## 2. Configure Environment for Production

1. **Decide which Firebase project to target** (e.g. `bu-catering-prod`).
2. In the Firebase console, create web/mobile credentials and note:
   - `FIREBASE_API_KEY`
   - `FIREBASE_AUTH_DOMAIN`
   - `FIREBASE_PROJECT_ID`
   - `FIREBASE_STORAGE_BUCKET`
   - `FIREBASE_DATABASE_URL` (if used)
3. In the repo root, make sure your **production values are _not_ committed**:
   - Keep real secrets in local `.env` files or CI secrets.
4. In `mobile/.env.local` (or a CI-managed env file), set the **production** values:

```bash
# mobile/.env.local (example – do NOT commit real values)
NEXT_PUBLIC_FIREBASE_API_KEY=prod_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=prod_auth_domain_here
NEXT_PUBLIC_FIREBASE_PROJECT_ID=prod_project_id_here
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=prod_storage_bucket_here
NEXT_PUBLIC_FIREBASE_DATABASE_URL=prod_database_url_here
```

> **Important:** For production builds, you should _not_ point at the local emulator.

---

## 3. Smoke-Test a “Production-like” Build Locally

Before doing store builds, it’s useful to run a bundle that is closer to production.

From the `mobile/` folder:

```bash
cd mobile
npx expo start --no-dev --minify
```

- This runs the app in **production mode** (no dev menu, minified JS).
- Use Expo Go or a simulator to verify:
  - Authentication works against the production Firebase project.
  - Events list loads correctly.
  - Sorting and location filtering work as expected.
  - Settings, theme toggling, and navigation work without errors.

---

## 4. Building Installable Artifacts with EAS (Recommended)

> You only need to do this if you want **.apk / .aab / .ipa** or to submit to the app stores.

### 4.1 Install and log in to Expo

From anywhere:

```bash
npm install -g eas-cli  # optional global install
eas login               # use the team Expo account
```

Make sure `EXPO_TOKEN` or login credentials are available in CI if you use a pipeline.

### 4.2 Configure EAS project

From the `mobile/` folder:

```bash
cd mobile
eas init --id <your-expo-project-id>
```

Confirm that:

- `app.config.ts` has the correct `scheme`, `ios.bundleIdentifier`, and `android.package`.
- Any **production-specific env** is wired up via EAS secrets or env files (no secrets in git).

### 4.3 Build for Android

```bash
cd mobile
eas build --platform android
```

EAS will:

- Ask for or reuse Android keystore credentials.
- Produce an `.apk` or `.aab` you can download from the EAS dashboard.

### 4.4 Build for iOS

```bash
cd mobile
eas build --platform ios
```

EAS will:

- Ask for or reuse Apple credentials / provisioning profiles.
- Produce an `.ipa` you can submit via Transporter / App Store Connect.

---

## 5. Manual Tester Distribution (Without App Stores)

If you don’t want to go through the stores yet, you can still give builds to testers:

- **Android**:
  - Share the `.apk` directly with testers to sideload on their devices.
  - Or upload an `.aab` to Google Play internal testing track.
- **iOS**:
  - Upload `.ipa` to App Store Connect.
  - Use **TestFlight** for internal / external testing.

Alternatively, for very early testing:

- Keep running `npx expo start`.
- Testers install **Expo Go** and scan the QR code (no store deployment needed).

---

## 6. Production Checklist

Before you consider the mobile app “deployed”:

- [ ] Using **real Firebase project** credentials (no emulator).
- [ ] Authentication (Clerk / Firebase) works end-to-end on devices.
- [ ] Events:
  - [ ] Load successfully.
  - [ ] Show correct countdown / expiry behavior.
  - [ ] Can be sorted and filtered as expected.
- [ ] Settings:
  - [ ] Theme toggle and notification toggles behave correctly.
  - [ ] Admin vs student routes behave correctly.
- [ ] Crash-free on both Android and iOS in a short manual smoke test.

---

## 7. Where to Update if Deployment Changes

If your team later changes how deployment works (for example, new CI workflows or a different backend):

- Update **this file** (`mobile/DEPLOYMENT.md`) with:
  - New build commands.
  - New environment variables or services.
  - Any store submission notes (versioning, signing, review notes).


