#!/bin/bash
set -e

echo "=== Hotel CMS Deployment ==="
echo ""

# Check if .env.production has been configured
if grep -q "CHANGE_ME" .env.production 2>/dev/null; then
    echo "ERROR: Update .env.production with real values first!"
    echo "  - DB_PASSWORD: Set a strong database password"
    echo "  - OPENROUTER_API_KEY: Your OpenRouter API key"
    exit 1
fi

# Load env
set -a
source .env.production
set +a

echo "1/5  Building Docker images..."
docker compose build

echo "2/5  Starting database..."
docker compose up -d db
sleep 3

echo "3/5  Running database migrations..."
docker compose run --rm app npx prisma migrate deploy

echo "4/5  Starting application..."
docker compose up -d app

echo "5/5  Starting nginx..."
docker compose up -d nginx

echo ""
echo "=== Deployment complete ==="
echo ""
echo "CMS Admin:  http://$(hostname -I | awk '{print $1}'):3000"
echo "Public Site: http://$(hostname -I | awk '{print $1}')"
echo ""
echo "Next steps:"
echo "  1. Point alghanto.com DNS A record to this server's IP"
echo "  2. Run SSL setup: ./setup-ssl.sh alghanto.com"
echo "  3. Register admin account at http://your-ip/register"
echo ""
