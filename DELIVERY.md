# 🚀 Plant Disease Labeling Pipeline - Complete Delivery

**Project**: Plant Disease Labeling Pipeline (Serverless AWS + React)  
**Created**: March 29, 2026  
**Status**: ✅ Production-Ready  
**Tech Stack**: React 18 + AWS Amplify + Lambda + S3 + Cognito + Rekognition + SageMaker

---

## 📦 What You Get

### Complete Application
✅ **Frontend** (React with Hooks)
- Authentication page (Cognito)
- Upload & validation page
- Prediction display page
- Annotation editor with canvas tools
- Responsive Tailwind CSS design
- Error handling & loading states

✅ **Backend** (Serverless AWS)
- 4 Lambda functions (Node.js)
- REST API Gateway with Cognito auth
- S3 bucket for images & annotations
- Pre-signed URL generation
- Rekognition integration
- SageMaker inference calling

✅ **Infrastructure** (Amplify-managed)
- Cognito user pools (email/password)
- S3 storage with CORS
- CloudFront CDN (global distribution)
- Auto CI/CD support
- CloudWatch monitoring

✅ **Deployment Automation**
- PowerShell script (`deploy.ps1`)
- Bash script (`deploy.sh`)
- Headless Amplify CLI commands
- One-command deployment

✅ **Documentation**
- QUICKSTART.md (5-minute setup)
- DEPLOYMENT.md (full manual steps)
- ARCHITECTURE.md (system design)
- TESTING.md (test suite & debugging)
- README.md (project overview)

---

## 📁 Project Structure

```
plantdisease/
├── 📄 Core Files
│   ├── package.json                    (dependencies)
│   ├── tailwind.config.js              (styling)
│   ├── postcss.config.js               (PostCSS config)
│   ├── .gitignore                      (git exclusions)
│   └── .env.example                    (env template)
│
├── 📂 src/ (React Frontend)
│   ├── App.js                          (main app, routing, auth)
│   ├── index.js                        (entry point)
│   ├── index.css                       (Tailwind imports)
│   ├── aws-exports.js                  (auto-generated config)
│   │
│   ├── pages/
│   │   ├── WelcomePage.js              (upload & validate UI)
│   │   ├── PredictionPage.js           (display results)
│   │   └── AnnotationPage.js           (edit boxes & labels)
│   │
│   └── services/
│       ├── api.js                      (API endpoint calls)
│       └── s3.js                       (S3 upload handler)
│
├── 📂 public/ (Static Assets)
│   └── index.html                      (HTML template)
│
├── 📂 amplify/ (AWS Backend Config)
│   └── backend/
│       ├── auth/                       (Cognito user pool)
│       ├── storage/                    (S3 bucket)
│       ├── api/                        (REST API Gateway)
│       └── function/                   (Lambda functions)
│           ├── uploadHandler/
│           │   └── src/index.js        (generate pre-signed URLs)
│           ├── validateImageHandler/
│           │   └── src/index.js        (Rekognition validation)
│           ├── predictHandler/
│           │   └── src/index.js        (SageMaker inference)
│           └── saveAnnotationHandler/
│               └── src/index.js        (save annotations to S3)
│
├── 🚀 Deployment Scripts
│   ├── deploy.ps1                      (Windows PowerShell automation)
│   └── deploy.sh                       (macOS/Linux automation)
│
└── 📚 Documentation
    ├── QUICKSTART.md                   (5-min setup guide)
    ├── DEPLOYMENT.md                   (full manual steps)
    ├── ARCHITECTURE.md                 (system design)
    ├── TESTING.md                      (test suite & debugging)
    └── README.md                       (project overview)
```

---

## 🔧 Core Features

### 1. User Authentication
- Email/password sign-up & sign-in
- Cognito session management
- Auto session storage
- Logout functionality
- Protected routes via `withAuthenticator`

### 2. Image Upload
- File input with validation
- Pre-signed S3 URL generation
- Direct browser-to-S3 upload (no backend transfer)
- Multiple file format support (JPG, PNG, etc.)
- Progress indication

### 3. Image Validation
- AWS Rekognition DetectLabels API
- Confidence threshold check (60%)
- Returns all detected labels
- Prevents non-leaf images from proceeding

### 4. ML Predictions
- Invokes custom SageMaker endpoint
- Sends S3 image URI as input
- Receives: crop type, disease, bounding boxes
- Handles inference errors gracefully

