#!/usr/bin/env bash

set -euo pipefail

profile="release"
if [[ "${1:-}" == "dev" || "${1:-}" == "release" ]]; then
  profile="$1"
  shift
fi

# Keep the speaker switch in the compiler configuration for local development.
if [[ "${MARCO_DISABLE_SPEAKER:-0}" == "1" ]]; then
  CFLAGS="${CFLAGS:-} -DMARCO_DISABLE_SPEAKER"
  export CFLAGS
fi

package_backup="$(mktemp "${TMPDIR:-/tmp}/marco-pebble-package.XXXXXX")"
cp package.json "$package_backup"

restore_package() {
  cp "$package_backup" package.json
  rm -f "$package_backup"
}
trap restore_package EXIT

run_pebble_build() {
  local build_log
  build_log="$(mktemp "${TMPDIR:-/tmp}/marco-pebble-build.XXXXXX")"

  if pebble build "$@" 2>&1 | tee "$build_log"; then
    rm -f "$build_log"
    return 0
  fi

  if ! grep -q "resource_ids.auto.h" "$build_log"; then
    rm -f "$build_log"
    return 1
  fi

  rm -f "$build_log"
  echo "Retrying Pebble build after SDK resource header bootstrap."
  pebble build "$@"
}

node scripts/prepare-package.js "$profile"
npm install --ignore-scripts --no-audit --no-fund
tsc -p tsconfig.pkjs.json
run_pebble_build "$@"
node scripts/generate-typescript-config.js

if [[ "$profile" == "dev" ]]; then
  cp build/marco-pebble.pbw build/marco-pebble-dev.pbw
fi
