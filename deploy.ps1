# Plant Disease Labeling Pipeline - AWS Deployment Script (Windows)
# Requires: AWS CLI configured, Node.js, Amplify CLI installed
# Usage: powershell -ExecutionPolicy Bypass -File deploy.ps1

param(
    [string]$AwsRegion = "us-east-1",
    [string]$ProjectName = "plantdisease"
)

$ErrorActionPreference = "Stop"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Plant Disease Pipeline - AWS Deployment" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

$PROJECT_DIR = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $PROJECT_DIR

# Step 1: Check prerequisites
Write-Host "Step 1: Checking prerequisites..." -ForegroundColor Blue
$prereqs = @("node", "npm", "aws", "amplify")
foreach ($cmd in $prereqs) {
    if (-not (Get-Command $cmd -ErrorAction SilentlyContinue)) {
        Write-Host "❌ $cmd not found. Please install it first." -ForegroundColor Red
        exit 1
    }
}
Write-Host "✓ All prerequisites met" -ForegroundColor Green
Write-Host ""

# Step 2: Install dependencies
Write-Host "Step 2: Installing npm dependencies..." -ForegroundColor Blue
npm install
Write-Host "✓ Dependencies installed" -ForegroundColor Green
Write-Host ""

# Step 3: Amplify initialization
Write-Host "Step 3: Initializing Amplify backend..." -ForegroundColor Blue
if (-not (Test-Path "amplify\.config")) {
    $ampInit = @{
        projectName = $ProjectName
        envName = "prod"
        defaultEditor = "vscode"
        region = $AwsRegion
    }
    amplify init --amplify ($ampInit | ConvertTo-Json) --frontend (ConvertTo-Json @{
        frontend = "javascript"
        framework = "react"
        config = @{
            SourceDir = "src"
            DistributionDir = "build"
            BuildCommand = "npm run build"
            StartCommand = "npm start"
        }
    }) --providers (ConvertTo-Json @{
        awscloudformation = @{ region = $AwsRegion }
    }) --yes
} else {
    Write-Host "Amplify already initialized"
}
Write-Host "✓ Amplify initialized" -ForegroundColor Green
Write-Host ""

# Step 4: Add Auth
Write-Host "Step 4: Adding Cognito authentication..." -ForegroundColor Blue
if (-not (Test-Path "amplify\backend\auth")) {
    amplify add auth --usernameAttributes email --userVerificationRequired false --yes
}
Write-Host "✓ Auth configured" -ForegroundColor Green
Write-Host ""

# Step 5: Add Storage
Write-Host "Step 5: Adding S3 storage..." -ForegroundColor Blue
if (-not (Test-Path "amplify\backend\storage")) {
    amplify add storage --resourceName plantdiseaseStorage --serviceName S3 --auth --authAccess authReadWrite --yes
}
Write-Host "✓ Storage configured" -ForegroundColor Green
Write-Host ""

# Step 6: Add API
Write-Host "Step 6: Adding REST API..." -ForegroundColor Blue
if (-not (Test-Path "amplify\backend\api")) {
    amplify add api --resourceName plantdiseaseApi --serviceName REST --authorizationType AMAZON_COGNITO_USER_POOLS --yes
}
Write-Host "✓ API configured" -ForegroundColor Green
Write-Host ""

# Step 7: Add Lambda functions
Write-Host "Step 7: Adding Lambda functions..." -ForegroundColor Blue
$functions = @("uploadHandler", "validateImageHandler", "predictHandler", "saveAnnotationHandler")
foreach ($func in $functions) {
    if (-not (Test-Path "amplify\backend\function\$func")) {
        amplify add function --functionName $func --runtime nodejs18.x --yes
    }
}
Write-Host "✓ Lambda functions added" -ForegroundColor Green
Write-Host ""

# Step 8: Update aws-exports.js placeholder
Write-Host "Step 8: Preparing configuration..." -ForegroundColor Blue
Write-Host "Note: aws-exports.js will be auto-generated after amplify push" -ForegroundColor Yellow
Write-Host ""

# Step 9: Push to AWS
Write-Host "Step 9: Pushing backend to AWS (this may take 2-5 minutes)..." -ForegroundColor Blue
amplify push --yes
Write-Host "✓ Backend deployed" -ForegroundColor Green
Write-Host ""

# Step 10: Build React
Write-Host "Step 10: Building React app..." -ForegroundColor Blue
npm run build
Write-Host "✓ React app built" -ForegroundColor Green
Write-Host ""

# Step 11: Add Hosting
Write-Host "Step 11: Configuring CloudFront hosting..." -ForegroundColor Blue
if (-not (Test-Path "amplify\backend\hosting")) {
    amplify add hosting --serviceName CloudFront --yes
}
Write-Host "✓ Hosting configured" -ForegroundColor Green
Write-Host ""

# Step 12: Publish
Write-Host "Step 12: Publishing to CloudFront..." -ForegroundColor Blue
amplify publish --yes
Write-Host "✓ App published" -ForegroundColor Green
Write-Host ""

# Step 13: Configure S3 CORS
Write-Host "Step 13: Configuring S3 CORS..." -ForegroundColor Blue
try {
    $buckets = aws s3 ls --query "Buckets[?contains(Name, 'plantdisease')].Name" --output text
    if ($buckets) {
        $bucket = $buckets.Split()[0]
        $corsConfig = @{
            CORSRules = @(
                @{
                    AllowedHeaders = @("*")
                    AllowedMethods = @("GET", "PUT", "POST", "HEAD", "DELETE")
                    AllowedOrigins = @("*")
                    ExposeHeaders = @("ETag")
                    MaxAgeSeconds = 3000
                }
            )
        } | ConvertTo-Json

        $corsConfig | Out-File -FilePath "$env:TEMP\cors.json" -Encoding UTF8
        aws s3api put-bucket-cors --bucket $bucket --cors-configuration (Get-Content "$env:TEMP\cors.json" -Raw)
        Write-Host "✓ S3 CORS configured for bucket: $bucket" -ForegroundColor Green
    } else {
        Write-Host "⚠ Could not auto-locate S3 bucket. Configure manually if needed." -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠ Could not configure CORS automatically: $_" -ForegroundColor Yellow
}
Write-Host ""

# Final summary
Write-Host "==========================================" -ForegroundColor Green
Write-Host "✓ DEPLOYMENT COMPLETE" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green
Write-Host ""

Write-Host "Deployment Summary:" -ForegroundColor Yellow
amplify status
Write-Host ""

Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "1. Test locally: npm start"
Write-Host "2. Open Amplify Console to get hosted URL"
Write-Host "3. Set SAGEMAKER_ENDPOINT_NAME env var in Lambda functions"
Write-Host "4. Push to GitHub:"
Write-Host "   git add . && git commit -m 'Amplify deployment' && git push"
Write-Host ""
Write-Host "App is ready for production! 🚀" -ForegroundColor Green
