# Plant Disease Pipeline - Testing Guide

## Local Testing (npm start)

### Prerequisites
```bash
npm install
# Ensure aws-exports.js is populated after amplify push
```

### 1. Start Development Server
```bash
npm start
# Opens http://localhost:3000
# Hot-reload enabled for code changes
```

### 2. Authentication Flow
1. Click "Create Account"
2. Enter email (e.g., test@example.com) and password
3. Confirm email verification (check inbox or skip if no email configured)
4. Sign in with credentials
5. Verify redirect to `/welcome` page

**Expected Behavior**:
- Cognito user pool creates new user
- Session stored in localStorage
- withAuthenticator guard allows navigation

### 3. Upload Flow
1. On **Welcome Page**, click file input
2. Select a JPG/PNG image of a plant leaf
3. Click "Start Upload & Validate"
4. Watch status messages:
   - "Requesting secure upload URL..."
   - "Uploading image to S3..."
   - "Validating leaf image with Rekognition..."

**Expected Behavior**:
- `uploadHandler` returns pre-signed URL
- Browser PUT request succeeds (check Network tab)
- `validateImageHandler` calls Rekognition
- If valid, redirected to `/prediction`
- If invalid (no leaf), error message appears

**Debugging**:
```javascript
// Open DevTools Console to see errors
// Check Network tab for S3 PUT request
// Verify S3 CORS is configured
```

### 4. Prediction Flow
1. On **Prediction Page**, wait for loading to complete
2. Verify output displays:
   - Image key (S3 path)
   - Crop (plant type)
   - Disease (diagnosis)
   - Bounding boxes (x, y, width, height)

**Expected Behavior**:
- `predictHandler` invokes SageMaker endpoint
- Response includes crop, disease, and bounding boxes
- If endpoint not configured, error appears

**Debugging**:
```bash
# Check CloudWatch logs
aws logs tail /aws/lambda/predictHandler --follow
# Should show SageMaker invocation details
```

### 5. Annotation Flow
1. Click "Edit Predictions / Save Annotation"
2. On **Annotation Page**, add/edit bounding boxes:
   - Click "Add Box" to create new box
   - Edit label, x, y, width, height
   - Delete box if needed
3. Click "Save Annotation"

**Expected Behavior**:
- New boxes added to list
- Manual edits update box properties
- Delete button removes box
- Save calls `saveAnnotationHandler`
- Redirects to `/welcome` on success

**Debugging**:
```bash
# Check S3 for saved annotation
aws s3 ls s3://plantdisease-storage-prod-xxxxx/annotations/
aws s3 cp s3://plantdisease-storage-prod-xxxxx/annotations/... - | jq .
```

---

## API Testing (with cURL)

### Prerequisites
1. Sign in via UI to get token
2. Open DevTools → Application → Cookies → Cognito token

### 1. Test Upload Endpoint
```bash
curl -X POST https://api-id.execute-api.us-east-1.amazonaws.com/prod/upload \
  -H "Authorization: <idToken>" \
  -H "Content-Type: application/json" \
  -d '{
    "filename": "leaf.jpg",
    "contentType": "image/jpeg"
  }'

# Expected response:
# {
#   "uploadUrl": "https://plantdisease-storage-prod-xxxxx.s3.amazonaws.com/uploads/xxxxx?...",
#   "key": "uploads/1680000000-abc123-leaf.jpg"
# }
```

### 2. Upload to S3 (pre-signed URL)
```bash
# Get uploadUrl from previous response
curl -X PUT "<uploadUrl>" \
  -H "Content-Type: image/jpeg" \
  --data-binary @leaf.jpg

# Should return 200 OK with no body
```

### 3. Test Validate Endpoint
```bash
curl -X POST https://api-id.execute-api.us-east-1.amazonaws.com/prod/validate-image \
  -H "Authorization: <idToken>" \
  -H "Content-Type: application/json" \
  -d '{
    "key": "uploads/1680000000-abc123-leaf.jpg"
  }'

# Expected response:
# {
#   "valid": true,
#   "labels": [
#     { "Name": "Leaf", "Confidence": 95.5 },
#     { "Name": "Plant", "Confidence": 92.3 },
#     ...
#   ]
# }
```

### 4. Test Predict Endpoint
```bash
curl -X POST https://api-id.execute-api.us-east-1.amazonaws.com/prod/predict \
  -H "Authorization: <idToken>" \
  -H "Content-Type: application/json" \
  -d '{
    "key": "uploads/1680000000-abc123-leaf.jpg"
  }'

# Expected response:
# {
#   "crop": "tomato",
#   "disease": "early_blight",
#   "boundingBoxes": [
#     { "x": 0.12, "y": 0.15, "width": 0.7, "height": 0.6 }
#   ]
# }
```

