#!/bin/sh
# fetch-secrets.sh
# Fetches secrets from AWS Secrets Manager and writes them as env vars
# Used as an init-container or entrypoint wrapper in K8s pods
#
# Prerequisites:
#   - Pod's service account must have IAM role with secretsmanager:GetSecretValue
#   - AWS region set via AWS_REGION env var
#
# Usage in Dockerfile entrypoint:
#   ENTRYPOINT ["./fetch-secrets.sh", "node", "server.js"]
#
# Usage as K8s init-container:
#   Writes /shared/env to a shared volume, main container sources it

set -e

SECRET_NAME="${SECRET_NAME:-hotel-cms/production}"
AWS_REGION="${AWS_REGION:-ap-south-1}"
ENV_FILE="${ENV_FILE:-/shared/env}"

echo "[fetch-secrets] Fetching from: $SECRET_NAME ($AWS_REGION)"

# Fetch secret JSON from AWS Secrets Manager
SECRET_JSON=$(aws secretsmanager get-secret-value \
  --secret-id "$SECRET_NAME" \
  --region "$AWS_REGION" \
  --query SecretString \
  --output text)

if [ -z "$SECRET_JSON" ]; then
  echo "[fetch-secrets] ERROR: Empty secret response"
  exit 1
fi

# Parse JSON keys and export as env vars
# Writes to ENV_FILE for init-container mode, or exports for entrypoint mode
mkdir -p "$(dirname "$ENV_FILE")"
echo "" > "$ENV_FILE"

for key in $(echo "$SECRET_JSON" | python3 -c "import sys,json; print(' '.join(json.load(sys.stdin).keys()))"); do
  value=$(echo "$SECRET_JSON" | python3 -c "import sys,json; print(json.load(sys.stdin)['$key'])")
  echo "export ${key}=\"${value}\"" >> "$ENV_FILE"
  export "${key}=${value}"
done

echo "[fetch-secrets] Loaded $(wc -l < "$ENV_FILE") secrets"

# If arguments passed, source env and exec them (entrypoint mode)
if [ $# -gt 0 ]; then
  exec "$@"
fi
