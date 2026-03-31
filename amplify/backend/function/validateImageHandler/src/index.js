const { RekognitionClient, DetectLabelsCommand } = require("@aws-sdk/client-rekognition");
const BUCKET = process.env.STORAGE_S316C4B567_BUCKETNAME;
const rekognition = new RekognitionClient({ region: process.env.REGION || "ap-south-1" });

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type,Authorization",
};

exports.handler = async (event) => {
  try {
    const { key } = JSON.parse(event.body || "{}");
    if (!key) return { statusCode: 400, headers: CORS_HEADERS, body: "key required" };

    const resp = await rekognition.send(new DetectLabelsCommand({
      Image: { S3Object: { Bucket: BUCKET, Name: key } },
      MinConfidence: 60,
    }));
    const hasLeaf = resp.Labels.some((label) => label.Name.toLowerCase() === "leaf" && label.Confidence >= 60);
    return { statusCode: 200, headers: CORS_HEADERS, body: JSON.stringify({ valid: hasLeaf, labels: resp.Labels }) };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, headers: CORS_HEADERS, body: JSON.stringify({ message: err.message || "validation failure" }) };
  }
};