### 5. Test Save Annotation Endpoint
```bash
curl -X POST https://api-id.execute-api.us-east-1.amazonaws.com/prod/save-annotation \
  -H "Authorization: <idToken>" \
  -H "Content-Type: application/json" \
  -d '{
    "imageKey": "uploads/1680000000-abc123-leaf.jpg",
    "annotations": [
      {
        "id": "box-1",
        "label": "diseased_leaf",
        "x": 0.12,
        "y": 0.15,
        "width": 0.7,
        "height": 0.6
      }
    ],
    "userId": "user-uuid"
  }'

# Expected response:
# {
#   "saved": true,
#   "objectKey": "annotations/user-uuid/leaf.jpg.json"
# }
```

---

## Integration Testing

### Test Full Pipeline (Script)
```bash
#!/bin/bash
API_URL="https://api-id.execute-api.us-east-1.amazonaws.com/prod"
ID_TOKEN="<your-cognito-id-token>"
IMAGE_FILE="./test-leaf.jpg"

# Step 1: Get upload URL
UPLOAD_RESP=$(curl -s -X POST $API_URL/upload \
  -H "Authorization: $ID_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"filename":"test.jpg","contentType":"image/jpeg"}')

UPLOAD_URL=$(echo $UPLOAD_RESP | jq -r '.uploadUrl')
IMAGE_KEY=$(echo $UPLOAD_RESP | jq -r '.key')

echo "✓ Got upload URL"
echo "  Key: $IMAGE_KEY"

# Step 2: Upload image to S3
curl -s -X PUT "$UPLOAD_URL" \
  -H "Content-Type: image/jpeg" \
  --data-binary @$IMAGE_FILE > /dev/null

echo "✓ Uploaded image to S3"

# Step 3: Validate image
VALIDATE_RESP=$(curl -s -X POST $API_URL/validate-image \
  -H "Authorization: $ID_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"key\":\"$IMAGE_KEY\"}")

IS_VALID=$(echo $VALIDATE_RESP | jq -r '.valid')
echo "✓ Validated: $IS_VALID"

if [ "$IS_VALID" != "true" ]; then
  echo "✗ Image validation failed"
  exit 1
fi

# Step 4: Get predictions
PREDICT_RESP=$(curl -s -X POST $API_URL/predict \
  -H "Authorization: $ID_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"key\":\"$IMAGE_KEY\"}")

DISEASE=$(echo $PREDICT_RESP | jq -r '.disease')
echo "✓ Prediction: $DISEASE"

# Step 5: Save annotation
SAVE_RESP=$(curl -s -X POST $API_URL/save-annotation \
  -H "Authorization: $ID_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"imageKey\":\"$IMAGE_KEY\",\"annotations\":[{\"id\":\"box-1\",\"label\":\"$DISEASE\",\"x\":0.1,\"y\":0.1,\"width\":0.5,\"height\":0.5}],\"userId\":\"test-user\"}")

SAVED=$(echo $SAVE_RESP | jq -r '.saved')
echo "✓ Annotation saved: $SAVED"

echo ""
echo "✓ Pipeline test completed successfully!"
```

Run:
```bash
bash test-pipeline.sh
```

---

## CloudWatch Logs Testing

### View Lambda Logs
```bash
# Real-time tail
aws logs tail /aws/lambda/uploadHandler --follow
aws logs tail /aws/lambda/validateImageHandler --follow
aws logs tail /aws/lambda/predictHandler --follow
aws logs tail /aws/lambda/saveAnnotationHandler --follow

# View recent logs
aws logs describe-log-streams --log-group-name /aws/lambda/uploadHandler
aws logs get-log-events --log-group-name /aws/lambda/uploadHandler --log-stream-name <stream-name>

# Filter for errors
aws logs filter-log-events --log-group-name /aws/lambda/predictHandler --filter-pattern "ERROR"
```

### Example Log Output (uploadHandler)
```
START RequestId: a1b2c3d4-e5f6-7890-abcd-ef1234567890 Version: $LATEST
{ bucket: 'plantdisease-storage-prod-xxxxx', key: 'uploads/1680000000-abc123-leaf.jpg' }
END RequestId: a1b2c3d4-e5f6-7890-abcd-ef1234567890
REPORT RequestId: a1b2c3d4-e5f6-7890-abcd-ef1234567890	Duration: 245.67 ms	Billed Duration: 246 ms	Memory Size: 128 MB	Max Memory Used: 87 MB	Init Duration: 512.34 ms
```

