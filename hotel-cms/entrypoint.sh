#!/bin/sh
set -e

echo "[entrypoint] Running database migrations..."
npx prisma migrate deploy 2>/dev/null || echo "[entrypoint] Migration skipped (may need prisma config)"

echo "[entrypoint] Starting server..."
exec node server.js
