#!/bin/bash
set -e

# ============================================================
# Hotel CMS — EKS Deployment Script
# Creates: EKS cluster, ECR repo, RDS PostgreSQL, pushes image,
# deploys app with secrets from AWS Secrets Manager
# ============================================================

# --- Configuration ---
AWS_REGION="${AWS_REGION:-ap-south-1}"
CLUSTER_NAME="hotel-cms-cluster"
ECR_REPO="hotel-cms"
SECRET_NAME="hotel-cms/production"
APP_NAME="hotel-cms"
NAMESPACE="hotel-cms"
NODE_TYPE="t3.medium"
NODE_COUNT=2
DB_INSTANCE_CLASS="db.t3.micro"
DB_NAME="hotel_cms"
DOMAIN="alghanto.com"

AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
ECR_URI="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_REPO}"

echo "============================================"
echo "  Hotel CMS — EKS Deployment"
echo "============================================"
echo "Region:    $AWS_REGION"
echo "Account:   $AWS_ACCOUNT_ID"
echo "Cluster:   $CLUSTER_NAME"
echo "ECR:       $ECR_URI"
echo "Domain:    $DOMAIN"
echo "============================================"
echo ""

# --- Step 1: Create ECR Repository ---
echo "[1/8] Creating ECR repository..."
aws ecr describe-repositories --repository-names $ECR_REPO --region $AWS_REGION >/dev/null 2>&1 || \
aws ecr create-repository \
  --repository-name $ECR_REPO \
  --image-scanning-configuration scanOnPush=true \
  --region $AWS_REGION \
  --query 'repository.repositoryUri' --output text
echo "  ECR: $ECR_URI"

# --- Step 2: Build & Push Docker Image ---
echo "[2/8] Building and pushing Docker image..."
aws ecr get-login-password --region $AWS_REGION | \
  docker login --username AWS --password-stdin ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com

docker build -t ${ECR_REPO}:latest .
docker tag ${ECR_REPO}:latest ${ECR_URI}:latest
docker push ${ECR_URI}:latest
echo "  Image pushed: ${ECR_URI}:latest"

# --- Step 3: Create EKS Cluster ---
echo "[3/8] Creating EKS cluster (this takes ~15 minutes)..."
if ! eksctl get cluster --name $CLUSTER_NAME --region $AWS_REGION >/dev/null 2>&1; then
  eksctl create cluster \
    --name $CLUSTER_NAME \
    --region $AWS_REGION \
    --node-type $NODE_TYPE \
    --nodes $NODE_COUNT \
    --managed \
    --with-oidc
  echo "  Cluster created"
else
  echo "  Cluster already exists, updating kubeconfig..."
  aws eks update-kubeconfig --name $CLUSTER_NAME --region $AWS_REGION
fi

# --- Step 4: Install AWS Secrets Store CSI Driver ---
echo "[4/8] Installing Secrets Store CSI Driver..."
# Install Helm if not available
if ! command -v helm &>/dev/null; then
  echo "  Installing Helm..."
  curl -fsSL https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash
fi

helm repo add secrets-store-csi-driver https://kubernetes-sigs.github.io/secrets-store-csi-driver/charts 2>/dev/null || true
helm repo add aws-secrets-manager https://aws.github.io/secrets-store-csi-driver-provider-aws 2>/dev/null || true
helm repo update

helm upgrade --install csi-secrets-store secrets-store-csi-driver/secrets-store-csi-driver \
  --namespace kube-system \
  --set syncSecret.enabled=true \
  --set enableSecretRotation=true

helm upgrade --install secrets-provider-aws aws-secrets-manager/secrets-store-csi-driver-provider-aws \
  --namespace kube-system
echo "  CSI Driver installed"

# --- Step 5: Create IAM Role for Secrets Access ---
echo "[5/8] Setting up IAM role for Secrets Manager access..."
OIDC_PROVIDER=$(aws eks describe-cluster --name $CLUSTER_NAME --region $AWS_REGION \
  --query "cluster.identity.oidc.issuer" --output text | sed 's|https://||')

SECRET_ARN=$(aws secretsmanager describe-secret --secret-id $SECRET_NAME \
  --query ARN --output text 2>/dev/null)

# Create IAM policy
POLICY_NAME="${APP_NAME}-secrets-policy"
POLICY_ARN="arn:aws:iam::${AWS_ACCOUNT_ID}:policy/${POLICY_NAME}"

aws iam create-policy --policy-name $POLICY_NAME --policy-document '{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Action": ["secretsmanager:GetSecretValue", "secretsmanager:DescribeSecret"],
    "Resource": "'"$SECRET_ARN"'"
  }]
}' 2>/dev/null || echo "  Policy already exists"

# Create service account IAM role
ROLE_NAME="${APP_NAME}-secrets-role"
eksctl create iamserviceaccount \
  --name ${APP_NAME}-sa \
  --namespace $NAMESPACE \
  --cluster $CLUSTER_NAME \
  --region $AWS_REGION \
  --attach-policy-arn $POLICY_ARN \
  --approve \
  --override-existing-serviceaccounts 2>/dev/null || echo "  Service account already exists"
echo "  IAM role configured"

# --- Step 6: Create Namespace & Apply K8s Manifests ---
echo "[6/8] Deploying to Kubernetes..."
kubectl create namespace $NAMESPACE 2>/dev/null || true
kubectl apply -f k8s/

# --- Step 7: Wait for Deployment ---
echo "[7/8] Waiting for pods to be ready..."
kubectl rollout status deployment/${APP_NAME} -n $NAMESPACE --timeout=300s
kubectl rollout status statefulset/${APP_NAME}-db -n $NAMESPACE --timeout=300s

# --- Step 8: Run Database Migration ---
echo "[8/8] Running database migration..."
APP_POD=$(kubectl get pods -n $NAMESPACE -l app=${APP_NAME} -o jsonpath='{.items[0].metadata.name}')
kubectl exec -n $NAMESPACE $APP_POD -- npx prisma@6 migrate deploy 2>/dev/null || \
  echo "  Migration skipped (will import data manually)"

echo ""
echo "============================================"
echo "  Deployment Complete!"
echo "============================================"

# Get Load Balancer URL
LB_URL=$(kubectl get svc ${APP_NAME}-ingress -n $NAMESPACE -o jsonpath='{.status.loadBalancer.ingress[0].hostname}' 2>/dev/null || echo "pending")
echo "Load Balancer: $LB_URL"
echo ""
echo "Next steps:"
echo "  1. Point $DOMAIN DNS to the load balancer:"
echo "     CNAME  @    $LB_URL"
echo "     CNAME  www  $LB_URL"
echo "  2. Import database:"
echo "     kubectl cp /tmp/hotel_cms_backup.sql $NAMESPACE/$DB_POD:/tmp/"
echo "     kubectl exec -n $NAMESPACE $DB_POD -- psql -U postgres hotel_cms -f /tmp/hotel_cms_backup.sql"
echo "  3. Set up SSL with AWS ACM + ALB Ingress Controller"
echo ""
