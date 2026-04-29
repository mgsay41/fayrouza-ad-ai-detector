# Fayrouza Ad AI Detector — Public API Guide

## Table of Contents

1. [Overview](#1-overview)
2. [Base URL & Interactive Docs](#2-base-url--interactive-docs)
3. [Authentication](#3-authentication)
4. [Endpoint Reference](#4-endpoint-reference)
5. [Request & Response Format](#5-request--response-format)
6. [Code Examples](#6-code-examples)
7. [Decision Logic](#7-decision-logic)
8. [Rate Limits](#8-rate-limits)
9. [Error Reference](#9-error-reference)
10. [Testing Guide](#10-testing-guide)
11. [Troubleshooting](#11-troubleshooting)

---

## 1. Overview

The **Fayrouza Ad AI Detector** is an AI-powered moderation API. Submit any marketplace ad (text + optional image) and receive an instant moderation decision powered by Google Gemini AI.

The API evaluates ads for:
- Policy compliance and prohibited items
- Sharia-compliance (haram goods, interest-based finance, etc.)
- Pricing anomalies and scam indicators
- Image–text consistency and image quality

**Decisions returned:**

| Decision | Meaning |
|---|---|
| `Approve` | Ad passes all checks — safe to publish |
| `Review` | Ad flagged for human review — hold for manual check |
| `Reject` | Ad clearly violates policies — do not publish |

**This is a synchronous API.** You send the request and receive the decision in the response body — no webhooks or callbacks required.

---

## 2. Base URL & Interactive Docs

```
http://54.38.240.143:3001
```

| Resource | URL |
|---|---|
| Interactive Swagger UI | `http://54.38.240.143:3001/docs` |
| Raw OpenAPI JSON spec | `http://54.38.240.143:3001/openapi.json` |
| Health check | `http://54.38.240.143:3001/health` |

**Tip:** Open `/docs` in your browser to explore and test the API interactively without writing any code.

**Tip:** Import `/openapi.json` into Postman, Insomnia, or any OpenAPI-compatible tool for instant collection generation.

---

## 3. Authentication

All requests to `POST /v1/moderate` must include your API key in the `X-API-Key` header.

```
X-API-Key: your_public_api_key_here
```

Contact the Fayrouza team to receive your `PUBLIC_API_KEY`. Keep it secret — do not expose it in client-side JavaScript or public repositories.

**Health check (`GET /health`) requires no authentication.**

---

## 4. Endpoint Reference

### `POST /v1/moderate`

Submit an ad for AI moderation. Returns a decision synchronously.

| Property | Value |
|---|---|
| **Method** | `POST` |
| **URL** | `http://54.38.240.143:3001/v1/moderate` |
| **Auth** | `X-API-Key` header |
| **Content-Type** | `application/json` |
| **Rate limit** | 30 requests / minute per IP |
| **Typical response time** | 5–15 seconds (Gemini AI processing) |

#### Request fields

| Field | Type | Required | Description |
|---|---|---|---|
| `title` | string (1–500 chars) | **Yes** | The ad title. Also accepted as `ad_title`. |
| `description` | string (1–5000 chars) | **Yes** | The ad description. Also accepted as `ad_description`. |
| `category` | string (1–100 chars) | **Yes** | The ad category (e.g. `"Electronics"`, `"Cars"`). Also accepted as `ad_category`. |
| `price` | number (≥ 0) | No | The listed price. Also accepted as `ad_price`. |
| `imageUrl` | string (URL) | No | Publicly accessible URL of the ad image. Triggers image moderation when provided. Also accepted as `image`. |
| `ad_id` | integer | No | Your internal ad identifier. Used for logging and audit trail only. |

#### Response fields

| Field | Type | Description |
|---|---|---|
| `success` | boolean | Always `true` on a successful response |
| `data.decision` | string | `"Approve"`, `"Review"`, or `"Reject"` |
| `data.confidence_score` | integer (0–100) | Overall AI confidence. Higher = more certain. |
| `data.reasoning` | string | Human-readable explanation of the decision |
| `data.processed_at` | ISO 8601 datetime | When the analysis completed |
| `data.details.text_decision` | string \| null | Text-only decision (`"approve"` / `"review"` / `"reject"`) |
| `data.details.text_confidence` | integer \| null | Confidence score for text analysis |
| `data.details.text_reasoning` | string \| null | Text analysis explanation |
| `data.details.text_violations` | string[] | Policy violations found in the text |
| `data.details.text_concerns` | string[] | Minor concerns found in the text |
| `data.details.image_decision` | string \| null | Image-only decision. `null` if no `imageUrl` was provided. |
| `data.details.image_confidence` | integer \| null | Confidence score for image analysis |
| `data.details.image_reasoning` | string \| null | Image analysis explanation |
| `data.details.image_violations` | string[] | Policy violations found in the image |
| `data.details.image_concerns` | string[] | Minor concerns found in the image |

---

### `GET /health`

Returns the API status and uptime. No authentication required.

```bash
curl http://54.38.240.143:3001/health
```

```json
{
  "status": "ok",
  "uptime": 12345.678,
  "timestamp": "2026-04-29T10:00:00.000Z",
  "queue": {
    "waiting": 0,
    "active": 0,
    "completed": 42,
    "failed": 0
  }
}
```

---

## 5. Request & Response Format

### Example request body

```json
{
  "title": "iPhone 15 Pro Max 256GB - Brand New",
  "description": "Selling my brand new iPhone 15 Pro Max, 256GB. Unopened box with full Apple warranty. Purchased from Apple Store.",
  "price": 45000,
  "category": "Electronics",
  "imageUrl": "https://example.com/images/iphone.jpg",
  "ad_id": 12345
}
```

### Example response — Approved

```json
{
  "success": true,
  "data": {
    "decision": "Approve",
    "confidence_score": 93,
    "reasoning": "The ad content is appropriate and complies with all marketplace policies. The product description is clear and honest, the price is realistic for the Egyptian market, and no prohibited items or scam indicators were detected.",
    "processed_at": "2026-04-29T10:00:05.123Z",
    "details": {
      "text_decision": "approve",
      "text_confidence": 95,
      "text_reasoning": "Legitimate electronics listing with a realistic price and clear description.",
      "text_violations": [],
      "text_concerns": [],
      "image_decision": "approve",
      "image_confidence": 90,
      "image_reasoning": "Image shows an iPhone product, consistent with the ad description. No inappropriate content.",
      "image_violations": [],
      "image_concerns": []
    }
  }
}
```

### Example response — Rejected

```json
{
  "success": true,
  "data": {
    "decision": "Reject",
    "confidence_score": 15,
    "reasoning": "The ad promotes prohibited items that violate marketplace and Sharia policies.",
    "processed_at": "2026-04-29T10:00:04.800Z",
    "details": {
      "text_decision": "reject",
      "text_confidence": 15,
      "text_reasoning": "The ad explicitly offers alcohol for sale, which is prohibited on this marketplace.",
      "text_violations": ["haram_item"],
      "text_concerns": [],
      "image_decision": null,
      "image_confidence": null,
      "image_reasoning": null,
      "image_violations": [],
      "image_concerns": []
    }
  }
}
```

---

## 6. Code Examples

### cURL

```bash
curl -X POST http://54.38.240.143:3001/v1/moderate \
  -H "Content-Type: application/json" \
  -H "X-API-Key: YOUR_PUBLIC_API_KEY" \
  -d '{
    "title": "iPhone 15 Pro Max 256GB - Brand New",
    "description": "Selling my brand new iPhone 15 Pro Max. Unopened box with full Apple warranty.",
    "price": 45000,
    "category": "Electronics"
  }'
```

---

### JavaScript / TypeScript (fetch)

```js
const response = await fetch("http://54.38.240.143:3001/v1/moderate", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "X-API-Key": process.env.MODERATION_API_KEY,
  },
  body: JSON.stringify({
    title: "iPhone 15 Pro Max 256GB - Brand New",
    description: "Selling my brand new iPhone 15 Pro Max. Unopened box with full Apple warranty.",
    price: 45000,
    category: "Electronics",
  }),
});

const { data } = await response.json();

if (data.decision === "Approve") {
  // publish the ad
} else if (data.decision === "Review") {
  // send to manual review queue
} else {
  // reject the ad
}
```

---

### Node.js (axios)

```js
const axios = require("axios");

const { data } = await axios.post(
  "http://54.38.240.143:3001/v1/moderate",
  {
    title: "iPhone 15 Pro Max 256GB - Brand New",
    description: "Selling my brand new iPhone 15 Pro Max. Unopened box with full Apple warranty.",
    price: 45000,
    category: "Electronics",
  },
  {
    headers: {
      "X-API-Key": process.env.MODERATION_API_KEY,
    },
    timeout: 30000, // 30s — AI processing takes up to 15s
  }
);

console.log(data.data.decision); // "Approve" | "Review" | "Reject"
```

---

### Python (requests)

```python
import os
import requests

response = requests.post(
    "http://54.38.240.143:3001/v1/moderate",
    headers={"X-API-Key": os.environ["MODERATION_API_KEY"]},
    json={
        "title": "iPhone 15 Pro Max 256GB - Brand New",
        "description": "Selling my brand new iPhone 15 Pro Max. Unopened box with full Apple warranty.",
        "price": 45000,
        "category": "Electronics",
    },
    timeout=30,  # AI processing takes up to 15s
)

response.raise_for_status()
result = response.json()["data"]

print(result["decision"])          # Approve / Review / Reject
print(result["confidence_score"])  # 0–100
print(result["reasoning"])
```

---

### PHP (Guzzle)

```php
use GuzzleHttp\Client;

$client = new Client(['timeout' => 30]);

$response = $client->post('http://54.38.240.143:3001/v1/moderate', [
    'headers' => [
        'X-API-Key' => env('MODERATION_API_KEY'),
    ],
    'json' => [
        'title'       => 'iPhone 15 Pro Max 256GB - Brand New',
        'description' => 'Selling my brand new iPhone 15 Pro Max. Unopened box with full Apple warranty.',
        'price'       => 45000,
        'category'    => 'Electronics',
    ],
]);

$result = json_decode($response->getBody(), true)['data'];

match ($result['decision']) {
    'Approve' => // activate the ad,
    'Review'  => // send to review queue,
    'Reject'  => // reject the ad,
};
```

---

### PHP (Laravel Http facade)

```php
use Illuminate\Support\Facades\Http;

$response = Http::withHeaders([
        'X-API-Key' => config('services.moderation.key'),
    ])
    ->timeout(30)
    ->post('http://54.38.240.143:3001/v1/moderate', [
        'title'       => $ad->title,
        'description' => $ad->description,
        'price'       => (float) $ad->price,
        'category'    => $ad->category->name,
        'imageUrl'    => $ad->image_url,
        'ad_id'       => $ad->id,
    ]);

$result = $response->json('data');

// $result['decision'] => "Approve" | "Review" | "Reject"
```

---

### Ruby (net/http)

```ruby
require 'net/http'
require 'json'
require 'uri'

uri = URI('http://54.38.240.143:3001/v1/moderate')
http = Net::HTTP.new(uri.host, uri.port)
http.read_timeout = 30

request = Net::HTTP::Post.new(uri)
request['Content-Type'] = 'application/json'
request['X-API-Key'] = ENV['MODERATION_API_KEY']
request.body = {
  title: 'iPhone 15 Pro Max 256GB - Brand New',
  description: 'Selling my brand new iPhone 15 Pro Max. Unopened box.',
  price: 45000,
  category: 'Electronics'
}.to_json

response = http.request(request)
result = JSON.parse(response.body)['data']

puts result['decision']  # "Approve" | "Review" | "Reject"
```

---

### Go

```go
package main

import (
    "bytes"
    "encoding/json"
    "fmt"
    "net/http"
    "os"
    "time"
)

type ModerateRequest struct {
    Title       string  `json:"title"`
    Description string  `json:"description"`
    Price       float64 `json:"price"`
    Category    string  `json:"category"`
}

type ModerateData struct {
    Decision        string `json:"decision"`
    ConfidenceScore int    `json:"confidence_score"`
    Reasoning       string `json:"reasoning"`
}

type ModerateResponse struct {
    Success bool         `json:"success"`
    Data    ModerateData `json:"data"`
}

func main() {
    payload, _ := json.Marshal(ModerateRequest{
        Title:       "iPhone 15 Pro Max 256GB - Brand New",
        Description: "Selling my brand new iPhone 15 Pro Max. Unopened box.",
        Price:       45000,
        Category:    "Electronics",
    })

    req, _ := http.NewRequest("POST", "http://54.38.240.143:3001/v1/moderate", bytes.NewBuffer(payload))
    req.Header.Set("Content-Type", "application/json")
    req.Header.Set("X-API-Key", os.Getenv("MODERATION_API_KEY"))

    client := &http.Client{Timeout: 30 * time.Second}
    resp, err := client.Do(req)
    if err != nil {
        panic(err)
    }
    defer resp.Body.Close()

    var result ModerateResponse
    json.NewDecoder(resp.Body).Decode(&result)

    fmt.Println(result.Data.Decision) // Approve | Review | Reject
}
```

---

### Java (HttpClient — Java 11+)

```java
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;

HttpClient client = HttpClient.newBuilder()
    .connectTimeout(Duration.ofSeconds(10))
    .build();

String body = """
    {
      "title": "iPhone 15 Pro Max 256GB - Brand New",
      "description": "Selling my brand new iPhone 15 Pro Max. Unopened box.",
      "price": 45000,
      "category": "Electronics"
    }
    """;

HttpRequest request = HttpRequest.newBuilder()
    .uri(URI.create("http://54.38.240.143:3001/v1/moderate"))
    .timeout(Duration.ofSeconds(30))
    .header("Content-Type", "application/json")
    .header("X-API-Key", System.getenv("MODERATION_API_KEY"))
    .POST(HttpRequest.BodyPublishers.ofString(body))
    .build();

HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
System.out.println(response.body());
```

---

### C# (.NET HttpClient)

```csharp
using System.Net.Http;
using System.Net.Http.Json;

var client = new HttpClient { Timeout = TimeSpan.FromSeconds(30) };
client.DefaultRequestHeaders.Add("X-API-Key", Environment.GetEnvironmentVariable("MODERATION_API_KEY"));

var payload = new {
    title = "iPhone 15 Pro Max 256GB - Brand New",
    description = "Selling my brand new iPhone 15 Pro Max. Unopened box.",
    price = 45000,
    category = "Electronics"
};

var response = await client.PostAsJsonAsync("http://54.38.240.143:3001/v1/moderate", payload);
var result = await response.Content.ReadFromJsonAsync<JsonElement>();

Console.WriteLine(result.GetProperty("data").GetProperty("decision").GetString());
// "Approve" | "Review" | "Reject"
```

---

## 7. Decision Logic

The final decision is derived from two independent analyses — text and image — combined using this logic:

```
If either text OR image says "reject"  →  Reject  (regardless of score)
Else if either says "review"           →  Review  (regardless of score)
Else if both approve:
    score >= 80  →  Approve
    score 40–79  →  Review
    score < 40   →  Reject
```

**What the AI checks for:**

- **Haram / prohibited items:** Alcohol, gambling, drugs, sorcery, pork products, interest-based financial products
- **Egyptian-specific terms:** Local alcohol brand names, network marketing / MLM keywords
- **Pricing anomalies:** Unrealistic prices relative to Egyptian market rates
- **Scam indicators:** "Cash only", "outside the platform", get-rich-quick schemes
- **Image–text consistency:** Does the image match the description?
- **Image content:** Explicit content, weapons, watermarks from competing platforms, stolen images

---

## 8. Rate Limits

| Endpoint | Limit |
|---|---|
| `POST /v1/moderate` | 30 requests / minute per IP |
| `GET /health` | Unlimited |

Rate limit headers are included in every response:

| Header | Description |
|---|---|
| `X-RateLimit-Limit` | Requests allowed per window |
| `X-RateLimit-Remaining` | Requests left in the current window |
| `X-RateLimit-Reset` | Unix timestamp when the window resets |

When the limit is exceeded, the API returns **HTTP 429**:

```json
{
  "success": false,
  "error": "Too many requests to webhook endpoint",
  "code": "RATE_LIMITED"
}
```

---

## 9. Error Reference

All errors follow the same shape:

```json
{
  "success": false,
  "error": "Human-readable message",
  "code": "ERROR_CODE"
}
```

| HTTP Status | Code | Cause |
|---|---|---|
| `400` | `VALIDATION_ERROR` | Missing or invalid request fields |
| `401` | `UNAUTHORIZED` | `X-API-Key` header is missing |
| `403` | `FORBIDDEN` | `X-API-Key` value is invalid |
| `429` | `RATE_LIMITED` | Too many requests |
| `500` | `INTERNAL_ERROR` | Server-side error (AI or network failure) |

### Validation error (400) — extra detail

Validation errors include a `details` array pointing to the specific field:

```json
{
  "success": false,
  "error": "Validation failed",
  "code": "VALIDATION_ERROR",
  "details": [
    { "field": "title", "message": "Either 'title' or 'ad_title' is required" }
  ]
}
```

### 500 — safe fallback

If the AI service itself encounters an error (e.g. Gemini API timeout), the response is HTTP 500. Your integration should treat a 500 as "needs review" and not auto-publish the ad.

---

## 10. Testing Guide

### Test 1: Verify the service is running

```bash
curl http://54.38.240.143:3001/health
```

Expected: HTTP 200 with `"status": "ok"`.

---

### Test 2: Clean ad — should be approved

```bash
curl -X POST http://54.38.240.143:3001/v1/moderate \
  -H "Content-Type: application/json" \
  -H "X-API-Key: YOUR_PUBLIC_API_KEY" \
  -d '{
    "title": "iPhone 15 Pro Max 256GB - Brand New",
    "description": "Selling my brand new iPhone 15 Pro Max, 256GB. Unopened box with full Apple warranty.",
    "price": 45000,
    "category": "Electronics"
  }'
```

Expected: HTTP 200, `"decision": "Approve"`.

---

### Test 3: Prohibited content — should be rejected

```bash
curl -X POST http://54.38.240.143:3001/v1/moderate \
  -H "Content-Type: application/json" \
  -H "X-API-Key: YOUR_PUBLIC_API_KEY" \
  -d '{
    "title": "خمر مصري للبيع",
    "description": "بيع زجاجات خمر مستوردة",
    "price": 100,
    "category": "Food"
  }'
```

Expected: HTTP 200, `"decision": "Reject"`, `text_violations` includes `"haram_item"`.

---

### Test 4: Ad with image

```bash
curl -X POST http://54.38.240.143:3001/v1/moderate \
  -H "Content-Type: application/json" \
  -H "X-API-Key: YOUR_PUBLIC_API_KEY" \
  -d '{
    "title": "Leather Sofa - Excellent Condition",
    "description": "3-seater leather sofa, dark brown, minimal wear. Selling due to moving.",
    "price": 1500,
    "category": "Furniture",
    "imageUrl": "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800"
  }'
```

Expected: HTTP 200, both `text_decision` and `image_decision` populated.

---

### Test 5: Missing required field — should be rejected with 400

```bash
curl -X POST http://54.38.240.143:3001/v1/moderate \
  -H "Content-Type: application/json" \
  -H "X-API-Key: YOUR_PUBLIC_API_KEY" \
  -d '{
    "title": "Some Ad"
  }'
```

Expected: HTTP 400, `"code": "VALIDATION_ERROR"`.

---

### Test 6: Missing API key — should return 401

```bash
curl -X POST http://54.38.240.143:3001/v1/moderate \
  -H "Content-Type: application/json" \
  -d '{"title":"t","description":"d","category":"c"}'
```

Expected: HTTP 401, `"code": "UNAUTHORIZED"`.

---

### Test 7: Wrong API key — should return 403

```bash
curl -X POST http://54.38.240.143:3001/v1/moderate \
  -H "Content-Type: application/json" \
  -H "X-API-Key: wrong-key" \
  -d '{"title":"t","description":"d","category":"c"}'
```

Expected: HTTP 403, `"code": "FORBIDDEN"`.

---

## 11. Troubleshooting

| Problem | What to check |
|---|---|
| Request hangs or times out | Set your HTTP client timeout to at least **30 seconds**. AI processing typically takes 5–15 seconds. |
| Getting `401 UNAUTHORIZED` | Ensure the `X-API-Key` header is present in every request. |
| Getting `403 FORBIDDEN` | Verify the API key value is correct with no extra whitespace or newlines. |
| Getting `400 VALIDATION_ERROR` | Check that `title`, `description`, and `category` are all present and non-empty. `price` is optional but must be a number if provided. |
| `imageUrl` not analyzed | The image URL must be publicly accessible (no auth required). The API fetches it server-side. |
| Getting `429 RATE_LIMITED` | You have exceeded 30 requests/minute. Add a delay between calls or contact us to discuss higher limits. |
| Decision seems wrong | The AI uses Egyptian market context for pricing and Sharia standards for content. Check `text_reasoning` and `image_reasoning` in the response `details` for the AI's explanation. |

---

## Quick Reference

```
Endpoint:   POST http://54.38.240.143:3001/v1/moderate
Auth:       X-API-Key: <your key>
Body:       { title, description, category, price?, imageUrl?, ad_id? }
Response:   { success, data: { decision, confidence_score, reasoning, processed_at, details } }
Decisions:  "Approve" | "Review" | "Reject"
Timeout:    Set your client timeout to >= 30 seconds

Interactive docs:  http://54.38.240.143:3001/docs
OpenAPI spec:      http://54.38.240.143:3001/openapi.json
Health check:      http://54.38.240.143:3001/health  (no auth)
```
