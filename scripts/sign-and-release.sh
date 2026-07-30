#!/usr/bin/env bash
# =============================================================================
# sign-and-release.sh
# Builds, signs, and optionally publishes the NativePHP Android release APK.
#
# Usage:
#   ./scripts/sign-and-release.sh [--publish]
#
#   --publish   After signing, tag the release and create a GitHub Release
#               with the APK attached. Requires `gh` (GitHub CLI) to be
#               installed and authenticated.
#
# Steps:
#   1. Build   — php artisan native:run --build=release android --env=production
#   2. Sign    — zipalign + apksigner (v3 scheme)
#   3. Verify  — apksigner verify
#   4. Publish — git tag + gh release create (only with --publish)
#
# With --publish, the git tag message and GitHub release notes are pulled
# straight from the CHANGELOG.md entry for $NATIVEPHP_APP_VERSION (the
# "## [x.y.z] ..." section):
#   - If that section doesn't exist, the script stops immediately (before
#     building/signing anything) and tells you to add one first.
#   - If the section is missing a release date, or is still marked
#     "Unreleased", today's date is filled in automatically. CHANGELOG.md is
#     left modified on disk — review and commit it as part of the release.
# =============================================================================

set -euo pipefail

# ---------------------------------------------------------------------------
# Configuration — loaded from .env.production (override via environment vars)
# ---------------------------------------------------------------------------
ENV_FILE="$(dirname "$0")/../.env.production"
if [[ -f "$ENV_FILE" ]]; then
    _env_get() { grep -E "^$1=" "$ENV_FILE" | head -1 | cut -d= -f2- | tr -d "\"'"; }
    APP_VERSION="${NATIVEPHP_APP_VERSION:-$(_env_get NATIVEPHP_APP_VERSION)}"
    APP_ID="${NATIVEPHP_APP_ID:-$(_env_get NATIVEPHP_APP_ID)}"
    APP_NAME="${APP_NAME:-$(_env_get APP_NAME)}"
    BUILD_TOOLS="${BUILD_TOOLS:-$(_env_get BUILD_TOOLS)}"
    KEYTOOL="${KEYTOOL:-$(_env_get KEYTOOL)}"
else
    echo "[WARN] .env.production not found at $ENV_FILE — using built-in defaults"
    APP_VERSION="${NATIVEPHP_APP_VERSION:-1.0.0}"
    APP_ID="${NATIVEPHP_APP_ID:-com.sandip.authenticator}"
    APP_NAME="${APP_NAME:-Authenticator}"
    BUILD_TOOLS="${BUILD_TOOLS:-/home/sandip/Android/Sdk/build-tools/36.0.0}"
    KEYTOOL="${KEYTOOL:-/usr/lib/jvm/java-21-openjdk-amd64/bin/keytool}"
fi

BUILD_TOOLS="${BUILD_TOOLS%/}"

KEYSTORE_PATH="${KEYSTORE_PATH:-./authenticator-release.keystore}"
KEY_ALIAS="${KEY_ALIAS:-authenticator}"
KEYSTORE_PASS="${KEYSTORE_PASS:-}"
KEY_PASS="${KEY_PASS:-}"

APKSIGNER="$BUILD_TOOLS/apksigner"
ZIPALIGN="$BUILD_TOOLS/zipalign"

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

resolve_changelog_entry() {
    local changelog="$(dirname "$0")/../CHANGELOG.md"
    [[ -f "$changelog" ]] || die "CHANGELOG.md not found at $changelog"

    local escaped_version="${APP_VERSION//./\\.}"
    local header_line_no
    header_line_no=$(grep -n -E "^## \[${escaped_version}\]" "$changelog" | head -1 | cut -d: -f1)

    if [[ -z "$header_line_no" ]]; then
        die "No CHANGELOG.md entry found for version $APP_VERSION.
Add a '## [$APP_VERSION] - <date or Unreleased>' section to CHANGELOG.md documenting this release, then try again."
    fi

    local header_text
    header_text=$(sed -n "${header_line_no}p" "$changelog")

    if [[ "$header_text" =~ ^##\ \[${escaped_version}\]\ *(-\ *[Uu]nreleased)?\ *$ ]]; then
        local today
        today="$(date +%Y-%m-%d)"
        warn "CHANGELOG.md entry for $APP_VERSION has no release date — setting it to $today"
        sed -i "${header_line_no}s/.*/## [$APP_VERSION] - $today/" "$changelog"
        warn "CHANGELOG.md was modified — review and commit this change."
    fi

    CHANGELOG_BODY=$(awk -v ver="$escaped_version" '
        BEGIN { capture = 0 }
        $0 ~ ("^## \\[" ver "\\]") { capture = 1; next }
        capture && /^## \[/ { exit }
        capture && /^---[[:space:]]*$/ { exit }
        capture { print }
    ' "$changelog" | awk '
        { line[NR] = $0 }
        END {
            first = 1; last = NR
            while (first <= last && line[first] == "") first++
            while (last >= first && line[last] == "") last--
            for (i = first; i <= last; i++) print line[i]
        }
    ')

    if [[ -z "$(echo "$CHANGELOG_BODY" | tr -d '[:space:]')" ]]; then
        die "CHANGELOG.md entry for $APP_VERSION is empty. Add release notes before releasing."
    fi
}

if [[ "$PUBLISH" == "true" ]]; then
    resolve_changelog_entry
    success "Using CHANGELOG.md entry for v$APP_VERSION as the release message"
fi

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
info "Removing existing release APK files..."
# Remove already existing APK files
if [[ -f "$UNSIGNED_APK" ]]; then
    info "Removing existing $UNSIGNED_APK"
    rm -f "$UNSIGNED_APK"
fi

if [[ -f "$ALIGNED_APK" ]]; then
    info "Removing existing $ALIGNED_APK"
    rm -f "$ALIGNED_APK"
fi

if [[ -f "$SIGNED_APK" ]]; then
    info "Removing existing $SIGNED_APK"
    rm -f "$SIGNED_APK"
fi

# Run build again
info "Building Frontend..."
pnpm run build

info "Building Android App..."
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

    TAG_MESSAGE_FILE="$(mktemp)"
    RELEASE_NOTES_FILE="$(mktemp)"
    trap 'rm -f "$TAG_MESSAGE_FILE" "$RELEASE_NOTES_FILE"' EXIT

    {
        echo "$APP_NAME $TAG"
        echo ""
        echo "$CHANGELOG_BODY"
    } > "$TAG_MESSAGE_FILE"

    {
        echo "## $APP_NAME $TAG"
        echo ""
        echo "$CHANGELOG_BODY"
        echo ""
        echo "### Installation"
        echo "Download and install \`$(basename "$SIGNED_APK")\` on your Android device."
        echo ""
        echo "> **Note**: Enable *Install from unknown sources* in your device settings if prompted."
        echo ""
        echo "### App Info"
        echo "- Package: \`$APP_ID\`"
        echo "- Version: \`$APP_VERSION\`"
    } > "$RELEASE_NOTES_FILE"

    # Create or reuse tag
    if git tag -l "$TAG" | grep -q "$TAG"; then
        warn "Tag $TAG already exists — skipping tag creation"
    else
        git tag -a "$TAG" -F "$TAG_MESSAGE_FILE"
        git push origin "$TAG"
        success "Pushed tag $TAG"
    fi

    # Create GitHub release and upload APK
    gh release create "$TAG" \
        "$SIGNED_APK" \
        --title "$APP_NAME $TAG" \
        --notes-file "$RELEASE_NOTES_FILE" \
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
