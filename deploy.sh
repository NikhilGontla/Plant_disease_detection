#!/bin/bash
# Plant Disease Labeling Pipeline - AWS Deployment Script
# Requires: AWS CLI configured, Node.js, Amplify CLI installed
# Usage: bash deploy.sh

set -e

echo "=========================================="
echo "Plant Disease Pipeline - AWS Deployment"
echo "=========================================="

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_DIR"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Check prerequisites
echo -e "${BLUE}Step 1: Checking prerequisites...${NC}"
command -v node &> /dev/null || { echo "Node.js not found. Install from https://nodejs.org"; exit 1; }
command -v npm &> /dev/null || { echo "npm not found."; exit 1; }
command -v aws &> /dev/null || { echo "AWS CLI not found. Install from https://aws.amazon.com/cli/"; exit 1; }
command -v amplify &> /dev/null || { echo "Amplify CLI not found. Run: npm install -g @aws-amplify/cli"; exit 1; }
echo -e "${GREEN}✓ All prerequisites met${NC}"

# Step 2: Install dependencies
echo -e "${BLUE}Step 2: Installing npm dependencies...${NC}"
npm install
echo -e "${GREEN}✓ Dependencies installed${NC}"

# Step 3: Amplify initialization
echo -e "${BLUE}Step 3: Initializing Amplify backend...${NC}"
if [ ! -d "amplify/.config" ]; then
  amplify init \
    --amplify '{"projectName":"plantdisease","envName":"prod","defaultEditor":"vscode"}' \
    --frontend '{"frontend":"javascript","framework":"react","config":{"SourceDir":"src","DistributionDir":"build","BuildCommand":"npm run build","StartCommand":"npm start"}}' \
    --providers '{"awscloudformation":{"region":"us-east-1"}}' \
    --yes
else
  echo "Amplify already initialized"
fi
echo -e "${GREEN}✓ Amplify initialized${NC}"

# Step 4: Add Auth (Cognito)
echo -e "${BLUE}Step 4: Adding Cognito authentication...${NC}"
if ! grep -q "amplify add auth" amplify/.config/project-config.json 2>/dev/null; then
  amplify add auth --usernameAttributes email --userVerificationRequired false --yes || true
fi
echo -e "${GREEN}✓ Auth configured${NC}"

# Step 5: Add Storage (S3)
echo -e "${BLUE}Step 5: Adding S3 storage...${NC}"
if ! grep -q "S3" amplify/.config/project-config.json 2>/dev/null; then
  amplify add storage --resourceName plantdiseaseStorage --serviceName S3 --auth --authAccess authReadWrite --yes || true
fi
echo -e "${GREEN}✓ Storage configured${NC}"

# Step 6: Add API (REST)
echo -e "${BLUE}Step 6: Adding REST API...${NC}"
if ! grep -q "api" amplify/.config/project-config.json 2>/dev/null; then
  amplify add api --resourceName plantdiseaseApi --serviceName REST --authorizationType AMAZON_COGNITO_USER_POOLS --yes || true
fi
echo -e "${GREEN}✓ API configured${NC}"

# Step 7: Add Lambda functions
echo -e "${BLUE}Step 7: Adding Lambda functions...${NC}"
for func in uploadHandler validateImageHandler predictHandler saveAnnotationHandler; do
  if [ ! -d "amplify/backend/function/$func" ]; then
    amplify add function --functionName "$func" --runtime nodejs18.x --yes || true
  fi
done
echo -e "${GREEN}✓ Lambda functions added${NC}"

# Step 8: Push to cloud
echo -e "${BLUE}Step 8: Pushing backend to AWS...${NC}"
amplify push --yes
echo -e "${GREEN}✓ Backend deployed${NC}"

# Step 9: Build React app
echo -e "${BLUE}Step 9: Building React app...${NC}"
npm run build
echo -e "${GREEN}✓ React app built${NC}"

# Step 10: Add hosting
echo -e "${BLUE}Step 10: Configuring hosting...${NC}"
if ! grep -q "hosting" amplify/.config/project-config.json 2>/dev/null; then
  amplify add hosting --serviceName CloudFront --yes || true
fi
echo -e "${GREEN}✓ Hosting configured${NC}"

# Step 11: Publish
echo -e "${BLUE}Step 11: Publishing app to CloudFront...${NC}"
amplify publish --yes
echo -e "${GREEN}✓ App published${NC}"

# Step 12: Configure S3 CORS
echo -e "${BLUE}Step 12: Configuring S3 CORS...${NC}"
BUCKET=$(aws s3 ls | grep plantdisease | head -1 | awk '{print $3}')
if [ ! -z "$BUCKET" ]; then
  cat > /tmp/cors.json << 'EOF'
{
  "CORSRules": [
    {
      "AllowedHeaders": ["*"],
      "AllowedMethods": ["GET", "PUT", "POST", "HEAD", "DELETE"],
      "AllowedOrigins": ["*"],
      "ExposeHeaders": ["ETag"],
      "MaxAgeSeconds": 3000
    }
  ]
}
EOF
  aws s3api put-bucket-cors --bucket "$BUCKET" --cors-configuration file:///tmp/cors.json
  echo -e "${GREEN}✓ S3 CORS configured for bucket: $BUCKET${NC}"
else
  echo -e "${YELLOW}⚠ Could not find S3 bucket. Please configure CORS manually.${NC}"
fi

# Step 13: Display deployment info
echo ""
echo -e "${GREEN}=========================================="
echo "✓ DEPLOYMENT COMPLETE"
echo "==========================================${NC}"
echo ""
echo "Your app is live!"
amplify status
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Test locally: npm start"
echo "2. Check Amplify console for hosted URL"
echo "3. Configure SageMaker endpoint name in Lambda env"
echo "4. Push to GitHub: git add . && git commit -m 'Amplify deployment' && git push"
