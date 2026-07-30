<p align="center">
  <img src="resources/js/assets/icon.png" width="96" alt="Authenticator icon">
</p>

<h1 align="center">Authenticator</h1>

<p align="center">
  A privacy-focused, offline two-factor authentication (2FA) app for Android.
</p>

<p align="center">
  <a href="https://github.com/SandipGhimire/Authenticator/releases/latest"><img src="https://img.shields.io/github/v/release/SandipGhimire/Authenticator" alt="Latest Release"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="License"></a>
</p>

## Overview

Authenticator is a native Android app that generates time-based one-time
passwords (TOTP) for your 2FA-enabled accounts, in the same spirit as apps
like Google Authenticator or Authy — with the difference that **everything
stays on your device**. There's no sign-up, no cloud account, no sync
service, and no analytics. Codes are generated locally, accounts are held in
native secure storage, and the app is gated behind your fingerprint.

It's built entirely on the PHP/Laravel stack: the UI is a Vue single-page
application served from a Laravel backend, packaged into a native Android
app by [NativePHP](https://nativephp.com/), and bridged to native device
capabilities (biometrics, camera/QR scanning, secure storage, file access,
external browser) through a set of custom NativePHP plugins written
alongside this project.

## Features

- **Biometric vault unlock** — the app is locked behind your device's
  fingerprint sensor; codes are only ever shown after a successful native
  biometric check.
- **Manual or QR-based account setup** — add an account by scanning its
  `otpauth://` QR code or by typing in the issuer, secret, and options by
  hand. SHA-1, SHA-256, and SHA-512 algorithms are supported, with 6- or
  8-digit codes and a configurable refresh period.
- **Live TOTP codes** — each account shows a continuously refreshing code
  with a circular countdown ring; tap anywhere on the row to copy the current
  code to the clipboard.
- **Search** — quickly filter your accounts by name or username as your
  vault grows.
- **Google Authenticator import/export** — scan Google Authenticator's own
  `otpauth-migration://` export QR code to bring existing accounts in, or
  generate the same style of QR code(s) from Authenticator to move accounts
  the other way (large vaults are automatically split across multiple codes,
  matching Google Authenticator's own batching behavior).
- **Encrypted backup & restore** — export your entire vault as a single
  password-protected backup file (`.auth.bak`), encrypted with AES-256-GCM
  and a key derived via PBKDF2 (600,000 iterations). Only your password can
  decrypt it — the app has no way to recover a lost backup password.
- **No accounts, no tracking** — no login, no remote database, no telemetry.
  The only place your secrets ever live is your device's secure storage.

## How it works

Authenticator is a Laravel application at its core, but instead of serving
pages over HTTP to a browser it's compiled into a native Android app via
[NativePHP Mobile](https://nativephp.com/). A single Blade view
([resources/views/welcome.blade.php](resources/views/welcome.blade.php))
boots a Vue 3 + TypeScript single-page app
([resources/js/](resources/js/)) that handles the entire user experience —
routing, state (Pinia), OTP generation, and the vault itself.

Everything that needs native device access goes through small NativePHP
plugins maintained alongside this project:

| Plugin                                                                                          | Purpose                                                                     |
| ----------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| [sghimire/mobile-biometric](https://packagist.org/packages/sghimire/mobile-biometric)           | Native fingerprint/biometric authentication to unlock the vault.            |
| [sghimire/mobile-scanner](https://packagist.org/packages/sghimire/mobile-scanner)               | Native QR/barcode scanning for adding accounts and reading migration codes. |
| [sghimire/mobile-secure-storage](https://packagist.org/packages/sghimire/mobile-secure-storage) | Secure, sandboxed native storage for encrypted account data.                |
| [sghimire/mobile-file-access](https://packagist.org/packages/sghimire/mobile-file-access)       | Native file access for saving/loading encrypted backup files.               |
| [sghimire/mobile-browser](https://packagist.org/packages/sghimire/mobile-browser)               | Native in-app browser for opening external links (e.g. plugin pages).       |

TOTP parsing and generation is handled client-side with the
[otpauth](https://www.npmjs.com/package/otpauth) library
([resources/js/core/lib/otp.ts](resources/js/core/lib/otp.ts)); Google
Authenticator's protobuf-based migration format is decoded/encoded with
[protobufjs](https://www.npmjs.com/package/protobufjs)
([resources/js/core/lib/googleTransfer.ts](resources/js/core/lib/googleTransfer.ts));
and encrypted backups are built on the Web Crypto API
([resources/js/core/lib/backup.ts](resources/js/core/lib/backup.ts)).

## Tech stack

- **Backend**: PHP 8.3, [Laravel](https://laravel.com) 13
- **Native runtime**: [NativePHP Mobile](https://nativephp.com/)
- **Frontend**: Vue 3, TypeScript, Vite, Tailwind CSS 4, Pinia, Vue Router
- **Crypto/OTP**: [otpauth](https://www.npmjs.com/package/otpauth),
  [protobufjs](https://www.npmjs.com/package/protobufjs), Web Crypto API
  (PBKDF2 + AES-256-GCM)

## Getting started

### Requirements

- PHP 8.3+ and [Composer](https://getcomposer.org/)
- Node.js and [pnpm](https://pnpm.io/) (or npm)
- The Android SDK/NDK and a JDK, for building/running the native app via
  NativePHP

### Setup

```bash
composer install
npm install # or pnpm install

cp .env.example .env
php artisan key:generate
```

### Running in development

Authenticator is a native app, so the way to actually develop it is to build
and run it on an Android device/emulator (or iOS simulator) via NativePHP,
not the plain Laravel web server:

```bash
php artisan native:run android --watch   # build, install, and launch on Android with hot reload
php artisan native:run ios --watch       # same, for iOS (macOS only)
```

`--watch` (`-W`) keeps the Vite dev server running and hot-reloads the app
as you edit `resources/js`, instead of rebuilding the native binary on every
change. Add `--build=release` to run a release build instead of the debug
default. See `php artisan native:run --help` for all options.

## Building & releasing

Release builds read their configuration (app ID, version, signing tool
paths) from `.env.production`. The included script builds, signs, verifies,
and optionally publishes a release build of the Android APK:

```bash
./scripts/sign-and-release.sh            # build + sign
./scripts/sign-and-release.sh --publish  # also create a GitHub release and upload the APK
```

Publishing requires the [GitHub CLI](https://cli.github.com/) (`gh`) to be
installed and authenticated.

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for release notes.

## License

Licensed under the [MIT license](LICENSE).
