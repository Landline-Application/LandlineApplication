#!/bin/bash

# One-time setup script for new developers.
# Run this before scripts/build-android-production.sh.
#
# Usage: ./scripts/setup.sh

set -e

PASS="✓"
FAIL="✗"
WARN="!"

ok()   { echo "  $PASS $1"; }
warn() { echo "  $WARN $1"; }
fail() { echo "  $FAIL $1"; }

divider() { echo ""; echo "── $1 ──────────────────────────────"; }

echo ""
echo "Landline build environment setup"
echo "================================="

# ── 1. EAS CLI ────────────────────────────────────────────
divider "EAS CLI"

if ! command -v eas &>/dev/null; then
    fail "eas-cli not found"
    echo ""
    echo "  Install it with:"
    echo "    npm install -g eas-cli"
    echo ""
    exit 1
fi
ok "eas-cli installed ($(eas --version 2>/dev/null | head -1))"

# ── 2. EAS authentication ─────────────────────────────────
divider "EAS authentication"

EAS_USER=$(eas whoami 2>/dev/null || true)
if [ -z "$EAS_USER" ]; then
    fail "Not logged in to EAS"
    echo ""
    echo "  Log in with:"
    echo "    eas login"
    echo ""
    exit 1
fi
ok "Logged in as: $EAS_USER"

# ── 3. EAS credentials (keystore) ─────────────────────────
divider "EAS credentials"

echo "  Checking for Android keystore..."
echo "  (This opens the interactive credentials manager — select the existing keystore"
echo "   if prompted, then press Ctrl+C or quit when done.)"
echo ""
read -p "  Have you already run 'eas credentials' on this machine? (y/N): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo "  Run the following to pull the signing keystore from EAS:"
    echo "    eas credentials"
    echo ""
    echo "  Navigate: Android → production → Keystore → Set up a new keystore"
    echo "  The existing keystore will be detected and pulled automatically."
    echo ""
    read -p "  Run 'eas credentials' now? (y/N): " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        eas credentials
    else
        warn "Skipping credentials — build will fail without the keystore"
    fi
else
    ok "Credentials confirmed"
fi

# ── 4. .env.local ─────────────────────────────────────────
divider ".env.local"

ENV_FILE="$(pwd)/.env.local"

if [ ! -f "$ENV_FILE" ]; then
    fail ".env.local not found"
    echo ""
    echo "  Create it from the example:"
    echo "    cp .env.example .env.local"
    echo "  Then fill in the values."
    echo ""
    exit 1
fi
ok ".env.local exists"

# Load it for subsequent checks
set -a
# shellcheck disable=SC1090
source "$ENV_FILE"
set +a

# GOOGLE_SERVICES_JSON
if [ -z "$GOOGLE_SERVICES_JSON" ] || [ "$GOOGLE_SERVICES_JSON" = "/path/to/google-services.json" ]; then
    fail "GOOGLE_SERVICES_JSON is not set in .env.local"
    echo "  See docs/FIREBASE-CONFIG.md and docs/GOOGLE-SERVICES-SETUP.md"
elif [ ! -f "$GOOGLE_SERVICES_JSON" ]; then
    fail "GOOGLE_SERVICES_JSON path does not exist: $GOOGLE_SERVICES_JSON"
else
    ok "GOOGLE_SERVICES_JSON → $GOOGLE_SERVICES_JSON"
fi

# GOOGLE_WEB_CLIENT_ID
if [ -z "$GOOGLE_WEB_CLIENT_ID" ] || [ "$GOOGLE_WEB_CLIENT_ID" = "your-web-client-id.apps.googleusercontent.com" ]; then
    fail "GOOGLE_WEB_CLIENT_ID is not set in .env.local"
else
    ok "GOOGLE_WEB_CLIENT_ID is set"
fi

# ── 5. Android SDK ────────────────────────────────────────
divider "Android SDK"

if [ -z "$ANDROID_HOME" ]; then
    fail "ANDROID_HOME is not set"
    echo ""
    echo "  Add to your shell profile (~/.bashrc / ~/.zshrc / ~/.config/fish/config.fish):"
    echo "    export ANDROID_HOME=\$HOME/Android/Sdk"
    echo "    export PATH=\$PATH:\$ANDROID_HOME/cmdline-tools/latest/bin"
    echo "    export PATH=\$PATH:\$ANDROID_HOME/platform-tools"
    echo "    export PATH=\$PATH:\$ANDROID_HOME/emulator"
    echo ""
    echo "  Then install required SDK packages:"
    echo "    sdkmanager \"platforms;android-35\" \"build-tools;35.0.0\" \"platform-tools\""
    echo "    sdkmanager --licenses"
    echo ""
    exit 1
fi
ok "ANDROID_HOME → $ANDROID_HOME"

if [ ! -d "$ANDROID_HOME/platforms/android-35" ]; then
    fail "SDK platform android-35 not installed"
    echo "    sdkmanager \"platforms;android-35\""
else
    ok "platforms;android-35 installed"
fi

if [ ! -d "$ANDROID_HOME/build-tools/35.0.0" ]; then
    fail "build-tools;35.0.0 not installed"
    echo "    sdkmanager \"build-tools;35.0.0\""
else
    ok "build-tools;35.0.0 installed"
fi

# ── 6. Node / pnpm ────────────────────────────────────────
divider "Node / pnpm"

if ! command -v node &>/dev/null; then
    fail "node not found"
    exit 1
fi
ok "node $(node --version)"

if ! command -v pnpm &>/dev/null; then
    fail "pnpm not found — install with: npm install -g pnpm"
    exit 1
fi
ok "pnpm $(pnpm --version)"

if [ ! -d "$(pwd)/node_modules" ]; then
    warn "node_modules missing — run: pnpm install"
else
    ok "node_modules present"
fi

# ── Done ──────────────────────────────────────────────────
echo ""
echo "═══════════════════════════════════════"
echo "Setup complete. You can now run:"
echo "  ./scripts/build-android-production.sh"
echo "═══════════════════════════════════════"
echo ""
