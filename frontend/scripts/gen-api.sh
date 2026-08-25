#!/usr/bin/env bash
# Regenerate the frontend's API types from the Django OpenAPI schema.
#
# This is the whole backend->frontend contract: Django models -> DRF serializers
# -> openapi.json -> schema.d.ts. Never hand-write an API type; run this instead.
#
#   pnpm run gen:api
#
# CI runs the same script and fails if the committed output differs, so the two
# halves of the app cannot silently drift apart.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
SCHEMA="$ROOT/frontend/src/api/openapi.json"
TYPES="$ROOT/frontend/src/api/schema.d.ts"

echo "→ generating OpenAPI schema from Django"
(cd "$ROOT/backend" && uv run python manage.py spectacular --format openapi-json --file "$SCHEMA" --fail-on-warn)

echo "→ generating TypeScript types"
(cd "$ROOT/frontend" && pnpm exec openapi-typescript "$SCHEMA" -o "$TYPES")

echo "✓ $(basename "$SCHEMA") and $(basename "$TYPES") are up to date"
