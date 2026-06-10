#!/bin/bash

# One-time setup script for new developers.
# Run this before scripts/build-android-production.sh.
#
# Usage: ./scripts/setup.sh
#
# Windows users: This script requires Bash. Run it via Git Bash or WSL.
#   Git Bash: Right-click your project folder → "Git Bash Here", then run:
#               ./scripts/setup.sh
#   WSL:      Open WSL terminal, navigate to your project, then run:
#               ./scripts/setup.sh

set -e

PASS="✓"
FAIL="✗"
WARN="!"

ok()   { echo "  $PASS $1"; }
warn() { echo "  $WARN $1"; }
fail() { echo "  $FAIL $1"; }

divider() { echo ""; echo "── $1 ──────────────────────────────"; }

# ── Windows / Git Bash ────────────────────────────────────
# Detect Git Bash / MINGW on Windows and warn about known limitations
if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "mingw"* || "$OSTYPE" == "cygwin" ]]; then
  echo ""
  echo "  Windows detected (Git Bash / MINGW)"
  echo "  If any interactive prompts behave oddly, consider switching to WSL:"
  echo "    https://learn.microsoft.com/en-us/windows/wsl/install"
  echo ""
fi

echo ""
echo "Landline build environment setup"
echo "================================="

EAS="pnpm exec eas"

# ── 1. EAS CLI ────────────────────────────────────────────
divider "EAS CLI"

if ! $EAS --version &>/dev/null 2>&1; then
    fail "eas-cli not found — run: pnpm install"
    echo ""
    exit 1
fi
ok "eas-cli available ($($EAS --version 2>/dev/null | head -1))"

# ── 2. EAS authentication ─────────────────────────────────
divider "EAS authentication"

EAS_USER=$($EAS whoami 2>/dev/null || true)
if [ -z "$EAS_USER" ]; then
    fail "Not logged in to EAS"
    echo ""
    echo "  Log in with:"
    echo "    pnpm exec eas login"
    echo ""
    exit 1
fi
ok "Logged in as: $EAS_USER"

# ── 3. EAS credentials (keystore) ─────────────────────────
divider "EAS credentials"

echo "  Checking for Android keystore..."
echo "  (This opens the interactive credentials manager.)"
echo ""
read -p "  Have you already run 'eas credentials' on this machine? (y/N): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo "  Run the following to pull the signing keystore from EAS:"
    echo "    \$EAS credentials"
    echo ""
    echo "  Navigate: Android → production → Keystore → Download existing keystore"
    echo "  When done: Go back → Exit"
    echo ""
    read -p "  Run 'eas credentials' now? (y/N): " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        \$EAS credentials
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
    if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "mingw"* || "$OSTYPE" == "cygwin" ]]; then
        echo "  Add to your environment variables (Windows):"
        echo "    ANDROID_HOME = %LOCALAPPDATA%\\Android\\Sdk"
        echo ""
        echo "  Or in Git Bash ~/.bashrc:"
        echo "    export ANDROID_HOME=\$LOCALAPPDATA/Android/Sdk"
    else
        echo "  Add to your shell profile (~/.bashrc / ~/.zshrc / ~/.config/fish/config.fish):"
        echo "    export ANDROID_HOME=\$HOME/Android/Sdk"
    fi
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
