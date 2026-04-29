export const openApiSpec = {
  openapi: "3.0.3",
  info: {
    title: "Fayrouza Ad AI Detector API",
    version: "1.0.0",
    description: [
      "AI-powered ad moderation API for the Fayrouza marketplace.",
      "",
      "Submit any marketplace ad and receive an automated moderation decision powered by Google Gemini AI.",
      "The API evaluates text and images for content quality, policy compliance, and Sharia-compliance.",
      "",
      "**Authentication:** Include your API key in the `X-API-Key` request header.",
      "",
      "**Rate limits:** 30 requests per minute per IP.",
      "",
      "**Decisions returned:**",
      "- `Approve` — Ad passes all checks (maps to AUTO_APPROVED)",
      "- `Review` — Ad flagged for human review (maps to NEEDS_REVIEW)",
      "- `Reject` — Ad violates policies (maps to AUTO_REJECTED)",
    ].join("\n"),
  },
  servers: [
    {
      url: "http://localhost:3001",
      description: "Local development",
    },
  ],
  components: {
    securitySchemes: {
      ApiKeyAuth: {
        type: "apiKey",
        in: "header",
        name: "X-API-Key",
        description: "Your API key. Set PUBLIC_API_KEY in the server .env to define this value.",
      },
    },
    schemas: {
      ModerateRequest: {
        type: "object",
        required: ["title", "description", "category"],
        properties: {
          title: {
            type: "string",
            minLength: 1,
            maxLength: 500,
            description: "The ad title",
            example: "iPhone 15 Pro - Like New",
          },
          description: {
            type: "string",
            minLength: 1,
            maxLength: 5000,
            description: "The ad description",
            example: "Used iPhone 15 Pro in excellent condition. No scratches. Comes with original charger and box.",
          },
          price: {
            type: "number",
            minimum: 0,
            description: "The listed price",
            example: 3500,
          },
          category: {
            type: "string",
            minLength: 1,
            maxLength: 100,
            description: "The ad category",
            example: "Electronics",
          },
          imageUrl: {
            type: "string",
            format: "uri",
            description: "Publicly accessible URL of the ad image (optional). Triggers image moderation.",
            example: "https://example.com/images/iphone.jpg",
          },
          ad_id: {
            type: "integer",
            description: "Your internal ad identifier (optional, used for logging/audit)",
            example: 12345,
          },
        },
      },
      ModerateResponse: {
        type: "object",
        properties: {
          success: {
            type: "boolean",
            example: true,
          },
          data: {
            type: "object",
            properties: {
              decision: {
                type: "string",
                enum: ["Approve", "Review", "Reject"],
                description: "The final moderation decision",
                example: "Approve",
              },
              confidence_score: {
                type: "integer",
                minimum: 0,
                maximum: 100,
                description: "Overall confidence percentage (0–100)",
                example: 92,
              },
              reasoning: {
                type: "string",
                description: "Human-readable explanation of the decision",
                example: "The ad content is appropriate and complies with marketplace policies.",
              },
              processed_at: {
                type: "string",
                format: "date-time",
                description: "ISO 8601 timestamp of when the ad was processed",
                example: "2024-01-22T10:30:00.000Z",
              },
              details: {
                type: "object",
                description: "Breakdown of text and image analysis",
                properties: {
                  text_decision: {
                    type: "string",
                    nullable: true,
                    enum: ["approve", "review", "reject", null],
                  },
                  text_confidence: {
                    type: "integer",
                    nullable: true,
                    example: 95,
                  },
                  text_reasoning: {
                    type: "string",
                    nullable: true,
                  },
                  text_violations: {
                    type: "array",
                    items: { type: "string" },
                    description: "List of policy violations found in text",
                    example: [],
                  },
                  text_concerns: {
                    type: "array",
                    items: { type: "string" },
                    description: "List of minor concerns found in text",
                    example: [],
                  },
                  image_decision: {
                    type: "string",
                    nullable: true,
                    enum: ["approve", "review", "reject", null],
                    description: "null when no imageUrl was provided",
                  },
                  image_confidence: {
                    type: "integer",
                    nullable: true,
                    example: 88,
                  },
                  image_reasoning: {
                    type: "string",
                    nullable: true,
                  },
                  image_violations: {
                    type: "array",
                    items: { type: "string" },
                    example: [],
                  },
                  image_concerns: {
                    type: "array",
                    items: { type: "string" },
                    example: [],
                  },
                },
              },
            },
          },
        },
      },
      ErrorResponse: {
        type: "object",
        properties: {
          success: {
            type: "boolean",
            example: false,
          },
          error: {
            type: "string",
            example: "Invalid API key",
          },
          code: {
            type: "string",
            example: "FORBIDDEN",
          },
        },
      },
    },
  },
  security: [{ ApiKeyAuth: [] }],
  paths: {
    "/v1/moderate": {
      post: {
        summary: "Moderate an ad",
        description: [
          "Submit a marketplace ad for AI-powered content moderation.",
          "",
          "Analysis runs synchronously — you receive the decision in the response body.",
          "If an `imageUrl` is provided, image moderation runs in parallel with text moderation.",
          "",
          "**Request fields accept aliases:**",
          "- `title` or `ad_title`",
          "- `description` or `ad_description`",
          "- `price` or `ad_price`",
          "- `category` or `ad_category`",
          "- `imageUrl` or `image`",
        ].join("\n"),
        operationId: "moderateAd",
        tags: ["Moderation"],
        security: [{ ApiKeyAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ModerateRequest" },
              examples: {
                basic: {
                  summary: "Text-only ad",
                  value: {
                    title: "Samsung Galaxy S24",
                    description: "Brand new Samsung Galaxy S24, sealed in box. Never opened.",
                    price: 2800,
                    category: "Electronics",
                  },
                },
                withImage: {
                  summary: "Ad with image",
                  value: {
                    title: "Leather Sofa - Excellent Condition",
                    description: "3-seater leather sofa, dark brown, minimal wear. Selling due to moving.",
                    price: 1500,
                    category: "Furniture",
                    imageUrl: "https://example.com/sofa.jpg",
                    ad_id: 99001,
                  },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Moderation completed successfully",
            headers: {
              "X-RateLimit-Limit": {
                schema: { type: "integer" },
                description: "Request limit per window",
              },
              "X-RateLimit-Remaining": {
                schema: { type: "integer" },
                description: "Requests remaining in current window",
              },
              "X-RateLimit-Reset": {
                schema: { type: "integer" },
                description: "Unix timestamp when the rate limit window resets",
              },
            },
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ModerateResponse" },
                example: {
                  success: true,
                  data: {
                    decision: "Approve",
                    confidence_score: 93,
                    reasoning: "The ad content is appropriate and complies with all marketplace policies.",
                    processed_at: "2024-01-22T10:30:00.000Z",
                    details: {
                      text_decision: "approve",
                      text_confidence: 95,
                      text_reasoning: "Clear, honest product description with no violations.",
                      text_violations: [],
                      text_concerns: [],
                      image_decision: null,
                      image_confidence: null,
                      image_reasoning: null,
                      image_violations: [],
                      image_concerns: [],
                    },
                  },
                },
              },
            },
          },
          "400": {
            description: "Validation error — check your request body",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
                example: {
                  success: false,
                  error: "Either 'title' or 'ad_title' is required",
                  code: "VALIDATION_ERROR",
                },
              },
            },
          },
          "401": {
            description: "Missing X-API-Key header",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
                example: {
                  success: false,
                  error: "Missing X-API-Key header",
                  code: "UNAUTHORIZED",
                },
              },
            },
          },
          "403": {
            description: "Invalid API key",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
                example: {
                  success: false,
                  error: "Invalid API key",
                  code: "FORBIDDEN",
                },
              },
            },
          },
          "429": {
            description: "Rate limit exceeded (30 req/min)",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
                example: {
                  success: false,
                  error: "Too many requests to webhook endpoint",
                  code: "RATE_LIMITED",
                },
              },
            },
          },
          "500": {
            description: "Internal server error",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
                example: {
                  success: false,
                  error: "Internal server error",
                  code: "INTERNAL_ERROR",
                },
              },
            },
          },
        },
      },
    },
    "/health": {
      get: {
        summary: "Health check",
        description: "Returns the API status, uptime, and background queue statistics.",
        operationId: "healthCheck",
        tags: ["System"],
        security: [],
        responses: {
          "200": {
            description: "API is healthy",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    status: { type: "string", example: "ok" },
                    uptime: { type: "number", description: "Server uptime in seconds", example: 12345.6 },
                    timestamp: { type: "string", format: "date-time" },
                    queue: {
                      type: "object",
                      nullable: true,
                      description: "Background queue stats (null if Redis is unavailable)",
                      properties: {
                        waiting: { type: "integer" },
                        active: { type: "integer" },
                        completed: { type: "integer" },
                        failed: { type: "integer" },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
  tags: [
    {
      name: "Moderation",
      description: "Submit ads for AI content moderation",
    },
    {
      name: "System",
      description: "API health and status",
    },
  ],
};
