#!/usr/bin/env bash
set -euo pipefail

MODE="${1:-release}"
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

UDID="${IOS_DEVICE_UDID:-}"
TEAM_ID="${IOS_DEVELOPMENT_TEAM:-}"
BUNDLE_ID="${IOS_BUNDLE_ID:-com.limei.ttzhipinapp}"
SCHEME="${IOS_SCHEME:-ttZhipinApp}"
WORKSPACE="${IOS_WORKSPACE:-ios/ttZhipinApp.xcworkspace}"

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

if [[ -z "$UDID" ]]; then
  echo "Set IOS_DEVICE_UDID to the target iPhone UDID."
  exit 1
fi

if [[ "$SKIP_BUILD" != "1" && -z "$TEAM_ID" ]]; then
  echo "Set IOS_DEVELOPMENT_TEAM to your Apple development team id."
  exit 1
fi

if ! command -v ios-deploy >/dev/null 2>&1; then
  echo "ios-deploy was not found. Install it or keep /tmp/ttzhipin-tools/node_modules/.bin available."
  exit 1
fi

echo "Device: ${UDID}"
echo "Mode: ${CONFIGURATION}"
echo "Bundle ID: ${BUNDLE_ID}"
echo "Build folder: ${BUILD_FOLDER}"

ios-deploy --id "$UDID" --detect >/dev/null

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
ios-deploy --id "$UDID" --bundle "$APP_PATH" --justlaunch 2>&1 | tee "$LOG_FILE"
DEPLOY_STATUS=${PIPESTATUS[0]}
set -e

if [[ "$DEPLOY_STATUS" -ne 0 ]]; then
  if ios-deploy --id "$UDID" --bundle_id "$BUNDLE_ID" --exists | tail -n 1 | grep -q '^true$'; then
    echo ""
    echo "Installed, but iPhone blocked auto-launch."
    echo "On the phone, trust the profile: Settings > General > VPN & Device Management > Apple Development."
    exit 0
  fi

  echo "Install failed. ios-deploy log: ${LOG_FILE}"
  exit "$DEPLOY_STATUS"
fi

ios-deploy --id "$UDID" --bundle_id "$BUNDLE_ID" --exists
echo "Installed and launched: ${BUNDLE_ID}"
