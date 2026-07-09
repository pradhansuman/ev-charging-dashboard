#!/bin/bash
# Run this script inside your project root folder to fix Vercel deployment
# Usage: bash fix-vercel.sh

set -e
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "🔧 Applying Vercel fix..."
echo "   Project: $PROJECT_DIR"

# Copy files to correct locations
cp "$SCRIPT_DIR/ev-data.ts" "$PROJECT_DIR/src/lib/ev-data.ts"
cp "$SCRIPT_DIR/stations.json" "$PROJECT_DIR/src/lib/stations.json"
cp "$SCRIPT_DIR/alerts.json" "$PROJECT_DIR/src/lib/alerts.json"
cp "$SCRIPT_DIR/routes.json" "$PROJECT_DIR/src/lib/routes.json"
cp "$SCRIPT_DIR/investments.json" "$PROJECT_DIR/src/lib/investments.json"
cp "$SCRIPT_DIR/deserts.json" "$PROJECT_DIR/src/lib/deserts.json"

cp "$SCRIPT_DIR/stats-route.ts" "$PROJECT_DIR/src/app/api/stats/route.ts"
cp "$SCRIPT_DIR/stations-route.ts" "$PROJECT_DIR/src/app/api/stations/route.ts"
cp "$SCRIPT_DIR/alerts-route.ts" "$PROJECT_DIR/src/app/api/alerts/route.ts"
cp "$SCRIPT_DIR/routes-route.ts" "$PROJECT_DIR/src/app/api/routes/route.ts"
cp "$SCRIPT_DIR/investments-route.ts" "$PROJECT_DIR/src/app/api/investments/route.ts"
cp "$SCRIPT_DIR/deserts-route.ts" "$PROJECT_DIR/src/app/api/deserts/route.ts"

cp "$SCRIPT_DIR/error.tsx" "$PROJECT_DIR/src/app/error.tsx"
cp "$SCRIPT_DIR/next.config.ts" "$PROJECT_DIR/next.config.ts"
cp "$SCRIPT_DIR/vercel.json" "$PROJECT_DIR/vercel.json"

echo ""
echo "✅ All files updated!"
echo ""
echo "Now run:"
echo "   cd $PROJECT_DIR"
echo "   git add -A"
echo '   git commit -m "fix: static data for Vercel deployment"'
echo "   git push"
echo ""
echo "Vercel will auto-redeploy."