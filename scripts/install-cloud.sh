#!/usr/bin/env bash

set -euo pipefail

profile="dev"

if [[ "${1:-}" == "release" || "${1:-}" == "dev" ]]; then
  profile="$1"
  shift
fi

if [[ "${1:-}" == "--" ]]; then
  shift
fi

scripts/ensure-pebble-sdk.sh
# Keep the speaker enabled unless the caller explicitly opts into a silent
# development build.
export MARCO_DISABLE_SPEAKER="${MARCO_DISABLE_SPEAKER:-0}"
scripts/build.sh "$profile"

if [[ "$profile" == "dev" ]]; then
  pebble install build/marco-pebble-dev.pbw --cloudpebble "$@"
else
  pebble install build/marco-pebble.pbw --cloudpebble "$@"
fi
