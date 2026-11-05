#!/bin/sh
set -e

echo "Applying database schema..."
npx prisma db push --skip-generate

echo "Seeding initial system administrator and sample configuration..."
node dist/prisma/seed.js || true

echo "Starting CTP SMS Server on port ${PORT:-8000}..."
exec node dist/index.js

