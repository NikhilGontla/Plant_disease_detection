const AWS = require("aws-sdk");
const runtime = new AWS.SageMakerRuntime();
const BUCKET = process.env.STORAGE_PLANTDISEASESTORAGE_BUCKET;
const ENDPOINT = process.env.SAGEMAKER_ENDPOINT_NAME;

exports.handler = async (event) => {
  try {
    const { key } = JSON.parse(event.body || "{}");
    if (!key) return { statusCode: 400, body: "key required" };
    if (!ENDPOINT) return { statusCode: 500, body: "missing SageMaker endpoint env" };

    const payload = JSON.stringify({ s3_uri: `s3://${BUCKET}/${key}` });
    const response = await runtime.invokeEndpoint({
      EndpointName: ENDPOINT,
      Body: payload,
      ContentType: "application/json",
      Accept: "application/json",
    }).promise();
    const prediction = JSON.parse(Buffer.from(response.Body).toString("utf8"));

    return { statusCode: 200, body: JSON.stringify({
      crop: prediction.crop || "unknown",
      disease: prediction.disease || "unknown",
      boundingBoxes: prediction.bounding_boxes || [],
      raw: prediction,
    })};
  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: JSON.stringify({ message: err.message || "prediction failure" }) };
  }
};
