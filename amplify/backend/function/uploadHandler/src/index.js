const AWS = require("aws-sdk");
const s3 = new AWS.S3();
const BUCKET = process.env.STORAGE_PLANTDISEASESTORAGE_BUCKET;

exports.handler = async (event) => {
  try {
    const { filename, contentType } = JSON.parse(event.body || "{}");
    if (!filename) return { statusCode: 400, body: "filename required" };
    const key = `uploads/${Date.now()}-${Math.random().toString(36).slice(2, 10)}-${filename}`;
    const params = {
      Bucket: BUCKET,
      Key: key,
      Expires: 300,
      ContentType: contentType || "image/jpeg",
    };
    const uploadUrl = await s3.getSignedUrlPromise("putObject", params);
    return { statusCode: 200, body: JSON.stringify({ uploadUrl, key }) };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: JSON.stringify({ message: err.message || "upload failure" }) };
  }
};
