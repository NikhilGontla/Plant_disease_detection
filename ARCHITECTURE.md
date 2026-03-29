# Plant Disease Pipeline - AWS Architecture

## High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          CloudFront (CDN)                               │
│                    https://xxxxx.cloudfront.net                         │
└─────────────────────────┬───────────────────────────────────────────────┘
                          │
        ┌─────────────────┼─────────────────┐
        │                 │                 │
        ▼                 ▼                 ▼
   ┌──────────┐    ┌──────────┐     ┌─────────────┐
   │   S3     │    │  React   │     │   Route 53  │
   │ (Build)  │    │   App    │     │  (Domain)   │
   └──────────┘    └──────────┘     └─────────────┘
                         │
        ┌────────────────┴────────────────┐
        │                                 │
        ▼                                 ▼
   ┌──────────────┐            ┌──────────────────┐
   │   Cognito    │            │  API Gateway     │
   │ (Auth)       │            │  (REST API)      │
   └──────────────┘            └────────┬─────────┘
                                        │
        ┌───────────────────────────────┼───────────────────────────────┐
        │                               │                               │
        ▼                               ▼                               ▼
   ┌──────────────┐          ┌────────────────────┐          ┌────────────────────┐
   │   Lambda     │          │   Lambda           │          │   Lambda           │
   │ uploadHandler│          │ validateImageHandler│          │ predictHandler     │
   └──────┬───────┘          └──────┬─────────────┘          └───────┬────────────┘
          │                         │                                │
          │                         ▼                                ▼
          │                   ┌──────────────┐           ┌───────────────────┐
          │                   │ Rekognition  │           │  SageMaker        │
          │                   │ (Image Label)│           │  Endpoint         │
          │                   └──────────────┘           │  (ML Predictions) │
          │                                              └───────────────────┘
          └──────────────────────┬───────────────────────────────────┘
                                 │
                                 ▼
                          ┌─────────────────┐
                          │   S3 Bucket     │
                          │ (Uploads +      │
                          │  Annotations)   │
                          └─────────────────┘
                                 │
                    ┌────────────┬─────────────┐
                    ▼            ▼             ▼
            ┌──────────┐ ┌──────────┐ ┌──────────────┐
            │ uploads/ │ │annotations│ │ predictions/ │
            │          │ │           │ │              │
            └──────────┘ └──────────┘ └──────────────┘
                                 │
                                 ▼
                          ┌──────────────┐
                          │ CloudWatch   │
                          │ Logs & Metrics│
                          └──────────────┘
