#!/usr/bin/env bash
# =============================================================================
# sign-and-release.sh
# Builds, signs, and optionally publishes the NativePHP Android release APK.
#
# Usage:
#   ./scripts/sign-and-release.sh [--publish]
#
#   --publish   After signing, create a GitHub Release and upload the APK.
#               Requires `gh` (GitHub CLI) to be installed and authenticated.
#
# Steps:
#   1. Build   — php artisan native:run --build=release android --env=production
#   2. Sign    — zipalign + apksigner (v3 scheme)
#   3. Verify  — apksigner verify
#   4. Publish — gh release create (only with --publish)
# =============================================================================

set -euo pipefail

# ---------------------------------------------------------------------------
# Configuration — edit these or set them as environment variables
# ---------------------------------------------------------------------------
APP_VERSION="${NATIVEPHP_APP_VERSION:-1.0.0}"
APP_ID="${NATIVEPHP_APP_ID:-com.sandip.authenticator}"
APP_NAME="${APP_NAME:-Authenticator}"

KEYSTORE_PATH="${KEYSTORE_PATH:-./authenticator-release.keystore}"
KEY_ALIAS="${KEY_ALIAS:-authenticator}"
# These will be prompted for if not set as env vars (safer than hardcoding)
KEYSTORE_PASS="${KEYSTORE_PASS:-}"
KEY_PASS="${KEY_PASS:-}"

BUILD_TOOLS="${BUILD_TOOLS:-/home/sandip/dev-tools/android-sdk/build-tools/36.0.0}"
APKSIGNER="$BUILD_TOOLS/apksigner"
ZIPALIGN="$BUILD_TOOLS/zipalign"
KEYTOOL="${KEYTOOL:-/home/sandip/dev-tools/jdk-17.0.19+10/bin/keytool}"

UNSIGNED_APK="./nativephp/android/app/build/outputs/apk/release/app-release-unsigned.apk"
ALIGNED_APK="./nativephp/android/app/build/outputs/apk/release/app-release-aligned.apk"
SIGNED_APK="./dist/${APP_NAME,,}-${APP_VERSION}.apk"

PUBLISH=false

# ---------------------------------------------------------------------------
# Parse args
# ---------------------------------------------------------------------------
for arg in "$@"; do
    case $arg in
        --publish) PUBLISH=true ;;
        *) echo "Unknown argument: $arg"; exit 1 ;;
    esac
done

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
info()    { echo -e "\033[0;34m[INFO]\033[0m  $*"; }
success() { echo -e "\033[0;32m[OK]\033[0m    $*"; }
warn()    { echo -e "\033[0;33m[WARN]\033[0m  $*"; }
die()     { echo -e "\033[0;31m[ERROR]\033[0m $*" >&2; exit 1; }

prompt_password() {
    local var_name="$1"
    local prompt_text="$2"
    if [[ -z "${!var_name}" ]]; then
        read -rsp "$prompt_text: " val; echo
        eval "$var_name='$val'"
    fi
}

# ---------------------------------------------------------------------------
# Step 1 — Check toolchain
# ---------------------------------------------------------------------------
info "Checking toolchain..."
[[ -f "$APKSIGNER" ]] || die "apksigner not found at $APKSIGNER"
[[ -f "$ZIPALIGN" ]]  || die "zipalign not found at $ZIPALIGN"
[[ -f "$KEYTOOL" ]]   || die "keytool not found at $KEYTOOL"
success "Toolchain OK"

# ---------------------------------------------------------------------------
# Step 2 — Build the release APK
# ---------------------------------------------------------------------------
info "Building release APK..."
php artisan native:run --build=release android --env=production
[[ -f "$UNSIGNED_APK" ]] || die "Build succeeded but APK not found at $UNSIGNED_APK"
success "Build complete"

