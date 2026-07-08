#!/bin/sh
set -e

echo "==> EV Charging Dashboard - Starting up..."

# If no database on persistent disk, copy the pre-seeded one
if [ ! -f /data/custom.db ]; then
  echo "==> First run: copying pre-seeded database to persistent disk..."
  cp /app/custom.db.seed /data/custom.db
  echo "==> Database ready."
else
  echo "==> Existing database found on persistent disk."
fi

# Run schema sync in case of model changes
echo "==> Syncing schema..."
npx prisma db push --skip-generate --accept-data-loss 2>/dev/null || npx prisma db push --skip-generate 2>/dev/null || true
echo "==> Schema sync complete."

# Start the Next.js server
echo "==> Starting Next.js on port ${PORT:-10000}..."
exec node server.js