```

## Service Breakdown

### 1. Frontend Hosting
- **Service**: AWS Amplify + CloudFront + S3
- **Purpose**: Host React app globally with low latency
- **Features**:
  - Auto HTTPS/TLS
  - Auto CI/CD from Git
  - Custom domain support
  - Cache optimization
- **Cost**: ~$4/month CDN + variable S3 storage

### 2. Authentication & Authorization
- **Service**: Amazon Cognito
- **Purpose**: User sign-up, login, session management
- **Features**:
  - Email/password auth
  - MFA support
  - Custom attributes
  - User groups/roles
- **Cost**: $0.50 per 1K monthly active users

### 3. API Layer
- **Service**: API Gateway (REST)
- **Purpose**: HTTP endpoints for mobile/web clients
- **Routes**:
  - `POST /upload` → uploadHandler Lambda
  - `POST /validate-image` → validateImageHandler Lambda
  - `POST /predict` → predictHandler Lambda
  - `POST /save-annotation` → saveAnnotationHandler Lambda
- **Security**: Cognito User Pools authorization
- **Cost**: $3.50 per 1M requests

### 4. Serverless Compute
- **Service**: AWS Lambda (Node.js 18.x)
- **Functions**:
  1. **uploadHandler**
     - Generates S3 pre-signed upload URL
     - Validity: 5 minutes
     - Returns: `{ uploadUrl, key }`
  
  2. **validateImageHandler**
     - Calls AWS Rekognition DetectLabels
     - Checks for "Leaf" label with ≥60% confidence
     - Returns: `{ valid: boolean, labels: [...] }`
  
  3. **predictHandler**
     - Invokes SageMaker endpoint
     - Sends S3 image URI as input
     - Returns: `{ crop, disease, boundingBoxes: [...] }`
  
  4. **saveAnnotationHandler**
     - Saves corrected annotations as JSON to S3
     - Path: `annotations/{userId}/{imageKey}.json`
     - Returns: `{ saved: boolean, objectKey }`

- **Execution Role Permissions**:
  - `s3:GetObject`, `s3:PutObject` → S3 buckets
  - `rekognition:DetectLabels` → Rekognition service
  - `sagemaker:InvokeEndpoint` → SageMaker endpoints
  - `logs:CreateLogGroup`, `logs:CreateLogStream`, `logs:PutLogEvents` → CloudWatch

- **Cost**: ~$2 per 100K invocations

### 5. Object Storage
- **Service**: Amazon S3
- **Buckets**:
  - `uploads/`: Raw leaf images (10GB typical)
  - `annotations/`: Corrected JSON labels
  - `predictions/`: ML model outputs (optional caching)
- **Lifecycle**:
  - Uploads: Expire after 30 days (configurable)
  - Annotations: Retain indefinitely
- **Cost**: ~$0.023 per GB stored + transfer costs

### 6. Image Validation & Labeling
- **Service**: Amazon Rekognition
- **API Used**: `DetectLabels`
- **Purpose**: Validate image contains a plant leaf
- **Confidence Threshold**: 60%
- **Cost**: $1 per 1K images

### 7. ML Model Inference
- **Service**: Amazon SageMaker (bring your own endpoint)
- **Input Format**: S3 image URI
- **Expected Output**:
  ```json
  {
    "crop": "tomato",
    "disease": "early_blight",
    "bounding_boxes": [
      { "x": 0.1, "y": 0.2, "width": 0.4, "height": 0.3 }
    ]
  }
  ```
- **Endpoint Configuration**:
  - Model type: Custom PyTorch/TensorFlow/SKLearn
  - Instance type: ml.t2.medium (dev) or ml.p3.2xlarge (prod)
  - Auto-scaling: Configure based on traffic
- **Cost**: ~$5-50+/month per endpoint (varies by instance type)

### 8. Monitoring & Observability
- **Service**: CloudWatch
- **Logs**:
  - Lambda execution logs: `/aws/lambda/<function-name>`
  - API Gateway access logs (optional)
  - S3 access logs (optional)
- **Metrics**:
  - Lambda invocations, errors, duration
  - API Gateway requests, latency
  - S3 bucket size
- **Alarms**: Configure for Lambda errors, API 5xx, etc.

---

## Data Flow

### Upload & Validate
```
User (Browser)
    ↓
1. POST /upload (Cognito token)
    ↓ uploadHandler
2. Generate S3 signed URL
    ↓
3. Browser PUT image to S3
    ↓
4. POST /validate-image (with S3 key)
    ↓ validateImageHandler
5. Call Rekognition.DetectLabels
    ↓
6. Check for "Leaf" label
    ↓
7. Return { valid: true/false }
    ↓
8. If valid, redirect to prediction page
```

### Prediction & Annotation
```
User (Browser)
    ↓
1. POST /predict (with S3 key)
    ↓ predictHandler
2. Call SageMaker.InvokeEndpoint
    ↓
3. Parse output: crop, disease, bboxes
    ↓
4. Display results on frontend
    ↓
5. User edits labels & boxes
    ↓
6. POST /save-annotation
    ↓ saveAnnotationHandler
7. Save JSON to S3: annotations/{userId}/...
    ↓
