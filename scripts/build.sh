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

node scripts/prepare-package.js "$profile"

package_backup="$(mktemp "${TMPDIR:-/tmp}/marco-pebble-package.XXXXXX")"
cp package.json "$package_backup"

restore_package() {
  cp "$package_backup" package.json
  rm -f "$package_backup"
}
trap restore_package EXIT

# Moddable generates the watch bytecode as part of the Pebble build. Cleaning
# first ensures Waf cannot reuse a resource pack from an earlier source tree.
pebble clean
npm install --ignore-scripts --no-audit --no-fund
tsc -p tsconfig.pkjs.json
pebble build "$@"
node scripts/generate-typescript-config.js

if [[ "$profile" == "dev" ]]; then
  cp build/marco-pebble.pbw build/marco-pebble-dev.pbw
fi
