#!/bin/sh
# fetch-secrets.sh
# Fetches ALCMS_* secrets from AWS Secrets Manager and maps them
# to the env vars the app expects (DATABASE_URL, OPENROUTER_API_KEY)
#
# Secret keys in AWS Secrets Manager:
#   ALCMS_DATABASE_URL     → DATABASE_URL
#   ALCMS_OPENROUTER_API_KEY → OPENROUTER_API_KEY
#   ALCMS_DB_PASSWORD      → DB_PASSWORD

set -e

SECRET_NAME="${SECRET_NAME:-hotel-cms/production}"
AWS_REGION="${AWS_REGION:-ap-south-1}"
ENV_FILE="${ENV_FILE:-/shared/env}"

echo "[fetch-secrets] Fetching from: $SECRET_NAME ($AWS_REGION)"

SECRET_JSON=$(aws secretsmanager get-secret-value \
  --secret-id "$SECRET_NAME" \
  --region "$AWS_REGION" \
  --query SecretString --output text)

if [ -z "$SECRET_JSON" ]; then
  echo "[fetch-secrets] ERROR: Empty secret response"
  exit 1
fi

mkdir -p "$(dirname "$ENV_FILE")"

# Map ALCMS_ prefixed secrets → app env vars
echo "export DATABASE_URL=\"$(echo $SECRET_JSON | python3 -c "import sys,json;print(json.load(sys.stdin)['ALCMS_DATABASE_URL'])")\"" > "$ENV_FILE"
echo "export OPENROUTER_API_KEY=\"$(echo $SECRET_JSON | python3 -c "import sys,json;print(json.load(sys.stdin)['ALCMS_OPENROUTER_API_KEY'])")\"" >> "$ENV_FILE"
echo "export DB_PASSWORD=\"$(echo $SECRET_JSON | python3 -c "import sys,json;print(json.load(sys.stdin)['ALCMS_DB_PASSWORD'])")\"" >> "$ENV_FILE"

echo "[fetch-secrets] Loaded 3 secrets (ALCMS_* → app env vars)"

# Entrypoint mode: source and exec
if [ $# -gt 0 ]; then
  . "$ENV_FILE"
  exec "$@"
fi
