#!/usr/bin/env bash

set -euo pipefail

# Keep the speaker switch in the compiler configuration for local development.
if [[ "${MARCO_DISABLE_SPEAKER:-0}" == "1" ]]; then
  CFLAGS="${CFLAGS:-} -DMARCO_DISABLE_SPEAKER"
  export CFLAGS
fi

exec pebble build "$@"
