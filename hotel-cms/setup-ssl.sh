#!/bin/bash
set -e

DOMAIN=${1:-alghanto.com}
EMAIL=${2:-admin@$DOMAIN}

echo "=== Setting up SSL for $DOMAIN ==="

# Install certbot if not present
if ! command -v certbot &> /dev/null; then
    echo "Installing certbot..."
    sudo apt-get update && sudo apt-get install -y certbot
fi

# Stop nginx temporarily
docker compose stop nginx

# Get certificate
sudo certbot certonly --standalone \
    -d "$DOMAIN" \
    -d "www.$DOMAIN" \
    --email "$EMAIL" \
    --agree-tos \
    --non-interactive

# Copy certs to nginx volume
mkdir -p nginx/certs
sudo cp /etc/letsencrypt/live/$DOMAIN/fullchain.pem nginx/certs/
sudo cp /etc/letsencrypt/live/$DOMAIN/privkey.pem nginx/certs/
sudo chmod 644 nginx/certs/*.pem

# Restart nginx with SSL
docker compose up -d nginx

echo ""
echo "=== SSL configured ==="
echo "Site live at: https://$DOMAIN"
echo ""
echo "Auto-renewal: add this to crontab (crontab -e):"
echo "0 3 1 */2 * certbot renew --post-hook 'cd $(pwd) && cp /etc/letsencrypt/live/$DOMAIN/*.pem nginx/certs/ && docker compose restart nginx'"
