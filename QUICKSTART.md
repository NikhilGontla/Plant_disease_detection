# Plant Disease Pipeline - Quick Start Guide

## ⚡ 5-Minute Setup (Automated)

### On Windows (PowerShell)
```powershell
cd c:\Users\kollu\nikhil\plantdisease

# Configure AWS credentials first
aws configure
# Enter: Access Key ID, Secret Access Key, region: us-east-1, output: json

# Install dependencies
npm install

# Run automated deployment
powershell -ExecutionPolicy Bypass -File deploy.ps1
```

### On macOS/Linux (Bash)
```bash
cd plantdisease

# Configure AWS
aws configure
# us-east-1, json

# Install
npm install

# Deploy
chmod +x deploy.sh
bash deploy.sh
```

## 📋 What Happens During Deployment

1. ✓ Checks Node.js, npm, AWS CLI, Amplify CLI
2. ✓ Installs npm dependencies
3. ✓ Initializes Amplify project
4. ✓ Adds Cognito authentication (email/password)
5. ✓ Adds S3 storage bucket
6. ✓ Adds REST API with Gateway
7. ✓ Creates 4 Lambda functions
8. ✓ Pushes backend to AWS CloudFormation
9. ✓ Builds React app
10. ✓ Adds CloudFront hosting
11. ✓ Publishes live to web
12. ✓ Configures S3 CORS

**Total time**: 5-10 minutes (first run)

## 🌐 Access Your App

After deployment completes:

1. Terminal shows CloudFront URL
   ```
   Hosting environment: ...
   Website URL: https://xxxxx.cloudfront.net
   ```

2. Open URL in browser
   
3. Sign up with any email/password
   
4. Upload a leaf image

5. Watch predictions in real-time

## 🔧 Manual Steps (If Automated Script Fails)

### Step 1: Initialize
```bash
amplify init
# Project: plantdisease
# Environment: prod
# Framework: react
# Region: us-east-1
```

### Step 2: Add Services
```bash
amplify add auth
amplify add storage
amplify add api
amplify add function  # (4 times: uploadHandler, validateImageHandler, etc)
```

### Step 3: Deploy
```bash
amplify push --yes
npm run build
amplify add hosting
amplify publish
```

### Step 4: Configure SageMaker (Optional)
```bash
amplify update function
# Select: predictHandler
# Add env var: SAGEMAKER_ENDPOINT_NAME = <your-endpoint>
amplify push
```

## 🧪 Test Locally

```bash
npm start
# Opens http://localhost:3000
# Hot-reload enabled
```

Features to test:
- Sign up → Check email
- Sign in with credentials
- Upload image → See validation
- View predictions
- Edit bounding boxes
- Save annotations

## 📦 Project Structure

```
plantdisease/
├── amplify/
│   └── backend/
│       ├── auth/              (Cognito config)
│       ├── storage/           (S3 bucket config)
│       ├── api/               (API Gateway config)
│       └── function/          (Lambda functions)
├── src/
│   ├── components/            (Reusable UI parts)
│   ├── pages/
│   │   ├── WelcomePage.js     (Upload interface)
│   │   ├── PredictionPage.js  (Display results)
│   │   └── AnnotationPage.js  (Edit predictions)
│   ├── services/
│   │   ├── api.js             (API calls)
│   │   └── s3.js              (S3 upload)
│   ├── App.js                 (Main app + routing)
│   ├── index.js               (Entry point)
│   └── aws-exports.js         (Auto-generated AWS config)
├── public/
│   └── index.html
├── package.json
├── tailwind.config.js         (Styling)
├── deploy.sh / deploy.ps1     (Automation)
├── DEPLOYMENT.md              (Full deployment steps)
├── ARCHITECTURE.md            (System design)
├── TESTING.md                 (Testing guide)
└── README.md

```

## 🔑 Environment Variables

Auto-managed by Amplify, but critical ones:

**Lambda Functions**:
- `STORAGE_PLANTDISEASESTORAGE_BUCKET` (S3 bucket name)
- `SAGEMAKER_ENDPOINT_NAME` (for predictHandler)
- `AWS_REGION` (default: us-east-1)

**React App**:
- `aws-exports.js` (auto-generated after `amplify push`)

**AWS CLI**:
```bash
aws configure
# Stores in ~/.aws/credentials & ~/.aws/config
```

## 🔐 Security Quick Notes

✓ **Do**:
- Keep AWS credentials in `~/.aws/` (never in code)
- Use Cognito for user auth
- Enable MFA for production
- Rotate credentials quarterly
- Use separate AWS accounts for dev/prod

