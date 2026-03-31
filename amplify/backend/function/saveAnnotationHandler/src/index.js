const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const BUCKET = process.env.STORAGE_S316C4B567_BUCKETNAME;
const s3 = new S3Client({ region: process.env.REGION || "ap-south-1" });

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type,Authorization",
};

exports.handler = async (event) => {
  try {
    const { imageKey, annotations, userId } = JSON.parse(event.body || "{}");
    if (!imageKey || !annotations) return { statusCode: 400, headers: CORS_HEADERS, body: "imageKey and annotations required" };

    const fileName = encodeURIComponent(imageKey.replace(/\//g, "_")) + ".json";
    const objectKey = `annotations/${userId || "anonymous"}/${fileName}`;

    await s3.send(new PutObjectCommand({
      Bucket: BUCKET,
      Key: objectKey,
      Body: JSON.stringify({ imageKey, annotations, userId, savedAt: new Date().toISOString() }),
      ContentType: "application/json",
    }));

    return { statusCode: 200, headers: CORS_HEADERS, body: JSON.stringify({ saved: true, objectKey }) };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, headers: CORS_HEADERS, body: JSON.stringify({ message: err.message || "save annotation failure" }) };
  }
};
