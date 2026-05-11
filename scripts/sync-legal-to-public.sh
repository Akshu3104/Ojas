#!/usr/bin/env bash
#
# sync-legal-to-public.sh
#
# The source of truth for every legal document is the top-level
# `legal/` directory.  The Vite client serves a copy from
# `client/public/legal/` as static assets at `/legal/<slug>` so the
# Trust Centre page can link to them.
#
# Run this whenever the contents of `legal/` change:
#
#     ./scripts/sync-legal-to-public.sh
#
# It is intentionally idempotent and never deletes anything outside
# `client/public/legal/`.

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SRC="$ROOT/legal"
DST="$ROOT/client/public/legal"

if [[ ! -d "$SRC" ]]; then
    echo "error: source directory $SRC does not exist" >&2
    exit 1
fi

mkdir -p "$DST"

# Copy every .md file, preserving timestamps so unchanged files don't churn
cp -p "$SRC"/*.md "$DST/"

# Show what changed
echo "Synced legal docs:"
ls -la "$DST" | tail -n +4