✗ **Don't**:
- Commit `aws-exports.js` if it has secrets
- Use root AWS account
- Share credentials in chat
- Hardcode API keys in React code

## 📊 Cost Estimate (Monthly)

| Service | Cost |
|---------|------|
| Lambda + API Gateway | ~$5.50 |
| S3 (10GB) | ~$0.23 |
| CloudFront (50GB) | ~$4.00 |
| Cognito (100 users) | ~$0.05 |
| Rekognition (100 images) | ~$0.10 |
| SageMaker endpoint (ml.t2.medium) | ~$30.00 |
| **Total** | **~$40/month** |

*Actual cost varies; SageMaker is the biggest cost driver*

## 🐛 Troubleshooting

### "amplify not found"
```bash
npm install -g @aws-amplify/cli
```

### "aws: command not found"
Download [AWS CLI](https://aws.amazon.com/cli/)

### "CORS error on image upload"
```bash
# Configure S3 CORS
aws s3api put-bucket-cors --bucket <bucket-name> \
  --cors-configuration '{
    "CORSRules": [{
      "AllowedHeaders": ["*"],
      "AllowedMethods": ["GET", "PUT", "POST"],
      "AllowedOrigins": ["https://xxxxx.cloudfront.net"],
      "MaxAgeSeconds": 3000
    }]
  }'
```

### "SageMaker endpoint not found"
```bash
# List endpoints
aws sagemaker list-endpoints

# Update Lambda
amplify update function
# Choose: predictHandler
# Set: SAGEMAKER_ENDPOINT_NAME
amplify push
```

### "npm start fails"
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
npm start
```

## 📞 Support Resources

| Topic | Link |
|-------|------|
| AWS Amplify Docs | https://docs.amplify.aws/ |
| AWS Lambda | https://docs.aws.amazon.com/lambda/ |
| React | https://react.dev/ |
| Tailwind CSS | https://tailwindcss.com/ |
| SageMaker | https://docs.aws.amazon.com/sagemaker/ |
| Rekognition | https://docs.aws.amazon.com/rekognition/ |

## 🚀 Next Steps

1. **Run deployment** (5-10 min)
   ```bash
   powershell -ExecutionPolicy Bypass -File deploy.ps1  # Windows
   bash deploy.sh  # macOS/Linux
   ```

2. **Wait for completion**
   - CloudFormation stack creation
   - Lambda packaging
   - CloudFront propagation

3. **Open deployed URL**
   - Check terminal output for CloudFront domain
   - Test sign-up and upload

4. **Configure SageMaker** (if using ML predictions)
   - Deploy your model to SageMaker endpoint
   - Get endpoint name
   - Update `predictHandler` env var
   - Redeploy: `amplify push`

5. **Custom domain** (optional)
   ```bash
   # In Amplify Console > App Settings > Domain Management
   # Add custom domain via Route 53
   ```

6. **Enable CI/CD** (optional)
   ```bash
   # Push to GitHub
   git remote add origin https://github.com/<user>/<repo>
   git push -u origin main
   
   # Connect in Amplify Console
   # Enable auto-deploy on commits
   ```

7. **Monitor & Scale**
   - CloudWatch Logs: `aws logs tail /aws/lambda/<function> --follow`
   - Amplify Console: Real-time analytics
   - Cost monitoring: AWS Billing Dashboard

---

## 📝 Key Files to Know

| File | Purpose |
|------|---------|
| `src/App.js` | Main app, routes, auth guard |
| `src/pages/*.js` | 3 pages: Welcome, Prediction, Annotation |
| `src/services/api.js` | API endpoint calls |
| `src/services/s3.js` | S3 signed upload |
| `amplify/backend/function/*/src/index.js` | 4 Lambda handlers |
| `aws-exports.js` | Cognito + API config (auto-generated) |
| `tailwind.config.js` | Styling system |
| `DEPLOYMENT.md` | Full manual steps |
| `ARCHITECTURE.md` | System design & data flow |
| `TESTING.md` | How to test the app |

---

## 🎯 Success Criteria

✓ App deployed successfully
- [ ] CloudFront URL accessible
- [ ] Sign-up works
- [ ] Can upload images
- [ ] Rekognition validates images
- [ ] Predictions display
- [ ] Annotations saved to S3
- [ ] All 4 Lambda functions invoked successfully

**You're production-ready!** 🚀

---

**Created**: March 29, 2026  
**Last Updated**: March 29, 2026  
**Version**: 1.0
