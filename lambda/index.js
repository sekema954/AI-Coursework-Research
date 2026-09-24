const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const crypto = require("crypto");

const s3 = new S3Client({
  region: process.env.AWS_REGION || "us-east-1",
});

const BUCKET_NAME = process.env.S3_BUCKET;

exports.handler = async (event) => {
  try {
    // Handle CORS preflight
    const method =
      event.requestContext?.http?.method ||
      event.httpMethod ||
      "POST";

    if (method === "OPTIONS") {
      return response(204, {});
    }

    if (method !== "POST") {
      return response(405, {
        success: false,
        message: "Method not allowed",
      });
    }

    // Parse request body
    const body =
      typeof event.body === "string"
        ? JSON.parse(event.body)
        : event.body || {};

    const {
      gradeLevel,
      frequency,
      purpose,
      depth,
      acceptable,
      guidance,
    } = body;

    // Validate required fields
    if (
      !gradeLevel ||
      !frequency ||
      !purpose ||
      !depth ||
      !acceptable ||
      !guidance
    ) {
      return response(400, {
        success: false,
        message: "All survey questions must be answered.",
      });
    }

    // Validate arrays
    if (!Array.isArray(purpose) || !Array.isArray(acceptable)) {
      return response(400, {
        success: false,
        message: "Invalid survey format.",
      });
    }

    // Purpose allows 1-2 selections
    if (purpose.length < 1 || purpose.length > 2) {
      return response(400, {
        success: false,
        message: "Select between 1 and 2 purposes.",
      });
    }

    // Create unique response ID
    const now = new Date();
    const responseId = crypto.randomUUID();

    // Build survey response
    const surveyResponse = {
      responseId,
      gradeLevel,
      frequency,
      purpose,
      depth,
      acceptable,
      guidance,
      submittedAt: now.toISOString(),
    };

    // S3 location
    const key =
      `survey-responses/${now.getUTCFullYear()}/` +
      `${String(now.getUTCMonth() + 1).padStart(2, "0")}/` +
      `${responseId}.json`;

    // Save to S3
    await s3.send(
      new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        Body: JSON.stringify(surveyResponse),
        ContentType: "application/json",
      })
    );

    // Return success
    return response(201, {
      success: true,
      message: "Survey response recorded successfully.",
      responseId,
    });
  } catch (error) {
    console.error("Survey submission error:", error);

    return response(500, {
      success: false,
      message: "Failed to save survey response.",
    });
  }
};

function response(statusCode, body) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Allow-Methods": "POST,OPTIONS",
    },
    body: JSON.stringify(body),
  };
}