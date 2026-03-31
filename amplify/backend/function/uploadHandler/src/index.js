const { S3Client, PutObjectCommand, GetObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const BUCKET = process.env.STORAGE_S316C4B567_BUCKETNAME;
const s3 = new S3Client({
  region: process.env.REGION || "ap-south-1",
  requestChecksumCalculation: "WHEN_REQUIRED",
  responseChecksumValidation: "WHEN_REQUIRED",
});

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type,Authorization",
};

exports.handler = async (event) => {
  try {
    const { filename, contentType } = JSON.parse(event.body || "{}");
    if (!filename) return { statusCode: 400, headers: CORS_HEADERS, body: "filename required" };
    const key = `uploads/${Date.now()}-${Math.random().toString(36).slice(2, 10)}-${filename}`;
    const command = new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      ContentType: contentType || "image/jpeg",
    });
    const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 300 });
    const getUrl = await getSignedUrl(s3, new GetObjectCommand({ Bucket: BUCKET, Key: key }), { expiresIn: 3600 });
    return { statusCode: 200, headers: CORS_HEADERS, body: JSON.stringify({ uploadUrl, key, getUrl }) };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, headers: CORS_HEADERS, body: JSON.stringify({ message: err.message || "upload failure" }) };
  }
};
