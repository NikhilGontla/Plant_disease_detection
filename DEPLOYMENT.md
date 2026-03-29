# Plant Disease Pipeline - Complete AWS Deployment Guide

## Prerequisites

- **AWS Account** with credentials configured
- **Node.js** v18+ ([download](https://nodejs.org))
- **AWS CLI** v2 ([install](https://aws.amazon.com/cli/))
- **Amplify CLI** (`npm install -g @aws-amplify/cli`)
- **Git** ([download](https://git-scm.com))

## Quick Start (Automated)

### Windows (PowerShell)
```powershell
cd c:\Users\kollu\nikhil\plantdisease
powershell -ExecutionPolicy Bypass -File deploy.ps1
```

### macOS/Linux (Bash)
```bash
cd plantdisease
chmod +x deploy.sh
bash deploy.sh
```

## Manual Deployment Steps

### 1. Configure AWS Credentials
```bash
aws configure
# Enter your AWS Access Key ID, Secret Access Key, region (us-east-1), output format (json)
```

Verify:
```bash
aws sts get-caller-identity
```

### 2. Initialize Project
```bash
cd c:\Users\kollu\nikhil\plantdisease
npm install
amplify init
```

Interactive prompts:
- Project name: `plantdisease`
- Environment: `prod`
- Editor: `vscode`
- Frontend framework: `javascript` (React)
- Source dir: `src`
- Build command: `npm run build`
- Start command: `npm start`
- AWS region: `us-east-1`

### 3. Add Authentication (Cognito)
```bash
amplify add auth
```

Choose:
- Sign-in method: `Email`
- Password policy: `Default (8 chars, uppercase, lowercase, numbers)`
- MFA: `OFF` (for dev; enable in production)

### 4. Add Storage (S3)
```bash
amplify add storage
```

Choose:
- Service: `S3`
- Access level: `Auth users access`
- Read/write access: `Yes`

### 5. Add API (REST with Lambda)
```bash
amplify add api
```

Choose:
- Service: `REST`
- API name: `plantdiseaseApi`
- Resource path: `/`
- Authorization: `Amazon Cognito User Pools`

### 6. Add Lambda Functions
Create 4 Lambda functions:

```bash
amplify add function
# Function name: uploadHandler
# Runtime: nodejs18.x

amplify add function
# Function name: validateImageHandler
# Runtime: nodejs18.x

amplify add function
# Function name: predictHandler
# Runtime: nodejs18.x

amplify add function
# Function name: saveAnnotationHandler
# Runtime: nodejs18.x
```

### 7. Link API Routes to Lambda Functions

Edit `amplify/backend/api/plantdiseaseApi/routes.json` or use CLI:

```bash
amplify update api
```

Routes should map to:
- `POST /upload` → `uploadHandler`
- `POST /validate-image` → `validateImageHandler`
- `POST /predict` → `predictHandler`
- `POST /save-annotation` → `saveAnnotationHandler`

### 8. Configure Lambda Environment Variables

For each function:

```bash
amplify update function
# Select function
# Add environment variables:
# - SAGEMAKER_ENDPOINT_NAME: <your-sagemaker-endpoint>
# - (others auto-populated from Amplify)
```

### 9. Deploy Backend
```bash
amplify push --yes
```

This will:
- Create Cognito user pool
- Create S3 bucket
- Deploy API Gateway
- Deploy 4 Lambda functions
- Auto-generate `src/aws-exports.js`
- Create CloudFormation stack

### 10. Verify aws-exports.js
Check `src/aws-exports.js` is populated with:
```js
{
  aws_project_region: "us-east-1",
  aws_cognito_region: "us-east-1",
  aws_user_pools_id: "us-east-1_xxxxx",
  aws_user_pools_web_client_id: "xxxxx",
  aws_appsync_graphqlEndpoint: "",
  // ... other config
}
```

### 11. Build React App
```bash
npm run build
```

### 12. Add Hosting (CloudFront + S3)
```bash
amplify add hosting
```

Choose:
- Service: `CloudFront and S3`
- Environment: `PROD`

### 13. Publish Live
```bash
amplify publish
```

Terminal output will show:
```
✓ Hosting environment: <env-name>
✓ Website URL: https://<xxxxx>.cloudfront.net
```

**Save this URL** — it's your live app!

### 14. Configure S3 CORS

Get bucket name:
```bash
amplify status
# Look for storage resource name
```

Apply CORS policy:
```bash
# Windows PowerShell
$bucket = "plantdisease-storage-xxxxx"
$corsConfig = @{
    CORSRules = @(
        @{
            AllowedHeaders = @("*")
            AllowedMethods = @("GET", "PUT", "POST", "HEAD", "DELETE")
            AllowedOrigins = @("https://YOUR_DOMAIN.cloudfront.net")
            ExposeHeaders = @("ETag")
            MaxAgeSeconds = 3000
        }
    )
}
$corsConfig | ConvertTo-Json | Out-File cors.json
aws s3api put-bucket-cors --bucket $bucket --cors-configuration file://cors.json
```

Verify:
```bash
aws s3api get-bucket-cors --bucket $bucket
```

### 15. Configure IAM Permissions

Amplify auto-creates roles, but verify Lambda execution roles have:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject"
      ],
      "Resource": "arn:aws:s3:::plantdisease-*/*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "rekognition:DetectLabels"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "sagemaker:InvokeEndpoint"
      ],
      "Resource": "arn:aws:sagemaker:us-east-1:ACCOUNT_ID:endpoint/plant-disease-*"
    }
  ]
}
```

## Testing

### Local Testing
```bash
npm start
# Opens http://localhost:3000
# Sign up with email/password
# Upload a leaf image
# Validate with Rekognition
# Predict with SageMaker
# Edit and save annotations
```

### API Testing (with Cognito Token)
1. Sign in via UI, grab token from browser DevTools → Application → Cookies
2. Test endpoint:
```bash
curl -X POST https://<api-id>.execute-api.us-east-1.amazonaws.com/prod/upload \
  -H "Authorization: <idToken>" \
  -H "Content-Type: application/json" \
  -d '{"filename":"leaf.jpg","contentType":"image/jpeg"}'
```

### CloudFront Testing
```bash
curl https://<xxxxx>.cloudfront.net/
# Should return React app HTML
```

## Monitoring & Logs

### CloudWatch Logs
```bash
# View Lambda logs
aws logs tail /aws/lambda/uploadHandler --follow
aws logs tail /aws/lambda/validateImageHandler --follow
aws logs tail /aws/lambda/predictHandler --follow
aws logs tail /aws/lambda/saveAnnotationHandler --follow
```

### Amplify Console
1. Go to [AWS Amplify Console](https://console.aws.amazon.com/amplify/)
2. Select your app
3. View deployments, analytics, backend resources

### S3 Bucket Monitoring
```bash
# List uploads
aws s3 ls s3://plantdisease-storage-xxxxx/uploads/

# List annotations
aws s3 ls s3://plantdisease-storage-xxxxx/annotations/
```

## Cleanup (Optional)

### Remove from AWS
```bash
amplify delete
# Confirms deletion of all resources
```

### Remove from GitHub
```bash
git push origin --delete main
# Delete repo in GitHub settings
```

## Troubleshooting

### CORS Errors
- **Issue**: "Access to XMLHttpRequest blocked by CORS"
- **Fix**: Ensure S3 bucket CORS allows your CloudFront domain
```bash
aws s3api get-bucket-cors --bucket <bucket-name>
```

### SageMaker Endpoint Not Found
- **Issue**: Lambda predict fails with "Endpoint not found"
- **Fix**: Set correct endpoint name in Lambda env vars
```bash
amplify update function
# Choose predictHandler
# Update SAGEMAKER_ENDPOINT_NAME
amplify push
```

### Authentication Loop
- **Issue**: Stuck on login page
- **Fix**: Check Cognito user pool is created
```bash
aws cognito-idp list-user-pools --max-results 10
```

### Upload Fails to S3
- **Issue**: "403 Forbidden" on signed URL PUT
- **Fix**: Verify S3 CORS and Lambda S3 permissions
```bash
aws s3api get-bucket-cors --bucket <bucket-name>
amplify status  # Check Lambda execution roles
```

## Production Checklist

- [ ] AWS account with billing alerts enabled
- [ ] Custom domain (not CloudFront domain) via Route 53
- [ ] HTTPS enforced (automatic with CloudFront)
- [ ] WAF rules applied to API Gateway
- [ ] CloudWatch alarms for Lambda errors
- [ ] SNS notifications for failures
- [ ] S3 versioning enabled
- [ ] S3 lifecycle policy for old uploads
- [ ] Backup/disaster recovery plan
- [ ] Cost monitoring enabled
- [ ] SageMaker endpoint auto-scaling configured
- [ ] Cognito password policy hardened
- [ ] MFA enabled for admin accounts
- [ ] CloudTrail enabled for audit logs

## Cost Estimation (Monthly, US-EAST-1)

| Service | Usage | Cost |
|---------|-------|------|
| Lambda | 100K invocations | ~$2 |
| S3 | 10GB stored, 50GB transferred | ~$2 |
| API Gateway | 1M requests | ~$3.50 |
| Cognito | 1K MAU | ~$0.50 |
| CloudFront | 50GB transferred | ~$4 |
| SageMaker | Endpoint runtime (varies) | $5-50+ |
| **Total** | | **~$17-60+** |

*Adjust based on your actual usage*

## Support & Resources

- [AWS Amplify Docs](https://docs.amplify.aws/)
- [AWS Lambda Guide](https://docs.aws.amazon.com/lambda/)
- [Amazon Rekognition](https://docs.aws.amazon.com/rekognition/)
- [Amazon SageMaker](https://docs.aws.amazon.com/sagemaker/)
- [React Documentation](https://react.dev/)
- [Tailwind CSS](https://tailwindcss.com/)

---

**Deployment created on 2026-03-29** 🚀