---

## Performance Testing

### Load Test API Endpoints
```bash
# Install artillery
npm install -g artillery

# Create load-test.yml
cat > load-test.yml << 'EOF'
config:
  target: "https://api-id.execute-api.us-east-1.amazonaws.com"
  phases:
    - duration: 60
      arrivalRate: 10
      name: "Warm up"
    - duration: 120
      arrivalRate: 50
      name: "Ramp up"
    - duration: 60
      arrivalRate: 100
      name: "Spike"
scenarios:
  - name: "Upload Flow"
    flow:
      - post:
          url: "/prod/upload"
          headers:
            Authorization: "<idToken>"
            Content-Type: "application/json"
          json: { "filename": "test.jpg", "contentType": "image/jpeg" }
EOF

# Run test
artillery run load-test.yml
```

### Measure Lambda Duration
```bash
aws cloudwatch get-metric-statistics \
  --namespace AWS/Lambda \
  --metric-name Duration \
  --dimensions Name=FunctionName,Value=predictHandler \
  --start-time 2026-03-29T00:00:00Z \
  --end-time 2026-03-29T23:59:59Z \
  --period 3600 \
  --statistics Average,Maximum,Minimum
```

---

## Error Scenarios & Debugging

### Scenario: S3 CORS Error
**Error**: 
```
Access to XMLHttpRequest from origin 'https://xxxxx.cloudfront.net' has been blocked by CORS policy
```

**Cause**: S3 CORS not configured or misconfigured

**Fix**:
```bash
# Check CORS
aws s3api get-bucket-cors --bucket plantdisease-storage-prod-xxxxx

# Fix CORS
aws s3api put-bucket-cors --bucket plantdisease-storage-prod-xxxxx \
  --cors-configuration '{
    "CORSRules": [
      {
        "AllowedHeaders": ["*"],
        "AllowedMethods": ["GET", "PUT", "POST"],
        "AllowedOrigins": ["https://xxxxx.cloudfront.net"],
        "ExposeHeaders": ["ETag"],
        "MaxAgeSeconds": 3000
      }
    ]
  }'
```

### Scenario: SageMaker Endpoint Not Found
**Error**: 
```
Could not find endpoint 'plant-disease-endpoint'
```

**Cause**: Endpoint name mismatch or endpoint not deployed

**Fix**:
```bash
# List available endpoints
aws sagemaker list-endpoints

# Update Lambda env var
amplify update function
# Select predictHandler
# Set SAGEMAKER_ENDPOINT_NAME to correct endpoint
amplify push
```

### Scenario: Cognito Token Expired
**Error**: 
```
401 Unauthorized
```

**Cause**: ID token expired (1 hour default)

**Fix**:
```javascript
// Frontend auto-refreshes via withAuthenticator
// Or manually:
import { Auth } from 'aws-amplify';
const newToken = await Auth.currentSession();
```

### Scenario: Lambda Timeout
**Error**: 
```
Task timed out after 30.00 seconds
```

**Cause**: Lambda execution takes >30 seconds (default timeout)

**Fix**:
```bash
amplify update function
# Select function
# Increase timeout to 60-300 seconds
amplify push
```

---

## Regression Testing Checklist

- [ ] Sign up with new email
- [ ] Sign in with correct credentials
- [ ] Sign in with wrong password (fails)
- [ ] Upload JPG image (succeeds)
- [ ] Upload PNG image (succeeds)
- [ ] Upload non-image file (fails)
- [ ] Upload image without leaf (validation fails)
- [ ] Upload leaf image (validation succeeds)
- [ ] Predict returns crop + disease + boxes
- [ ] Edit annotation labels (changes persist)
- [ ] Delete annotation box (removed from list)
- [ ] Save annotation (saved to S3)
- [ ] Verify annotation JSON format in S3
- [ ] Navigate back to welcome page (state cleared)
- [ ] Sign out and sign back in (session restored)

---

## Performance Benchmarks

| Operation | Expected Duration | Threshold |
|-----------|-------------------|-----------|
| S3 upload (1MB image) | 1-3 seconds | <5s |
| Rekognition validation | 2-5 seconds | <10s |
| SageMaker prediction | 5-30 seconds | <60s |
| Save annotation | 1-2 seconds | <5s |
| Page load (CloudFront) | <1 second | <2s |
| Auth flow (sign-up) | 3-5 seconds | <10s |

---

**Created**: 2026-03-29  
**Updated**: Test suite comprehensive