8. Return saved confirmation
```

---

## Security Architecture

### Network Security
- **HTTPS/TLS**: CloudFront enforces HTTPS
- **API Endpoint**: Public but requires Cognito token
- **S3 Bucket**: Private; accessed via IAM roles only

### Authentication & Authorization
- **User Pool**: Cognito manages identities
- **Access Token**: JWT issued on login, expires in 1 hour
- **Refresh Token**: Renews access token for up to 30 days
- **API Authorization**: API Gateway validates token before Lambda invocation
- **S3 Access**: Lambda execution role has least-privilege S3 permissions

### Data Protection
- **Encryption at Rest**: S3 with AES-256 (default)
- **Encryption in Transit**: TLS 1.2+ enforced
- **Sensitive Data**: Annotations stored with user ID prefix for isolation

### Audit & Compliance
- **CloudTrail**: Track all AWS API calls (optional, recommended)
- **Access Logs**: S3 and API Gateway (optional)
- **CloudWatch Logs**: Lambda execution logs retained 30 days

---

## Performance Optimizations

### Caching
- **CloudFront**: Static assets cached with long TTL (1 year for versioned files)
- **S3**: Upload prefixes optimized for low latency
- **SageMaker**: Batch inference recommended for bulk predictions

### Scalability
- **Lambda**: Auto-scales to 1000 concurrent executions (soft limit)
- **API Gateway**: Throttle limits configurable (default 10K req/sec)
- **S3**: Auto-scales to any request rate
- **Cognito**: Auto-scales to support millions of users

### Latency Reduction
- **CloudFront**: Multi-region edge caches
- **API Gateway**: Regional endpoint (us-east-1)
- **Lambda**: Provisioned concurrency (production optimization)
- **SageMaker**: Model optimization via Neo compiler

---

## High Availability & Disaster Recovery

### Redundancy
- **CloudFront**: Multi-region by default
- **Lambda**: Auto-failover across AZs
- **S3**: Cross-region replication (optional)
- **Cognito**: Multi-AZ by default

### Backup & Recovery
- **S3 Versioning**: Enable to recover deleted objects
- **S3 Cross-Region Replication**: Automatic backup to another region
- **Database Snapshots**: Not applicable (serverless = no DB)
- **Infrastructure as Code**: CloudFormation templates auto-generated by Amplify

### RTO/RPO
- **Recovery Time Objective (RTO)**: <5 minutes
- **Recovery Point Objective (RPO)**: <1 minute

---

## Cost Breakdown (Monthly Estimate)

| Component | Usage | Cost |
|-----------|-------|------|
| **CloudFront** | 50GB downloaded | $4.00 |
| **S3 Storage** | 10GB stored | $0.23 |
| **S3 Transfer** | 50GB uploaded | $0.00 (free) |
| **API Gateway** | 1M requests | $3.50 |
| **Lambda** | 100K invocations (1M seconds) | $2.08 |
| **Rekognition** | 100 validations | $0.10 |
| **Cognito** | 100 MAU | $0.05 |
| **SageMaker** (ml.t2.medium) | 730 hours | $30.00 |
| **CloudWatch** | Logs & metrics | $0.50 |
| **Route 53** (if custom domain) | 1 hosted zone | $0.50 |
| **Total** | | **~$41/month** |

*Adjust SageMaker cost based on instance type and usage*

---

## Deployment Checklist

- [ ] AWS account created and verified
- [ ] IAM user with programmatic access created
- [ ] AWS CLI configured with credentials
- [ ] Node.js 18+ installed
- [ ] Amplify CLI installed globally
- [ ] Git repository created
- [ ] React app scaffolded
- [ ] Lambda functions implemented
- [ ] `amplify init` completed
- [ ] Auth, storage, API added
- [ ] Functions integrated with API routes
- [ ] `amplify push` successful
- [ ] `aws-exports.js` populated
- [ ] React app builds successfully (`npm run build`)
- [ ] S3 CORS configured
- [ ] Hosting added and published
- [ ] CloudFront domain verified
- [ ] Local testing passed
- [ ] Production secrets configured
- [ ] CloudWatch alarms created
- [ ] GitHub repo pushed
- [ ] Amplify Console connected to GitHub (optional CI/CD)

---

**Created**: 2026-03-29  
**Stack**: Amplify, React, Lambda, S3, Cognito, Rekognition, SageMaker, CloudFront
