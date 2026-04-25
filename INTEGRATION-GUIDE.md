# Fayrouza Ad AI Detector — Integration Guide for Fayrouza Backend Team

## Table of Contents

1. [Overview](#1-overview)
2. [Connection Details & Credentials](#2-connection-details--credentials)
3. [How the Integration Works](#3-how-the-integration-works)
4. [What Laravel Sends to the AI Detector](#4-what-laravel-sends-to-the-ai-detector)
5. [What the AI Detector Sends Back to Laravel (Callback)](#5-what-the-ai-detector-sends-back-to-laravel-callback)
6. [Step-by-Step Laravel Changes](#6-step-by-step-laravel-changes)
7. [Postman Collection Guide](#7-postman-collection-guide)
8. [Testing Guide](#8-testing-guide)
9. [Error Handling & Edge Cases](#9-error-handling--edge-cases)
10. [Troubleshooting](#10-troubleshooting)

---

## 1. Overview

The **Fayrouza Ad AI Detector** is an AI-powered moderation service that automatically analyzes ads submitted to the Fayrouza marketplace. It uses Google Gemini AI to evaluate ad text and images for policy compliance, pricing accuracy, and Sharia-compliance, then returns one of three decisions:

| Decision | Fayrouza Status | Meaning |
|---|---|---|
| `AUTO_APPROVED` | `1` | Ad passes all checks — set to active |
| `NEEDS_REVIEW` | `3` | Ad flagged for human review |
| `AUTO_REJECTED` | `4` | Ad clearly violates policies — rejected |

**The integration has two parts:**
1. **Laravel → AI Detector:** When a new ad is created, Laravel sends the ad data to the AI detector for analysis.
2. **AI Detector → Laravel:** After analysis (~15 seconds), the AI detector calls back to Laravel to update the ad status.

---

## 2. Connection Details & Credentials

### Base URL

```
http://54.38.240.143:3001
```

### API Keys

Three API keys are used, each with a different scope:

| Key Name | Value | Scope | Used For |
|---|---|---|---|
| `WEBHOOK_API_KEY` | `fyr_wh_e97a0484b150202e39292166c06c5ece216ed27f306ce6012daf2b3171561a16` | Webhook | `POST /webhook/moderate` |
| `INTERNAL_API_KEY` | `fyr_int_f0ea05c3429a2a2bcece4a3e561792d2e2ee84f5dcc54a4d64c7a6fe6ae2196f` | Internal | `POST /api/ads/moderate` |
| `ADMIN_API_KEY` | `fyr_adm_3392951e9021e03c5c2b7b37cd538be82fd64eb918d8e1e674d7669a766ef44f` | Admin | `POST /api/admin/override` and `GET /api/admin/audit` |

**For Laravel integration, you only need the `INTERNAL_API_KEY`.**

All keys are sent via the `X-API-Key` header:

```
X-API-Key: fyr_int_f0ea05c3429a2a2bcece4a3e561792d2e2ee84f5dcc54a4d64c7a6fe6ae2196f
```

---

## 3. How the Integration Works

```
  Seller submits ad
        │
        ▼
  LARAVEL APP                    AI DETECTOR SERVICE
  ─────────────────              ────────────────────
        │
  Save ad with
  status = 3 (pending)
        │
        │  POST /api/ads/moderate
        │  { ad_id, ad_title, ad_description,
        │    ad_price, ad_category, image }
        │ ─────────────────────────►
        │                            │
        │  202 Accepted              │  Queue job for
        │  { job_id, estimated_      │  AI analysis
        │    seconds: 15 }           │  (~15 seconds)
        │ ◄───────────────────────── │
        │                            │
  Seller gets fast                 Gemini AI analyzes
  response, ad is                  text + image
  in "pending"                        │
        │                            │
        │                            ▼
        │                     Decision made:
        │                     AUTO_APPROVED / NEEDS_REVIEW / AUTO_REJECTED
        │                            │
        │  POST /ads/update/{id}?status={N}
        │  Authorization: Bearer <FAYROUZA_SERVICE_TOKEN>
        │ ◄───────────────────────── │
        │                            │
  Update ad status                 Done!
  1 = active
  3 = pending/review
  4 = rejected
```

**Key points:**
- The initial `POST /api/ads/moderate` returns **immediately** (HTTP 202). The seller does not wait for AI analysis.
- Analysis takes approximately **15 seconds**.
- After analysis, the AI detector **calls back** to Laravel to update the ad status.
- If the AI analysis fails for any reason, the ad is left at status `3` (needs review) — it will never be auto-approved by mistake.

---

## 4. What Laravel Sends to the AI Detector

### Endpoint

```
POST http://54.38.240.143:3001/api/ads/moderate
```

### Headers

```
Content-Type: application/json
X-API-Key: fyr_int_f0ea05c3429a2a2bcece4a3e561792d2e2ee84f5dcc54a4d64c7a6fe6ae2196f
```

### Request Body

```json
{
  "ad_id": 2399,
  "ad_title": "iPhone 13",
  "ad_description": "Used iPhone 13, excellent condition. Comes with charger and original box.",
  "ad_price": 15000,
  "ad_category": "Electronics",
  "image": "https://fayrouza.sdevelopment.tech/storage/2399/photo.jpg"
}
```

### Field Reference

| Field | Type | Required | Description |
|---|---|---|---|
| `ad_id` | number (integer, positive) | **Yes** | The ad's ID in your database |
| `ad_title` | string (1–500 chars) | **Yes** | Ad title. If stored as JSON with `en`/`ar` keys, send the primary language |
| `ad_description` | string (1–5000 chars) | **Yes** | Ad description. Same language handling as title |
| `ad_price` | number (≥ 0) | **Yes** | Ad price. Send as a number, not a string |
| `ad_category` | string (1–100 chars) | **Yes** | Category name (e.g., "Electronics", "Cars", "Real Estate") |
| `image` | string (valid URL) | No | Full URL to the ad's image. Must be publicly accessible |
| `user_id` | number (integer, positive) | No | The seller's user ID (for logging) |
| `callback_url` | string (valid URL) | No | If provided, the full moderation result will be POSTed here after processing |

### Response (HTTP 202 Accepted)

```json
{
  "success": true,
  "job_id": "mod_2399_1714046400000",
  "estimated_seconds": 15
}
```

This response means the ad has been queued for analysis. The seller gets their response instantly.

---

## 5. What the AI Detector Sends Back to Laravel (Callback)

After analysis completes (~15 seconds), the AI detector calls your existing endpoint:

### Endpoint

```
POST https://fayrouza.sdevelopment.tech/api/ads/update/{id}?status={N}
```

### Headers

```
Authorization: Bearer <FAYROUZA_SERVICE_TOKEN>
Content-Type: application/json
```

### Request Body

The status is passed via the query string parameter `status`, and the moderation details are sent as a JSON body:

```json
{
  "decision": "AUTO_REJECTED",
  "score": 25,
  "reasoning": "=== TEXT ANALYSIS ===\nDecision: reject\nConfidence: 25%\nThe ad text references prohibited items...",
  "violations": ["haram_item"],
  "concerns": ["pricing_anomaly"]
}
```

### Body Field Reference

| Field | Type | Description |
|---|---|---|
| `decision` | string | One of: `AUTO_APPROVED`, `NEEDS_REVIEW`, `AUTO_REJECTED` |
| `score` | number | AI confidence score (0–100). Higher = safer |
| `reasoning` | string | Human-readable explanation of the decision. Includes both text and image analysis details |
| `violations` | string[] | List of policy violations detected (e.g., `["haram_item", "scam"]`). Empty if none |
| `concerns` | string[] | List of non-critical concerns (e.g., `["price_anomaly", "image_quality"]`). Empty if none |

### Status Values

| `status` param | AI Decision | Meaning |
|---|---|---|
| `1` | AUTO_APPROVED | Ad passed all AI checks — activate it |
| `3` | NEEDS_REVIEW | Ad flagged for manual human review |
| `4` | AUTO_REJECTED | Ad violates marketplace policies — reject it |

### Example Callbacks

**Auto-approved ad:**

```
POST https://fayrouza.sdevelopment.tech/api/ads/update/2399?status=1
Authorization: Bearer 1|AbCdEfGhIjKlMnOpQrStUvWxYz...
Content-Type: application/json

{
  "decision": "AUTO_APPROVED",
  "score": 92,
  "reasoning": "=== TEXT ANALYSIS ===\nDecision: approve\nConfidence: 92%\nLegitimate electronics listing with realistic price.",
  "violations": [],
  "concerns": []
}
```

**Rejected ad:**

```
POST https://fayrouza.sdevelopment.tech/api/ads/update/2400?status=4
Authorization: Bearer 1|AbCdEfGhIjKlMnOpQrStUvWxYz...
Content-Type: application/json

{
  "decision": "AUTO_REJECTED",
  "score": 15,
  "reasoning": "=== TEXT ANALYSIS ===\nDecision: reject\nConfidence: 15%\nThe ad promotes prohibited items...",
  "violations": ["haram_item"],
  "concerns": []
}
```

### What Your Endpoint Needs to Support

Your existing `POST /ads/update/{id}` route needs the following modifications:

1. **Accept Bearer token authentication** (`auth:sanctum` middleware) — not just session auth
2. **Allow the service account to update any ad** — bypass the ownership check for the service account user
3. **Read the JSON body** to store moderation details (requires a migration — see Step 5 below)

---

## 6. Step-by-Step Laravel Changes

All changes are **purely additive** — no existing tables, endpoints, or business logic is modified.

### Step 1 — Add Environment Variables

Add to your `.env` file:

```dotenv
AD_DETECTOR_URL=http://54.38.240.143:3001
AD_DETECTOR_INTERNAL_KEY=fyr_int_f0ea05c3429a2a2bcece4a3e561792d2e2ee84f5dcc54a4d64c7a6fe6ae2196f
```

### Step 2 — Register Config Values

Add to `config/services.php`:

```php
'ad_detector' => [
    'url'          => env('AD_DETECTOR_URL'),
    'internal_key' => env('AD_DETECTOR_INTERNAL_KEY'),
],
```

### Step 3 — Create the Service Account

Run in `php artisan tinker`:

```php
$user = \App\Models\User::firstOrCreate(
    ['email' => 'ai-detector@internal.local'],
    [
        'name'       => 'AI Detector',
        'password'   => bcrypt(\Str::random(32)),
        'phone'      => '00000000000',
        'dial_code'  => '+20',
        'country_id' => 1,
        'city_id'    => 1,
    ]
);

echo $user->createToken('ai-detector')->plainTextToken;
```

**Copy the printed token** and send it to us. We will configure it as `FAYROUZA_SERVICE_TOKEN` in our backend so our service can call your `/ads/update/{id}` endpoint.

### Step 4 — Modify the Ad Update Route

Ensure the route accepts Bearer token authentication:

```php
// routes/api.php (or wherever your ad routes are defined)
Route::post('/ads/update/{id}', [AdController::class, 'update'])
    ->middleware('auth:sanctum');
```

### Step 5 — Allow Service Account to Update Any Ad

In your `AdController@update` method (or the relevant policy), add a bypass for the service account:

```php
public function update($id)
{
    $ad = Ad::findOrFail($id);

    // Bypass ownership check for the AI detector service account
    if (auth()->user()->email !== 'ai-detector@internal.local') {
        // Your existing ownership/authorization check here
        // e.g., if ($ad->user_id !== auth()->id()) abort(403);
    }

    $status = request()->query('status');
    $ad->status = $status;

    // Store moderation details from AI detector
    $moderationData = request()->json()->all();
    if (!empty($moderationData) && auth()->user()->email === 'ai-detector@internal.local') {
        $ad->moderation_decision = $moderationData['decision'] ?? null;
        $ad->moderation_score = $moderationData['score'] ?? null;
        $ad->moderation_reasoning = $moderationData['reasoning'] ?? null;
        $ad->moderation_violations = $moderationData['violations'] ?? [];
        $ad->moderation_concerns = $moderationData['concerns'] ?? [];
        $ad->moderated_at = now();
    }

    $ad->save();

    return response()->json(['success' => true]);
}
```

### Step 5b — Add Moderation Columns to Ads Table

Create a migration to store the moderation data:

```bash
php artisan make:migration add_moderation_fields_to_ads_table
```

Then edit the generated migration file:

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('ads', function (Blueprint $table) {
            $table->string('moderation_decision', 30)->nullable()->after('status');
            $table->unsignedSmallInteger('moderation_score')->nullable()->after('moderation_decision');
            $table->text('moderation_reasoning')->nullable()->after('moderation_score');
            $table->json('moderation_violations')->nullable()->after('moderation_reasoning');
            $table->json('moderation_concerns')->nullable()->after('moderation_violations');
            $table->timestamp('moderated_at')->nullable()->after('moderation_concerns');
        });
    }

    public function down(): void
    {
        Schema::table('ads', function (Blueprint $table) {
            $table->dropColumn([
                'moderation_decision',
                'moderation_score',
                'moderation_reasoning',
                'moderation_violations',
                'moderation_concerns',
                'moderated_at',
            ]);
        });
    }
};
```

Run the migration:

```bash
php artisan migrate
```

### Step 5c — Make Columns Fillable in Ad Model

In your `Ad` model, add the new columns to the `$fillable` array:

```php
protected $fillable = [
    // ... existing columns ...
    'moderation_decision',
    'moderation_score',
    'moderation_reasoning',
    'moderation_violations',
    'moderation_concerns',
    'moderated_at',
];
```

Also add a cast for the JSON columns:

```php
protected $casts = [
    // ... existing casts ...
    'moderation_violations' => 'array',
    'moderation_concerns' => 'array',
    'moderated_at' => 'datetime',
];
```

### Step 6 — Trigger AI Detection on Ad Creation

In your ad creation controller, after `$ad->save()`, dispatch an HTTP call to the AI detector.

**Option A — Inline (simple, blocks the request for ~1 second to queue the job):**

```php
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

// After $ad->save()
$ad->status = 3; // Set to pending while AI reviews it
$ad->save();

$categoryName = optional($ad->category)->name
    ?? optional($ad->adType)->name
    ?? 'General';

$imageUrl = $ad->image
    ? url('storage/' . $ad->image)
    : null;

$title = is_array($ad->name)
    ? ($ad->name['en'] ?? $ad->name['ar'] ?? '')
    : $ad->name;

$description = is_array($ad->description)
    ? ($ad->description['en'] ?? $ad->description['ar'] ?? '')
    : $ad->description;

try {
    Http::withHeaders([
        'X-API-Key' => config('services.ad_detector.internal_key'),
    ])
    ->timeout(10)
    ->post(config('services.ad_detector.url') . '/api/ads/moderate', [
        'ad_id'          => $ad->id,
        'ad_title'       => $title,
        'ad_description' => $description,
        'ad_price'       => (float) ($ad->price ?? 0),
        'ad_category'    => $categoryName,
        'image'          => $imageUrl,
    ]);
} catch (\Exception $e) {
    Log::error('Failed to queue ad for AI moderation', [
        'ad_id' => $ad->id,
        'error' => $e->getMessage(),
    ]);
    // Ad stays at status 3 (pending) — can be reviewed manually
}
```

**Option B — Laravel Queue Job (recommended for production):**

Create `app/Jobs/TriggerAdModerationJob.php`:

```php
<?php

namespace App\Jobs;

use App\Models\Ad;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class TriggerAdModerationJob implements ShouldQueue
{
    use Queueable;

    public function __construct(public int $adId) {}

    public function handle(): void
    {
        $ad = Ad::find($this->adId);

        if (!$ad) {
            return;
        }

        $categoryName = optional($ad->category)->name
            ?? optional($ad->adType)->name
            ?? 'General';

        $imageUrl = $ad->image
            ? url('storage/' . $ad->image)
            : null;

        $title = is_array($ad->name)
            ? ($ad->name['en'] ?? $ad->name['ar'] ?? '')
            : $ad->name;

        $description = is_array($ad->description)
            ? ($ad->description['en'] ?? $ad->description['ar'] ?? '')
            : $ad->description;

        try {
            Http::withHeaders([
                'X-API-Key' => config('services.ad_detector.internal_key'),
            ])
            ->timeout(10)
            ->post(config('services.ad_detector.url') . '/api/ads/moderate', [
                'ad_id'          => $ad->id,
                'ad_title'       => $title,
                'ad_description' => $description,
                'ad_price'       => (float) ($ad->price ?? 0),
                'ad_category'    => $categoryName,
                'image'          => $imageUrl,
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to queue ad for AI moderation', [
                'ad_id' => $ad->id,
                'error' => $e->getMessage(),
            ]);
        }
    }
}
```

Then in your ad creation controller:

```php
// After $ad->save()
$ad->status = 3;
$ad->save();

TriggerAdModerationJob::dispatch($ad->id);
```

### Step 7 — Clear Caches

```bash
php artisan config:cache
php artisan route:cache
```

---

## 7. Postman Collection Guide

A Postman collection is included for testing: **`Fayrouza_AI_Detector_API.postman_collection.json`**

### Importing the Collection

1. Open Postman
2. Click **Import** → Select the file `Fayrouza_AI_Detector_API.postman_collection.json`
3. The collection "Fayrouza Ad AI Detector API" will appear in your workspace

### Setting Up Variables

After importing, set the collection variables:

1. Click on the collection name → **Variables** tab
2. Set the following values:

| Variable | Value |
|---|---|
| `base_url` | `http://54.38.240.143:3001` |
| `webhook_api_key` | `fyr_wh_e97a0484b150202e39292166c06c5ece216ed27f306ce6012daf2b3171561a16` |
| `internal_api_key` | `fyr_int_f0ea05c3429a2a2bcece4a3e561792d2e2ee84f5dcc54a4d64c7a6fe6ae2196f` |
| `admin_api_key` | `fyr_adm_3392951e9021e03c5c2b7b37cd538be82fd64eb918d8e1e674d7669a766ef44f` |

### Collection Structure

The collection is organized into folders:

#### Folder 1: Health Check
- **`GET /health`** — Check if the AI detector service is running. No authentication required.

#### Folder 2: Webhook Moderation
- **`POST /webhook/moderate`** — Synchronous moderation (waits for AI response, ~10 seconds). Used by the React frontend and for quick testing. Uses `webhook_api_key`.
- **`POST /webhook/moderate - Alternative Field Names`** — Same endpoint but using `ad_title`/`ad_description` field naming. Demonstrates both naming conventions work.

Each request has saved example responses showing:
- `200 - Auto Approved`: A clean ad that passed all checks
- `200 - Needs Review`: A suspicious ad flagged for human review
- `200 - Auto Rejected`: A policy-violating ad that was rejected
- `400 - Validation Error`: Missing required fields
- `401 - Missing API Key`: No `X-API-Key` header
- `403 - Invalid API Key`: Wrong API key
- `429 - Rate Limited`: Too many requests

#### Folder 3: Async Moderation (Queue)
- **`POST /api/ads/moderate`** — The endpoint Laravel will use. Queues the ad for async processing and returns immediately. Uses `internal_api_key`.

Example responses:
- `202 - Job Queued`: Success — the ad is queued for processing
- `400 - Validation Error`: Missing required fields

#### Folder 4: Admin
- **`POST /api/admin/override`** — Manually override an ad's status (approve/reject/review). Updates Fayrouza and logs an audit entry. Uses `admin_api_key`.
- **`GET /api/admin/audit`** — Query the audit log. Filter by `ad_id`, `decision`, with pagination. Uses `admin_api_key`.

#### Folder 5: Error Responses (Reference)
- Documents the standard error response formats (401, 403, 500).

---

## 8. Testing Guide

### Test 1: Verify the Service is Running

```bash
curl http://54.38.240.143:3001/health
```

**Expected response (200):**
```json
{
  "status": "ok",
  "uptime": 12345.678,
  "timestamp": "2026-04-25T12:00:00.000Z",
  "queue": {
    "waiting": 0,
    "active": 0,
    "completed": 42,
    "failed": 0,
    "delayed": 0
  }
}
```

### Test 2: Synchronous Moderation (Quick Test)

This endpoint waits for the AI result (~10 seconds). Useful for quick verification.

```bash
curl -X POST http://54.38.240.143:3001/webhook/moderate \
  -H "Content-Type: application/json" \
  -H "X-API-Key: fyr_wh_e97a0484b150202e39292166c06c5ece216ed27f306ce6012daf2b3171561a16" \
  -d '{
    "ad_id": 1,
    "title": "iPhone 15 Pro Max 256GB - Brand New",
    "description": "Selling my brand new iPhone 15 Pro Max, 256GB. Unopened box with full Apple warranty.",
    "price": 45000,
    "category": "Electronics"
  }'
```

**Expected: HTTP 200 with `AUTO_APPROVED`**

### Test 3: Test Haram Content Rejection

```bash
curl -X POST http://54.38.240.143:3001/webhook/moderate \
  -H "Content-Type: application/json" \
  -H "X-API-Key: fyr_wh_e97a0484b150202e39292166c06c5ece216ed27f306ce6012daf2b3171561a16" \
  -d '{
    "ad_id": 2,
    "title": "خمر مصري للبيع",
    "description": "بيع زجاجات خمر مستوردة",
    "price": 100,
    "category": "Food"
  }'
```

**Expected: HTTP 200 with `AUTO_REJECTED`**

### Test 4: Test the Async Endpoint (Laravel Integration Path)

This is the exact endpoint Laravel will call. It returns immediately.

```bash
curl -X POST http://54.38.240.143:3001/api/ads/moderate \
  -H "Content-Type: application/json" \
  -H "X-API-Key: fyr_int_f0ea05c3429a2a2bcece4a3e561792d2e2ee84f5dcc54a4d64c7a6fe6ae2196f" \
  -d '{
    "ad_id": 2399,
    "ad_title": "Test Ad - Honda Civic 2020",
    "ad_description": "Excellent condition Honda Civic 2020, low mileage, full service history.",
    "ad_price": 500000,
    "ad_category": "Cars",
    "image": "https://fayrouza.sdevelopment.tech/storage/2399/photo.jpg"
  }'
```

**Expected response (202 Accepted):**
```json
{
  "success": true,
  "job_id": "mod_2399_1714046400000",
  "estimated_seconds": 15
}
```

### Test 5: Test with callback_url (Optional)

If you want to receive the full moderation result at a URL you control (e.g., using [webhook.site](https://webhook.site)):

```bash
curl -X POST http://54.38.240.143:3001/api/ads/moderate \
  -H "Content-Type: application/json" \
  -H "X-API-Key: fyr_int_f0ea05c3429a2a2bcece4a3e561792d2e2ee84f5dcc54a4d64c7a6fe6ae2196f" \
  -d '{
    "ad_id": 3000,
    "ad_title": "Samsung Galaxy S24",
    "ad_description": "Brand new Samsung Galaxy S24 Ultra, 512GB, never used.",
    "ad_price": 38000,
    "ad_category": "Electronics",
    "image": "https://fayrouza.sdevelopment.tech/storage/3000/photo.jpg",
    "callback_url": "https://webhook.site/YOUR_UNIQUE_ID"
  }'
```

After ~15 seconds, your `callback_url` will receive a POST with the full moderation result:

```json
{
  "decision": "AUTO_APPROVED",
  "fayrouza_status": 1,
  "final_score": 92,
  "reasoning": "=== TEXT ANALYSIS ===\nDecision: approve\nConfidence: 92%\nThe ad appears to be a legitimate electronics listing...",
  "text_analysis": {
    "text_decision": "approve",
    "text_confidence": 92,
    "text_reasoning": "Legitimate product listing with realistic price.",
    "text_violations": [],
    "text_concerns": []
  },
  "image_analysis": null,
  "violations": [],
  "concerns": [],
  "processed_at": "2026-04-25T12:00:00.000Z"
}
```

### Test 6: Test Validation Errors

```bash
curl -X POST http://54.38.240.143:3001/api/ads/moderate \
  -H "Content-Type: application/json" \
  -H "X-API-Key: fyr_int_f0ea05c3429a2a2bcece4a3e561792d2e2ee84f5dcc54a4d64c7a6fe6ae2196f" \
  -d '{
    "ad_title": "Test"
  }'
```

**Expected response (400):**
```json
{
  "success": false,
  "error": "Validation failed",
  "code": "VALIDATION_ERROR",
  "details": [
    { "field": "ad_id", "message": "Required" },
    { "field": "ad_description", "message": "Required" },
    { "field": "ad_price", "message": "Required" },
    { "field": "ad_category", "message": "Required" }
  ]
}
```

### Test 7: Test Authentication Errors

```bash
# Missing API key
curl -X POST http://54.38.240.143:3001/api/ads/moderate \
  -H "Content-Type: application/json" \
  -d '{"ad_id":1,"ad_title":"t","ad_description":"d","ad_price":1,"ad_category":"c"}'
```
**Expected: HTTP 401**

```bash
# Wrong API key
curl -X POST http://54.38.240.143:3001/api/ads/moderate \
  -H "Content-Type: application/json" \
  -H "X-API-Key: wrong-key" \
  -d '{"ad_id":1,"ad_title":"t","ad_description":"d","ad_price":1,"ad_category":"c"}'
```
**Expected: HTTP 403**

### Test 8: Test the Admin Override Endpoint

If an ad was incorrectly rejected, an admin can override the decision:

```bash
curl -X POST http://54.38.240.143:3001/api/admin/override \
  -H "Content-Type: application/json" \
  -H "X-API-Key: fyr_adm_3392951e9021e03c5c2b7b37cd538be82fd64eb918d8e1e674d7669a766ef44f" \
  -d '{
    "ad_id": 2399,
    "decision": "AUTO_APPROVED",
    "reason": "Admin reviewed the ad manually and confirmed it complies with marketplace policies.",
    "reviewer_id": 1
  }'
```

**Expected response (200):**
```json
{
  "success": true,
  "data": {
    "ad_id": 2399,
    "decision": "AUTO_APPROVED",
    "fayrouza_status": 1,
    "reason": "Admin reviewed the ad manually and confirmed it complies with marketplace policies.",
    "reviewer_id": 1,
    "overridden_at": "2026-04-25T12:00:00.000Z"
  }
}
```

### Test 9: Query the Audit Log

```bash
curl -X GET "http://54.38.240.143:3001/api/admin/audit?limit=10&offset=0" \
  -H "X-API-Key: fyr_adm_3392951e9021e03c5c2b7b37cd538be82fd64eb918d8e1e674d7669a766ef44f"
```

```bash
# Filter by specific ad
curl -X GET "http://54.38.240.143:3001/api/admin/audit?ad_id=2399" \
  -H "X-API-Key: fyr_adm_3392951e9021e03c5c2b7b37cd538be82fd64eb918d8e1e674d7669a766ef44f"
```

### Test 10: End-to-End Integration Test

Once all Laravel changes are deployed:

1. Create an ad via the Fayrouza app (or API)
2. The ad should be saved with `status = 3` (pending)
3. Check your Laravel logs — the `POST /api/ads/moderate` call should succeed with HTTP 202
4. Wait ~15–20 seconds
5. Check the ad status in your database — it should have been updated to `1` (approved) or `4` (rejected) by the AI detector callback
6. You can also check the audit log via the admin endpoint to see the full decision details

---

## 9. Error Handling & Edge Cases

### What happens if the AI detector is down?

Laravel's `Http::post()` call will time out (we set a 10-second timeout). The ad stays at `status = 3` (pending). It can be reviewed manually. Wrap the call in a try/catch (as shown in the code examples) to avoid breaking ad creation.

### What happens if the AI analysis fails?

The AI detector leaves the ad at `status = 3` (needs review). It will never auto-approve an ad that it failed to analyze.

### What happens if the callback to Laravel fails?

The AI detector retries up to 3 times with exponential backoff (5s, 10s, 20s). If all retries fail, the result is logged to the audit trail and can be viewed via `GET /api/admin/audit`. An admin can manually apply the decision using `POST /api/admin/override`.

### Rate Limits

| Endpoint | Rate Limit |
|---|---|
| `POST /webhook/moderate` | 30 requests/minute per IP |
| `POST /api/ads/moderate` | 100 requests/minute per IP |
| `POST /api/admin/override` | 20 requests/minute per IP |
| `GET /api/admin/audit` | 20 requests/minute per IP |

If rate limited, the response is:

```json
{
  "success": false,
  "error": "Too many requests to webhook endpoint",
  "code": "RATE_LIMITED"
}
```

HTTP status: **429 Too Many Requests**

### Scoring Logic

The AI assigns a confidence score (0–100) based on text and image analysis:

- **Score >= 80** → `AUTO_APPROVED` (status 1)
- **Score 40–79** → `NEEDS_REVIEW` (status 3)
- **Score < 40** → `AUTO_REJECTED` (status 4)
- **Either text or image says "reject"** → `AUTO_REJECTED` (status 4), regardless of score
- **Either text or image says "review"** → `NEEDS_REVIEW` (status 3), regardless of score

### What the AI Checks For

- **Haram/prohibited items:** Alcohol, gambling, drugs, sorcery, pork, interest-based finance
- **Egyptian-specific Arabic terms:** Local alcohol brand names, MLM/network marketing keywords
- **Pricing anomalies:** Unrealistic prices relative to market value
- **Scam indicators:** "Cash only", "phone only", get-rich-quick schemes
- **Image-text consistency:** Does the image match the ad description?
- **Image quality/policy:** Stolen images, watermarks from other platforms, inappropriate content
- **Non-Islamic items mislabeled as Islamic products**

---

## 10. Troubleshooting

| Problem | What to Check |
|---|---|
| Ad stays at `status = 3` forever | 1. Check Laravel logs for `POST /api/ads/moderate` errors 2. Verify `AD_DETECTOR_URL` and `AD_DETECTOR_INTERNAL_KEY` in `.env` 3. Test the AI detector health: `curl http://54.38.240.143:3001/health` |
| AI detector returns 401/403 | Verify the `X-API-Key` header matches exactly. Check no extra whitespace. |
| AI detector returns 400 | Check that all required fields are present in the JSON body: `ad_id`, `ad_title`, `ad_description`, `ad_price`, `ad_category` |
| Callback to `/ads/update/{id}` returns 401 | Verify `FAYROUZA_SERVICE_TOKEN` is correct. Ensure the route uses `auth:sanctum`. |
| Callback returns 403 | Ensure the service account bypass is in place for `ai-detector@internal.local` |
| Image not analyzed | Ensure the `image` URL is publicly accessible (not behind auth). The AI detector fetches the image server-side. |
| `config cache` issues | Run `php artisan config:cache` after changing `.env` or `config/services.php` |

---

## Quick Reference Card

### Laravel → AI Detector

```
POST http://54.38.240.143:3001/api/ads/moderate
Header: X-API-Key: fyr_int_f0ea05c3429a2a2bcece4a3e561792d2e2ee84f5dcc54a4d64c7a6fe6ae2196f
Body: { ad_id, ad_title, ad_description, ad_price, ad_category, image? }
Response: 202 { success: true, job_id: "...", estimated_seconds: 15 }
```

### AI Detector → Laravel

```
POST https://fayrouza.sdevelopment.tech/api/ads/update/{id}?status={1|3|4}
Header: Authorization: Bearer <FAYROUZA_SERVICE_TOKEN>
Body: { decision, score, reasoning, violations, concerns }
```

### Health Check

```
GET http://54.38.240.143:3001/health
(no auth required)
```
