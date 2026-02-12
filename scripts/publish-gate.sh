#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

echo "🔎 validate:content"
npm run validate:content

echo "🗄️ sync:content:db"
npm run sync:content:db

echo "🏗️ build"
npm run build

echo "✅ publish gate passed (validate + db sync + build)"
