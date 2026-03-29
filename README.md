# Plant Disease Labeling Pipeline

A serverless React + AWS Amplify project for uploading leaf images, validating with Rekognition, predicting with SageMaker, editing annotations, and saving to S3.

## Setup

1. `npm install`
2. `amplify init`
3. `amplify add auth`
4. `amplify add storage`
5. `amplify add api`
6. `amplify add function` (uploadHandler, validateImageHandler, predictHandler, saveAnnotationHandler)
7. `amplify push`
8. `amplify add hosting`
9. `amplify publish`

## Test

- POST `/upload`
- POST `/validate-image`
- POST `/predict`
- POST `/save-annotation`

## Local run

`npm start`
