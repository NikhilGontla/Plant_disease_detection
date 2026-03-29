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

$ProjectDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $ProjectDir

function Ensure-Command([string]$Name) {
    if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
        throw "$Name not found. Please install it first."
    }
}

# Step 1: Check prerequisites
Write-Host "Step 1: Checking prerequisites..." -ForegroundColor Blue
Ensure-Command "node"
Ensure-Command "npm"
Ensure-Command "aws"
Ensure-Command "amplify"
Write-Host "All prerequisites met" -ForegroundColor Green
Write-Host ""

# Step 2: Install dependencies
Write-Host "Step 2: Installing npm dependencies..." -ForegroundColor Blue
npm install
Write-Host "Dependencies installed" -ForegroundColor Green
Write-Host ""

# Step 3: Initialize Amplify if needed
Write-Host "Step 3: Initializing Amplify backend..." -ForegroundColor Blue
if (-not (Test-Path "amplify\.config\project-config.json")) {
    $amplifyConfig = (@{
        projectName   = $ProjectName
        envName       = "prod"
        defaultEditor = "vscode"
    } | ConvertTo-Json -Compress)

    $frontendConfig = (@{
        frontend = "javascript"
        framework = "react"
        config = @{
            SourceDir = "src"
            DistributionDir = "build"
            BuildCommand = "npm run build"
            StartCommand = "npm start"
        }
    } | ConvertTo-Json -Compress -Depth 5)

    $providerConfig = (@{
        awscloudformation = @{ region = $AwsRegion }
    } | ConvertTo-Json -Compress)

    amplify init --amplify $amplifyConfig --frontend $frontendConfig --providers $providerConfig --yes
} else {
    Write-Host "Amplify already initialized"
}
Write-Host "Amplify initialized" -ForegroundColor Green
Write-Host ""

# Step 4-7: Backend resources
Write-Host "Step 4: Ensuring Cognito auth..." -ForegroundColor Blue
if (-not (Test-Path "amplify\backend\auth")) {
    amplify add auth --yes
}
Write-Host "Auth ready" -ForegroundColor Green
Write-Host ""

Write-Host "Step 5: Ensuring S3 storage..." -ForegroundColor Blue
if (-not (Test-Path "amplify\backend\storage")) {
    amplify add storage --yes
}
Write-Host "Storage ready" -ForegroundColor Green
Write-Host ""

Write-Host "Step 6: Ensuring API..." -ForegroundColor Blue
if (-not (Test-Path "amplify\backend\api")) {
    amplify add api --yes
}
Write-Host "API ready" -ForegroundColor Green
Write-Host ""

Write-Host "Step 7: Pushing backend to AWS..." -ForegroundColor Blue
amplify push --yes
Write-Host "Backend deployed" -ForegroundColor Green
Write-Host ""

# Step 8-9: Frontend and hosting
Write-Host "Step 8: Building React app..." -ForegroundColor Blue
npm run build
Write-Host "React app built" -ForegroundColor Green
Write-Host ""

Write-Host "Step 9: Publishing hosting..." -ForegroundColor Blue
amplify publish --yes
Write-Host "Hosting published" -ForegroundColor Green
Write-Host ""

Write-Host "==========================================" -ForegroundColor Green
Write-Host "DEPLOYMENT COMPLETE" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green
Write-Host ""
amplify status
