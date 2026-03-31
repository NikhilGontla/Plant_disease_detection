const { BedrockRuntimeClient, ConverseCommand } = require("@aws-sdk/client-bedrock-runtime");
const { RekognitionClient, DetectLabelsCommand } = require("@aws-sdk/client-rekognition");
const { S3Client, GetObjectCommand } = require("@aws-sdk/client-s3");

const BUCKET = process.env.STORAGE_S316C4B567_BUCKETNAME;
const REGION = process.env.REGION || "ap-south-1";
// Bedrock: use us-east-1 for widest model availability
const BEDROCK_REGION = process.env.BEDROCK_REGION || "us-east-1";

const rekognition = new RekognitionClient({ region: REGION });
const s3 = new S3Client({ region: REGION });
const bedrock = new BedrockRuntimeClient({ region: BEDROCK_REGION });

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type,Authorization",
};

// ─── Download image from S3 ──────────────────────────────────────────
async function getImageBytes(key) {
  const resp = await s3.send(new GetObjectCommand({ Bucket: BUCKET, Key: key }));
  const chunks = [];
  for await (const chunk of resp.Body) chunks.push(chunk);
  return Buffer.concat(chunks);
}

// ─── Amazon Bedrock: classify crop + disease using Nova Lite vision ──
async function classifyWithBedrock(imageBytes) {
  const prompt = `You are a plant pathology expert. Analyze this leaf image carefully.

Identify:
1. The crop/plant species
2. Any visible disease or condition

Return ONLY a valid JSON object, nothing else:
{"crop": "plant name", "disease": "disease name or Healthy", "confidence": 85}

Where confidence is your certainty as a percentage (0-100).
If you cannot identify the plant, use "Unknown". If the leaf looks healthy, use "Healthy" for disease.`;

  const resp = await bedrock.send(new ConverseCommand({
    modelId: "amazon.nova-lite-v1:0",
    messages: [{
      role: "user",
      content: [
        {
          image: {
            format: "jpeg",
            source: { bytes: imageBytes },
          },
        },
        { text: prompt },
      ],
    }],
    inferenceConfig: { maxTokens: 300 },
  }));

  const text = resp.output?.message?.content?.[0]?.text || "{}";
  // Extract JSON from response (model may wrap in markdown code blocks)
  const jsonMatch = text.match(/\{[\s\S]*?\}/);
  if (!jsonMatch) return { crop: "Unknown", disease: "Unknown", confidence: 0 };

  const parsed = JSON.parse(jsonMatch[0]);
  return {
    crop: parsed.crop || "Unknown",
    disease: parsed.disease || "Unknown",
    confidence: parsed.confidence || 0,
  };
}

// ─── Rekognition: bounding boxes for detected objects ────────────────
async function getRekognitionBoxes(key) {
  const resp = await rekognition.send(new DetectLabelsCommand({
    Image: { S3Object: { Bucket: BUCKET, Name: key } },
    MinConfidence: 50,
  }));
  const boundingBoxes = [];
  for (const label of resp.Labels) {
    if (label.Instances?.length > 0) {
      for (const inst of label.Instances) {
        if (inst.BoundingBox) {
          boundingBoxes.push({
            x: inst.BoundingBox.Left,
            y: inst.BoundingBox.Top,
            width: inst.BoundingBox.Width,
            height: inst.BoundingBox.Height,
            label: label.Name,
          });
        }
      }
    }
  }
  return boundingBoxes;
}

// ═══ Main handler ════════════════════════════════════════════════════
exports.handler = async (event) => {
  try {
    const { key } = JSON.parse(event.body || "{}");
    if (!key) return { statusCode: 400, headers: CORS_HEADERS, body: "key required" };

    // Run classification (Bedrock) and bounding boxes (Rekognition) in parallel
    const imageBytes = await getImageBytes(key);
    const [classification, boundingBoxes] = await Promise.all([
      classifyWithBedrock(imageBytes),
      getRekognitionBoxes(key),
    ]);

    return { statusCode: 200, headers: CORS_HEADERS, body: JSON.stringify({
      crop: classification.crop,
      disease: classification.disease,
      confidence: classification.confidence,
      boundingBoxes,
      raw: { mode: "bedrock-nova-lite + rekognition" },
    })};
  } catch (err) {
    console.error(err);
    return { statusCode: 500, headers: CORS_HEADERS, body: JSON.stringify({ message: err.message || "prediction failure" }) };
  }
};
