const AWS = require("aws-sdk");
const rekognition = new AWS.Rekognition();
const BUCKET = process.env.STORAGE_PLANTDISEASESTORAGE_BUCKET;

exports.handler = async (event) => {
  try {
    const { key } = JSON.parse(event.body || "{}");
    if (!key) return { statusCode: 400, body: "key required" };

    const params = {
      Image: { S3Object: { Bucket: BUCKET, Name: key } },
      MinConfidence: 60,
    };
    const resp = await rekognition.detectLabels(params).promise();
    const hasLeaf = resp.Labels.some((label) => label.Name.toLowerCase() === "leaf" && label.Confidence >= 60);
    return { statusCode: 200, body: JSON.stringify({ valid: hasLeaf, labels: resp.Labels }) };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: JSON.stringify({ message: err.message || "validation failure" }) };
  }
};
