#!/usr/bin/env bash
set -euo pipefail

MODE="${1:-release}"
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

UDID="${IOS_DEVICE_UDID:-077b5a36726653ab02cada59c793c36dce9ad487}"
TEAM_ID="${IOS_DEVELOPMENT_TEAM:-M79ZA43Q24}"
BUNDLE_ID="${IOS_BUNDLE_ID:-com.limei.ttzhipinapp}"
SCHEME="${IOS_SCHEME:-ttZhipinApp}"
WORKSPACE="${IOS_WORKSPACE:-ios/ttZhipinApp.xcworkspace}"
DEVICE_TIMEOUT="${IOS_DEVICE_TIMEOUT:-30}"
PREFLIGHT_TIMEOUT="${IOS_PREFLIGHT_TIMEOUT:-5}"

export PATH="/tmp/ttzhipin-tools/node_modules/.bin:/usr/local/opt/node@20/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:${PATH}"

case "$MODE" in
  debug)
    CONFIGURATION="Debug"
    BUILD_FOLDER="${IOS_BUILD_FOLDER:-/tmp/ttzhipin-device-build}"
    ;;
  release)
    CONFIGURATION="Release"
    BUILD_FOLDER="${IOS_BUILD_FOLDER:-/tmp/ttzhipin-device-build-release}"
    ;;
  install-debug)
    CONFIGURATION="Debug"
    BUILD_FOLDER="${IOS_BUILD_FOLDER:-/tmp/ttzhipin-device-build}"
    SKIP_BUILD="1"
    ;;
  install-release)
    CONFIGURATION="Release"
    BUILD_FOLDER="${IOS_BUILD_FOLDER:-/tmp/ttzhipin-device-build-release}"
    SKIP_BUILD="1"
    ;;
  *)
    echo "Usage: $0 [debug|release|install-debug|install-release]"
    exit 2
    ;;
esac

PRODUCT_DIR="${BUILD_FOLDER}/Build/Products/${CONFIGURATION}-iphoneos"
APP_PATH="${PRODUCT_DIR}/${SCHEME}.app"
SKIP_BUILD="${SKIP_BUILD:-0}"

cd "$PROJECT_ROOT"

if command -v ios-deploy >/dev/null 2>&1; then
  IOS_DEPLOY=(ios-deploy)
elif command -v npx >/dev/null 2>&1; then
  IOS_DEPLOY=(npx --yes ios-deploy)
else
  echo "ios-deploy and npx were not found. Install ios-deploy or make Node/npm available."
  exit 1
fi

echo "Device: ${UDID}"
echo "Mode: ${CONFIGURATION}"
echo "Bundle ID: ${BUNDLE_ID}"
echo "Build folder: ${BUILD_FOLDER}"
echo "Installer: ${IOS_DEPLOY[*]}"
echo "Device timeout: ${DEVICE_TIMEOUT}s"

set +e
"${IOS_DEPLOY[@]}" --id "$UDID" --detect --no-wifi --timeout "$PREFLIGHT_TIMEOUT" >/dev/null
DETECT_STATUS=$?
set -e

if [[ "$DETECT_STATUS" -ne 0 ]]; then
  echo "Warning: target iPhone was not detected during preflight; continuing and letting build/install wait for it."
fi

if [[ "$SKIP_BUILD" != "1" ]]; then
  xcodebuild \
    -workspace "$WORKSPACE" \
    -scheme "$SCHEME" \
    -configuration "$CONFIGURATION" \
    -destination "id=${UDID}" \
    -derivedDataPath "$BUILD_FOLDER" \
    DEVELOPMENT_TEAM="$TEAM_ID" \
    PRODUCT_BUNDLE_IDENTIFIER="$BUNDLE_ID" \
    -allowProvisioningUpdates
fi

if [[ ! -d "$APP_PATH" ]]; then
  echo "Built app not found: ${APP_PATH}"
  exit 1
fi

LOG_FILE="$(mktemp -t ttzhipin-ios-deploy.XXXXXX.log)"
set +e
"${IOS_DEPLOY[@]}" --id "$UDID" --bundle "$APP_PATH" --justlaunch --noninteractive --no-wifi --timeout "$DEVICE_TIMEOUT" 2>&1 | tee "$LOG_FILE"
DEPLOY_STATUS=${PIPESTATUS[0]}
set -e

if [[ "$DEPLOY_STATUS" -ne 0 ]]; then
  if "${IOS_DEPLOY[@]}" --id "$UDID" --bundle_id "$BUNDLE_ID" --exists --no-wifi --timeout "$PREFLIGHT_TIMEOUT" | tail -n 1 | grep -q '^true$'; then
    echo ""
    echo "Installed, but iPhone blocked auto-launch."
    echo "On the phone, trust the profile: Settings > General > VPN & Device Management > Apple Development."
    exit 0
  fi

  echo "Install failed. ios-deploy log: ${LOG_FILE}"
  exit "$DEPLOY_STATUS"
fi

"${IOS_DEPLOY[@]}" --id "$UDID" --bundle_id "$BUNDLE_ID" --exists --no-wifi --timeout "$PREFLIGHT_TIMEOUT"
echo "Installed and launched: ${BUNDLE_ID}"
