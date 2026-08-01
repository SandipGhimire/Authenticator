# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.2] - 2026-08-01

### Added

- Multi-profile vaults: the app can now hold more than one separate,
  independently-secured set of accounts ("profiles") on the same device,
  with biometric-gated switching between them.
- A Profiles screen (Sidebar → Profiles, or the profile chip in the top
  bar) to add, rename, and delete profiles, each shown with a colored
  initials avatar.
- Automatic one-time migration on first launch after this update: any
  existing vault is moved into a new "Default" profile with no action
  required and no data loss; safe to resume if interrupted mid-migration.
- A "Choose a profile" screen shown at unlock whenever the app can't
  automatically resolve which profile to open (e.g. more than one profile
  exists and none is pinned or remembered).
- A new Settings screen (Sidebar → Settings), itself gated behind a fresh
  biometric check on every visit, with controls to:
    - enable or disable the profile switcher entirely,
    - remember the last-used profile across launches,
    - pin a specific profile to always boot into,
    - require biometrics to switch profiles, independently from requiring
      biometrics to delete one.
- An account-selection step when exporting: both the encrypted backup
  export and the Google Authenticator QR export now let you choose which
  accounts to include instead of always exporting the whole vault.

### Changed

- Import and export now always operate on the currently active profile.
- Vault storage keys are namespaced per profile internally
  (`core/lib/vault.ts`); existing installs are migrated transparently, as
  described above.
- The Import & Export screen is now split into two tabs — **Internal**
  (encrypted backup file) and **Google Authenticator** (QR-based transfer)
  — instead of stacking all four panels in one long scroll.
- The About screen's feature list now reflects the current feature set
  (biometric-gated vault, multiple profiles, flexible code entry, Google
  Authenticator migration, encrypted backups) instead of the original
  generic bullets from 1.0.0.

---

## [1.0.1] - 2026-07-30

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
