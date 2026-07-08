#!/bin/sh
set -e

echo "==> EV Charging Dashboard - Starting up..."

# Ensure db directory exists
mkdir -p /app/db

# If no database exists, copy the pre-seeded one
if [ ! -f /app/db/custom.db ]; then
  echo "==> First run: copying pre-seeded database..."
  cp /app/custom.db.seed /app/db/custom.db
  echo "==> Database ready."
else
  echo "==> Existing database found."
fi

# Start the Next.js server
echo "==> Starting Next.js on port ${PORT:-10000}..."
exec node server.js