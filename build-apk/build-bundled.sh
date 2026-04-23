#!/usr/bin/env bash
# Build a self-contained Capacitor APK that bundles the AnkiGen frontend.
# The APK still calls the backend at $API_BASE for AI generation, decks, etc.
#
# Usage:
#   API_BASE=https://YOUR-APP.replit.app/api ./build-apk/build-bundled.sh
# If API_BASE is not set, falls back to the current Replit dev domain.

set -euo pipefail
cd "$(dirname "$0")/.."

API_BASE="${API_BASE:-https://${REPLIT_DEV_DOMAIN}/api}"
HOST=$(echo "$API_BASE" | sed -E 's#https?://([^/]+).*#\1#')

export ANDROID_HOME=/home/runner/android-sdk
export ANDROID_SDK_ROOT="$ANDROID_HOME"
export JAVA_HOME=/nix/store/3ilfkn8kxd9f6g5hgr0wpbnhghs4mq2m-openjdk-21.0.7+6
export PATH="$JAVA_HOME/bin:$ANDROID_HOME/platform-tools:$ANDROID_HOME/cmdline-tools/latest/bin:$PATH"

echo "==> Building web bundle (API_BASE=$API_BASE)"
( cd artifacts/anki-generator && PORT=5000 VITE_API_BASE="$API_BASE" BASE_PATH="/" pnpm build )

echo "==> Cleaning APK artifacts from web bundle"
rm -f artifacts/anki-generator/dist/public/anki-cards.apk \
      artifacts/anki-generator/dist/public/anki-cards.apk.idsig \
      artifacts/anki-generator/dist/public/anki-cards.apk.json

echo "==> Syncing to Android project"
( cd artifacts/anki-generator && pnpm exec cap sync android )

echo "==> Building signed release APK"
( cd artifacts/anki-generator/android && ./gradlew assembleRelease )

APK_SRC=artifacts/anki-generator/android/app/build/outputs/apk/release/app-release.apk
APK_DST=artifacts/anki-generator/public/anki-cards.apk
cp "$APK_SRC" "$APK_DST"
SIZE=$(stat -c%s "$APK_DST")

cat > artifacts/anki-generator/public/anki-cards.apk.json <<EOF
{
  "targetUrl": "https://$HOST",
  "host": "$HOST",
  "additionalHosts": [],
  "packageId": "app.replit.ankigen",
  "versionName": "1.0",
  "versionCode": 1,
  "sizeBytes": $SIZE,
  "builtAt": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "kind": "bundled",
  "apiBase": "$API_BASE"
}
EOF
rm -f artifacts/anki-generator/public/anki-cards.apk.idsig

echo "==> Done: $APK_DST ($(du -h "$APK_DST" | cut -f1))"