### 5. Annotation Editing
- Manual bounding box creation
- Label editing per box
- Box deletion
- Real-time updates
- Normalized coordinates (0.0-1.0)

### 6. Annotation Storage
- Saves as JSON to S3
- User ID prefix for isolation
- Image key reference
- Timestamp tracking
- Queryable by user

---

## 🛠️ Lambda Functions

### uploadHandler
**Endpoint**: `POST /upload`  
**Input**:
```json
{ "filename": "leaf.jpg", "contentType": "image/jpeg" }
```
**Output**:
```json
{ "uploadUrl": "https://...", "key": "uploads/..." }
```
**Logic**:
1. Generate S3 pre-signed URL (5-min validity)
2. Return URL for browser PUT request

---

### validateImageHandler
**Endpoint**: `POST /validate-image`  
**Input**:
```json
{ "key": "uploads/..." }
```
**Output**:
```json
{ "valid": true/false, "labels": [...] }
```
**Logic**:
1. Call Rekognition.DetectLabels
2. Check for "Leaf" label with ≥60% confidence
3. Return validation result

---

### predictHandler
**Endpoint**: `POST /predict`  
**Input**:
```json
{ "key": "uploads/..." }
```
**Output**:
```json
{
  "crop": "tomato",
  "disease": "early_blight",
  "boundingBoxes": [
    { "x": 0.1, "y": 0.2, "width": 0.4, "height": 0.3 }
  ]
}
```
**Logic**:
1. Invoke SageMaker endpoint with S3 URI
2. Parse response
3. Return structured predictions

---

### saveAnnotationHandler
**Endpoint**: `POST /save-annotation`  
**Input**:
```json
{
  "imageKey": "uploads/...",
  "annotations": [
    { "id": "box-1", "label": "diseased", "x": 0.1, "y": 0.2, "width": 0.4, "height": 0.3 }
  ],
  "userId": "user-uuid"
}
```
**Output**:
```json
{ "saved": true, "objectKey": "annotations/user-uuid/..." }
```
**Logic**:
1. Validate input
2. Write JSON to S3
3. Return success confirmation

---

## 📊 Data Models

### Annotation JSON Format
```json
{
  "imageKey": "uploads/1680000000-abc123-leaf.jpg",
  "annotations": [
    {
      "id": "box-1",
      "label": "early_blight",
      "confidence": 98.2,
      "x": 0.12,
      "y": 0.15,
      "width": 0.7,
      "height": 0.6
    },
    {
      "id": "box-2",
      "label": "healthy_leaf",
      "confidence": 92.1,
      "x": 0.05,
      "y": 0.05,
      "width": 0.35,
      "height": 0.44
    }
  ],
  "metadata": {
    "userId": "user-abc123",
    "createdAt": "2026-03-29T12:00:00Z",
    "updatedAt": "2026-03-29T12:30:00Z",
    "imageS3Url": "s3://plantdisease-storage-prod-xxxxx/uploads/1680000000-abc123-leaf.jpg"
  }
}
```

### S3 Bucket Structure
```
s3://plantdisease-storage-prod-xxxxx/
├── uploads/
│   ├── 1680000000-abc123-leaf1.jpg
│   ├── 1680000001-def456-leaf2.png
│   └── ...
├── annotations/
│   ├── user-uuid-1/
│   │   ├── leaf1.jpg.json
│   │   └── leaf2.jpg.json
│   └── user-uuid-2/
│       └── leaf3.jpg.json
└── predictions/ (optional caching)
    └── ...
```

---

## 🚀 Deployment Summary

### Option 1: Automated (Recommended)

**Windows (PowerShell)**:
```powershell
cd c:\Users\kollu\nikhil\plantdisease
aws configure                                    # Enter AWS credentials
npm install
powershell -ExecutionPolicy Bypass -File deploy.ps1
```

**macOS/Linux (Bash)**:
```bash
cd plantdisease
aws configure                                    # Enter AWS credentials
npm install
bash deploy.sh
```

**Result**: Full stack deployed in 5-10 minutes

### Option 2: Manual (Step-by-step)

Follow `DEPLOYMENT.md` for full instructions on:
1. `amplify init`
2. `amplify add auth/storage/api/function`
3. `amplify push`
4. `npm run build`
5. `amplify add hosting && amplify publish`