# ---------------------------------------------------------------------------
# Step 3 — Generate keystore if it doesn't exist
# ---------------------------------------------------------------------------
if [[ ! -f "$KEYSTORE_PATH" ]]; then
    warn "Keystore not found at $KEYSTORE_PATH — generating a new one..."
    echo ""
    echo "  ⚠  IMPORTANT: Store the keystore and passwords safely!"
    echo "  ⚠  You will need the SAME keystore for every future update."
    echo "  ⚠  Losing it means you cannot push updates to existing installs."
    echo ""

    prompt_password KEYSTORE_PASS "Enter new keystore password (min 6 chars)"
    prompt_password KEY_PASS      "Enter new key password (can be same as above)"

    "$KEYTOOL" -genkeypair \
        -keystore  "$KEYSTORE_PATH" \
        -alias     "$KEY_ALIAS" \
        -keyalg    RSA \
        -keysize   2048 \
        -validity  10000 \
        -storepass "$KEYSTORE_PASS" \
        -keypass   "$KEY_PASS" \
        -dname     "CN=$APP_NAME, OU=Mobile, O=SandipGhimire, L=KTM, S=Bagmati, C=NP"

    success "Keystore created: $KEYSTORE_PATH"
    echo ""
    echo "  Keystore info:"
    echo "    Path:      $KEYSTORE_PATH"
    echo "    Alias:     $KEY_ALIAS"
    echo "    Algorithm: RSA-2048, valid 10000 days"
    echo ""
else
    success "Using existing keystore: $KEYSTORE_PATH"
    prompt_password KEYSTORE_PASS "Keystore password"
    prompt_password KEY_PASS      "Key password"
fi

# ---------------------------------------------------------------------------
# Step 4 — zipalign
# ---------------------------------------------------------------------------
info "Aligning APK..."
rm -f "$ALIGNED_APK"
"$ZIPALIGN" -v 4 "$UNSIGNED_APK" "$ALIGNED_APK" > /dev/null
success "Aligned: $ALIGNED_APK"

# ---------------------------------------------------------------------------
# Step 5 — Sign with apksigner (v3 scheme — Play Store compatible)
# ---------------------------------------------------------------------------
info "Signing APK..."
mkdir -p "$(dirname "$SIGNED_APK")"
rm -f "$SIGNED_APK"

"$APKSIGNER" sign \
    --ks           "$KEYSTORE_PATH" \
    --ks-key-alias "$KEY_ALIAS" \
    --ks-pass      "pass:$KEYSTORE_PASS" \
    --key-pass     "pass:$KEY_PASS" \
    --out          "$SIGNED_APK" \
    "$ALIGNED_APK"

success "Signed APK: $SIGNED_APK"

# ---------------------------------------------------------------------------
# Step 5 — Verify signature
# ---------------------------------------------------------------------------
info "Verifying signature..."
"$APKSIGNER" verify --verbose "$SIGNED_APK" 2>&1 | grep -E "Verified|scheme"
success "Signature verified ✓"

# ---------------------------------------------------------------------------
# Step 6 — Publish GitHub Release (optional)
# ---------------------------------------------------------------------------
if [[ "$PUBLISH" == "true" ]]; then
    echo ""
    info "Publishing GitHub Release v$APP_VERSION..."

    if ! command -v gh &>/dev/null; then
        die "'gh' (GitHub CLI) is not installed. Install: https://cli.github.com"
    fi

    gh auth status &>/dev/null || die "Not authenticated with GitHub CLI. Run: gh auth login"

    TAG="v$APP_VERSION"

    # Create or reuse tag
    if git tag -l "$TAG" | grep -q "$TAG"; then
        warn "Tag $TAG already exists — skipping tag creation"
    else
        git tag -a "$TAG" -m "Release $TAG"
        git push origin "$TAG"
        success "Pushed tag $TAG"
    fi

    # Create GitHub release and upload APK
    gh release create "$TAG" \
        "$SIGNED_APK" \
        --title "$APP_NAME $TAG" \
        --notes "## $APP_NAME $TAG

### Installation
Download and install \`$(basename "$SIGNED_APK")\` on your Android device.

> **Note**: Enable *Install from unknown sources* in your device settings if prompted.

### App Info
- Package: \`$APP_ID\`
- Version: \`$APP_VERSION\`" \
        --latest

    RELEASE_URL=$(gh release view "$TAG" --json url -q .url)
    success "GitHub Release: $RELEASE_URL"
fi

echo ""
echo "============================================"
echo " Done!"
echo "============================================"
echo " Signed APK : $SIGNED_APK"
if [[ "$PUBLISH" == "true" ]]; then
    echo " GitHub     : $RELEASE_URL"
fi
echo "============================================"
