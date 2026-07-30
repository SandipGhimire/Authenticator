# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.1]

### Fixed

- App always cold-starting on the second launch, caused by
  `NATIVEPHP_APP_VERSION_CODE` being missing at runtime. The variable is now
  set alongside `NATIVEPHP_APP_VERSION` in `.env.example` for both the
  development and production configs.
- Biometric prompt on the Main screen could be re-triggered by tapping the
  button again after a successful unlock; the action is now disabled once
  `status === 'success'`.
- Wrong GitHub repository URL for the Mobile Biometrics plugin on the About
  page (`NativePHP-MobileBiometrics` → `NativePHP-MobileBiometric`).
- Packagist and GitHub buttons on the About page had their browser handlers
  interchanged (Packagist opened in the in-app browser, GitHub opened
  externally); they're now wired to the correct handler for each
  destination.

### Changed

- Redesigned the account list item (`Home/Item.vue`): the linear progress bar
  and separate copy button are replaced with a circular countdown ring and a
  tap-anywhere-to-copy row, with a checkmark shown to confirm the copy.
- Removed pull-to-refresh from the Home screen.
- Renamed the app entry point from `resources/js/app.ts` to
  `resources/js/main.ts` (updated in `vite.config.ts` and
  `resources/views/welcome.blade.php` accordingly).
- Minor styling consistency pass (Sidebar, 404, Main views): unified
  `red-400`/`red-600` accents to `red-500`.
- The app version shown in the sidebar footer and the About screen is now
  read from a single `appVersion` constant exported from `main.ts`, instead
  of being hardcoded as `v1.0.0` in each place.

---

## [1.0.0] - 2026-07-28

Initial release of Authenticator — a privacy-focused, offline two-factor
authentication app for Android.

Authenticator keeps every 2FA code on-device: accounts are held in native
secure storage behind a biometric unlock screen, codes are generated locally
using the standard TOTP algorithm, and nothing is ever sent to a server —
there's no account to sign into, no cloud sync, and no analytics or tracking.

Accounts can be added by scanning a QR code or typing in the secret by hand,
with support for SHA-1/SHA-256/SHA-512 and both 6- and 8-digit codes. Existing
accounts can be brought over from Google Authenticator by scanning its
`otpauth-migration://` export QR code, and the whole vault can be moved
between devices as a password-protected, AES-256-GCM encrypted backup file
that only the owner's password can unlock.

The app is built with Laravel, NativePHP, and Vue.js, and ships as a native
Android app powered by a set of custom NativePHP plugins developed alongside
it for biometric authentication, QR/barcode scanning, secure storage, native
file access, and an in-app browser. This release also includes the
`.env.production` build configuration and an automation script for signing
the Android APK and publishing it as a GitHub release.
