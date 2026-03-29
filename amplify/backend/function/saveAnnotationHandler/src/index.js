const AWS = require("aws-sdk");
const s3 = new AWS.S3();
const BUCKET = process.env.STORAGE_PLANTDISEASESTORAGE_BUCKET;

exports.handler = async (event) => {
  try {
    const { imageKey, annotations, userId } = JSON.parse(event.body || "{}");
    if (!imageKey || !annotations) return { statusCode: 400, body: "imageKey and annotations required" };

    const fileName = encodeURIComponent(imageKey.replace(/\//g, "_")) + ".json";
    const objectKey = `annotations/${userId || "anonymous"}/${fileName}`;

    await s3.putObject({
      Bucket: BUCKET,
      Key: objectKey,
      Body: JSON.stringify({ imageKey, annotations, userId, savedAt: new Date().toISOString() }),
      ContentType: "application/json",
    }).promise();

    return { statusCode: 200, body: JSON.stringify({ saved: true, objectKey }) };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: JSON.stringify({ message: err.message || "save annotation failure" }) };
  }
};