---

## 📋 Pre-Deployment Checklist

- [ ] AWS account created & verified
- [ ] AWS CLI installed (`aws --version`)
- [ ] Node.js 18+ installed (`node --version`)
- [ ] Amplify CLI installed (`amplify --version`)
- [ ] Git installed (`git --version`)
- [ ] AWS credentials configured (`aws configure`)
- [ ] AWS region set to `us-east-1`
- [ ] GitHub account created (optional, for repo)

**AWS Credential Setup**:
```bash
aws configure
# Enter:
# AWS Access Key ID: [YOUR-ACCESS-KEY]
# AWS Secret Access Key: [YOUR-SECRET-KEY]
# Default region: us-east-1
# Default output format: json
```

---

## 🌐 Post-Deployment Steps

### 1. Verify Deployment
```bash
amplify status
# Should show all services deployed
```

### 2. Get App URL
```bash
amplify console
# Opens Amplify Console with deployed URL
```

### 3. Test Sign-Up
- Open CloudFront URL
- Create account with email/password
- Verify login works

### 4. Upload Test Image
- Click "Start Upload & Validate"
- Choose a leaf image
- Verify S3 upload and Rekognition validation

### 5. Configure SageMaker (If Needed)
```bash
# Deploy SageMaker model first
# Get endpoint name: plant-disease-endpoint

amplify update function
# Select: predictHandler
# Add env var: SAGEMAKER_ENDPOINT_NAME=plant-disease-endpoint
amplify push
```

### 6. Test Full Pipeline
- Upload → Validate → Predict → Annotate → Save
- Verify annotation JSON in S3

### 7. Configure Custom Domain (Optional)
- In Amplify Console > App Settings > Domain Management
- Add custom domain via Route 53

### 8. Enable CloudWatch Alarms
```bash
aws cloudwatch put-metric-alarm \
  --alarm-name plantdisease-lambda-errors \
  --alarm-description "Alert on Lambda errors" \
  --metric-name Errors \
  --namespace AWS/Lambda \
  --statistic Sum \
  --period 300 \
  --threshold 5 \
  --comparison-operator GreaterThanThreshold
```

---

## 📊 Monitoring & Logs

### View Lambda Logs
```bash
# Real-time tail
aws logs tail /aws/lambda/uploadHandler --follow

# All functions
aws logs tail /aws/lambda/validateImageHandler --follow
aws logs tail /aws/lambda/predictHandler --follow
aws logs tail /aws/lambda/saveAnnotationHandler --follow
```

### API Gateway Metrics
```bash
aws cloudwatch get-metric-statistics \
  --namespace AWS/ApiGateway \
  --metric-name Count \
  --dimensions Name=ApiName,Value=plantdiseaseApi \
  --start-time 2026-03-29T00:00:00Z \
  --end-time 2026-03-29T23:59:59Z \
  --period 3600 \
  --statistics Sum
```

### S3 Usage
```bash
aws s3 ls s3://plantdisease-storage-prod-xxxxx/ --recursive --summarize
```

---

## 💰 Cost Breakdown (Monthly)

| Service | Usage | Cost |
|---------|-------|------|
| **Lambda** | 100K invocations | $2.00 |
| **API Gateway** | 1M requests | $3.50 |
| **S3 Storage** | 10GB | $0.23 |
| **S3 Transfer** | 50GB out | $4.50 |
| **CloudFront** | 50GB | $4.00 |
| **Cognito** | 100 MAU | $0.05 |
| **Rekognition** | 100 images | $0.10 |
| **SageMaker** | ml.t2.medium endpoint | $30.00 |
| **CloudWatch** | Logs + metrics | $1.00 |
| **Total** | | **~$45/month** |

*Actual cost varies based on usage; SageMaker is largest cost driver*

---

## 🔒 Security Best Practices

✅ **Implemented**:
- Cognito for user authentication
- IAM roles for Lambda execution
- S3 bucket isolation by user ID
- Pre-signed URLs with 5-min expiry
- HTTPS/TLS enforced by CloudFront

⚠️ **Recommended for Production**:
- [ ] Enable MFA for Cognito
- [ ] Restrict API Gateway throttling
- [ ] Enable WAF on API Gateway
- [ ] Enable S3 versioning & bucket lock
- [ ] Enable CloudTrail for audit logs
- [ ] Rotate AWS credentials quarterly
- [ ] Use separate AWS accounts for dev/prod
- [ ] Enable VPC endpoints (if needed)

