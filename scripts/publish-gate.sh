#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

echo "🔎 validate:content:db"
node scripts/validate-content-db.mjs

echo "🏗️ build"
npm run build

echo "✅ publish gate passed (DB validate + build)"
