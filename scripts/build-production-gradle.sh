#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

# Load .env.local
if [ -f .env.local ]; then
  set -a; source .env.local; set +a
fi

KEYSTORE_FILE="${KEYSTORE_FILE:-landline-release.keystore}"
KEYSTORE_ALIAS="${KEYSTORE_ALIAS:-landline}"

# Prompt for keystore passwords if not in env
if [ -z "${KEYSTORE_STORE_PASSWORD:-}" ]; then
  read -rsp "Keystore store password: " KEYSTORE_STORE_PASSWORD; echo
fi
if [ -z "${KEYSTORE_KEY_PASSWORD:-}" ]; then
  read -rsp "Key password: " KEYSTORE_KEY_PASSWORD; echo
fi

# Generate keystore if missing
if [ ! -f "$KEYSTORE_FILE" ]; then
  echo "No keystore found — generating one..."
  keytool -genkey -v \
    -keystore "$KEYSTORE_FILE" \
    -alias "$KEYSTORE_ALIAS" \
    -keyalg RSA -keysize 2048 -validity 10000 \
    -storepass "$KEYSTORE_STORE_PASSWORD" \
    -keypass "$KEYSTORE_KEY_PASSWORD" \
    -dname "CN=Landline, OU=Unknown, O=Unknown, L=Unknown, ST=Unknown, C=US"
  echo ""
  echo "WARNING: Back up $KEYSTORE_FILE somewhere safe outside this repo."
  echo "         Losing it means you can never update this app on Google Play."
  echo ""
fi

# Bump versionCode
CURRENT=$(grep 'versionCode:' app.config.ts | grep -o '[0-9]*')
echo "Current versionCode: $CURRENT"
read -rp "New versionCode (enter to keep $CURRENT): " NEW_VERSION_CODE
NEW_VERSION_CODE="${NEW_VERSION_CODE:-$CURRENT}"
sed -i "s/versionCode: [0-9]*/versionCode: $NEW_VERSION_CODE/" app.config.ts
echo "versionCode set to $NEW_VERSION_CODE"

# Prebuild
echo ""
echo "Running prebuild..."
pnpm prebuild

# Write keystore.properties (relative to android/ dir, so storeFile is one level up)
cat > android/keystore.properties << EOF
storePassword=$KEYSTORE_STORE_PASSWORD
keyPassword=$KEYSTORE_KEY_PASSWORD
keyAlias=$KEYSTORE_ALIAS
storeFile=../../$KEYSTORE_FILE
EOF

# Patch android/app/build.gradle to load keystore.properties and use release signing
python3 - android/app/build.gradle << 'PYEOF'
import sys, re

path = sys.argv[1]
with open(path) as f:
    content = f.read()

# Inject keystore loader before the android { block
loader = (
    'def keystorePropertiesFile = rootProject.file("keystore.properties")\n'
    'def keystoreProperties = new Properties()\n'
    'if (keystorePropertiesFile.exists()) {\n'
    '    keystoreProperties.load(new FileInputStream(keystorePropertiesFile))\n'
    '}\n\n'
)
if 'keystorePropertiesFile' not in content:
    content = re.sub(r'(android \{)', loader + r'\1', content, count=1)

# Add release signingConfig block after the debug one
release_block = (
    '\n        release {\n'
    "            keyAlias keystoreProperties['keyAlias']\n"
    "            keyPassword keystoreProperties['keyPassword']\n"
    "            storeFile keystoreProperties['storeFile'] ? file(keystoreProperties['storeFile']) : null\n"
    "            storePassword keystoreProperties['storePassword']\n"
    '        }'
)
if 'signingConfigs.release' not in content:
    content = re.sub(
        r'(signingConfigs \{)(.*?)(        debug \{.*?\})',
        lambda m: m.group(1) + m.group(2) + m.group(3) + release_block,
        content, flags=re.DOTALL, count=1
    )
    # Switch release buildType to use release signingConfig
    content = re.sub(
        r'(        release \{[^}]*?)signingConfig signingConfigs\.debug',
        r'\1signingConfig signingConfigs.release',
        content, flags=re.DOTALL
    )

with open(path, 'w') as f:
    f.write(content)

print("build.gradle patched for release signing")
PYEOF

# Build
echo ""
echo "Building release AAB..."
cd android && ./gradlew bundleRelease

AAB="app/build/outputs/bundle/release/app-release.aab"
echo ""
echo "Build complete: android/$AAB"
echo "Upload this file to Google Play Console."