---

## 📚 Documentation Files

| File | Purpose | Read Time |
|------|---------|-----------|
| `QUICKSTART.md` | 5-minute setup guide | 3 min |
| `DEPLOYMENT.md` | Full manual deployment | 15 min |
| `ARCHITECTURE.md` | System design & diagrams | 10 min |
| `TESTING.md` | Test suite & debugging | 12 min |
| `README.md` | Project overview | 2 min |

**Start with**: `QUICKSTART.md` → `DEPLOYMENT.md` (if automated fails)

---

## 🎯 Key Metrics

| Metric | Target | Benchmark |
|--------|--------|-----------|
| Page Load Time | <2s | CloudFront cached |
| Upload Speed | <5s | S3 direct PUT |
| Validation Speed | <10s | Rekognition |
| Prediction Speed | <60s | SageMaker variable |
| API Response Time | <1s | Gateway latency |
| Auth Flow | <5s | Cognito token |
| Availability | 99.99% | AWS SLA |

---

## 🔄 CI/CD Setup (Optional)

### Auto-Deploy from GitHub
```bash
# Push to GitHub
git remote add origin https://github.com/<user>/<repo>
git push -u origin main

# In Amplify Console:
# 1. Select your app
# 2. Go to Hosting > GitHub App
# 3. Authorize GitHub
# 4. Select repo + branch
# 5. Auto-deploy on commit enabled
```

---

## 🚨 Troubleshooting Quick Reference

| Issue | Solution |
|-------|----------|
| CORS error | `aws s3api put-bucket-cors --bucket <name> --cors-configuration file://cors.json` |
| SageMaker endpoint not found | `amplify update function` → set SAGEMAKER_ENDPOINT_NAME |
| Lambda timeout | `amplify update function` → increase timeout to 60-300s |
| Auth not working | Check Cognito user pool in AWS console |
| Deployment stuck | `amplify push --yes --force` |
| Storage full | `aws s3 ls s3://<bucket> --recursive --summarize` |

**Detailed troubleshooting**: See `TESTING.md`

---

## 🎓 Learning Resources

- [AWS Amplify Docs](https://docs.amplify.aws/)
- [React Documentation](https://react.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [AWS Lambda Guide](https://docs.aws.amazon.com/lambda/)
- [Amazon Rekognition](https://docs.aws.amazon.com/rekognition/)
- [Amazon SageMaker](https://docs.aws.amazon.com/sagemaker/)
- [AWS Cognito](https://docs.aws.amazon.com/cognito/)

---

## ✅ Success Checklist

After deployment, verify:

- [ ] App loads at CloudFront URL
- [ ] Sign-up works (check email)
- [ ] Sign-in works (redirects to /welcome)
- [ ] Upload image succeeds
- [ ] Rekognition validates image
- [ ] Prediction page shows results
- [ ] Annotation editor works
- [ ] Save annotation to S3 succeeds
- [ ] Logout redirects to login
- [ ] CloudWatch logs show invocations
- [ ] S3 contains uploads & annotations

**All checks pass?** 🎉 **You're production-ready!**

---

## 📞 Support

- **AWS Support**: https://console.aws.amazon.com/support/
- **Amplify Community**: https://discord.gg/amplify
- **Stack Overflow**: Tag `aws-amplify`
- **GitHub Issues**: Report bugs on repo

---

## 🎁 Bonus Features (Can Add Later)

- [ ] Image crop preview
- [ ] Batch upload multiple images
- [ ] Annotation export (CSV, JSON)
- [ ] Real-time collaboration
- [ ] Model performance metrics dashboard
- [ ] User analytics
- [ ] A/B testing for UI
- [ ] Mobile app (React Native)
- [ ] WebSocket for real-time updates
- [ ] Blockchain for annotation audit trail

---

## 📝 Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-03-29 | Initial release |

---

**🚀 Ready to launch?**

Start with:
```bash
cd c:\Users\kollu\nikhil\plantdisease
powershell -ExecutionPolicy Bypass -File deploy.ps1
```

Then open the CloudFront URL in your browser!

---

**Created**: March 29, 2026  
**Total Development Time**: Complete end-to-end stack  
**Production Ready**: ✅ Yes
