# Plant Disease Detection & Labeling Pipeline

A full-stack serverless web application built with **React** and **AWS Amplify** that allows users to upload leaf images, validate them with Amazon Rekognition, receive disease predictions, manually edit bounding box annotations, and save the results to S3.

---

## Project Overview

This project implements a cloud-native image annotation pipeline for agricultural plant disease detection. Users authenticate via Cognito, upload a leaf image, and are guided through a multi-step pipeline:

1. **Upload** — image is securely uploaded to S3 via a presigned URL
2. **Validate** — Amazon Rekognition confirms the image contains a leaf
3. **Predict** — a SageMaker endpoint (or stub) returns crop/disease labels and bounding boxes
4. **Annotate** — user reviews and edits predictions, then saves annotations to S3

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Tailwind CSS, AWS Amplify UI |
| Auth | Amazon Cognito (email + password) |
| Storage | Amazon S3 |
| API | Amazon API Gateway (REST) |
| Functions | AWS Lambda (Node.js 22.x, AWS SDK v3) |
| Image Validation | Amazon Rekognition (`DetectLabels`) |
| ML Prediction | Amazon SageMaker Runtime |
| IaC | AWS Amplify CLI (Gen 1), CloudFormation |

---

## AWS Resources

| Resource | Name |
|----------|------|
| Amplify App | `dw1j7nx5enhim` (env: `dev`) |
| Cognito User Pool | `ap-south-1_WpuSDfxYd` |
| S3 Bucket | `plantdiseasestoragebucket3ffb5-dev` |
| API Gateway | `https://nhp9p4cxn3.execute-api.ap-south-1.amazonaws.com/dev` |
| Lambda — Upload | `uploadHandler-dev` |
| Lambda — Validate | `validateImageHandler-dev` |
| Lambda — Predict | `predictHandler-dev` |
| Lambda — Save | `saveAnnotationHandler-dev` |
| Region | `ap-south-1` (Mumbai) |

---

## API Endpoints

| Method | Path | Lambda | Description |
|--------|------|--------|-------------|
| POST | `/upload` | `uploadHandler` | Returns S3 presigned PUT URL |
| POST | `/validate-image` | `validateImageHandler` | Rekognition leaf detection |
| POST | `/predict` | `predictHandler` | SageMaker disease prediction |
| POST | `/save-annotation` | `saveAnnotationHandler` | Saves annotation JSON to S3 |

---

## Project Structure

```
src/
  App.js                    # Root — Amplify config, auth, routing
  pages/
    WelcomePage.js          # Upload + validate pipeline
    PredictionPage.js       # Display prediction results
    AnnotationPage.js       # Edit bounding boxes + save
  services/
    api.js                  # API Gateway calls via Amplify API
    s3.js                   # Direct S3 presigned URL upload
amplify/
  backend/
    auth/                   # Cognito configuration
    storage/                # S3 bucket configuration
    function/               # 4 Lambda function source + CF templates
    api/                    # API Gateway configuration
```

---

## Running Locally

```bash
npm install
npm start
```

Open `http://localhost:3000`. Sign up with an email address, then use the upload pipeline.

---

## Deployment

```bash
amplify push          # Deploy backend (Lambda, Auth, Storage, API)
amplify publish       # Build React app and deploy to Amplify Hosting
```

---

## Notes

- **SageMaker endpoint**: `predictHandler` returns stub data (`Tomato / Early Blight`) when `SAGEMAKER_ENDPOINT_NAME` env var is not set. Set it on the Lambda to enable real predictions.
- **Image validation**: Rekognition requires the uploaded image to contain a `leaf` label with ≥60% confidence.
- **Annotations** are stored as JSON in `s3://plantdiseasestoragebucket3ffb5-dev/annotations/<userId>/<imageKey>.json`.

---

## Architecture

See [ARCHITECTURE.md](ARCHITECTURE.md) for the full AWS architecture diagram.

