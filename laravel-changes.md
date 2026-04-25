# Laravel — AI Moderation Integration

Two things only:
1. Call the detector when a new ad is created
2. The detector calls back to update the ad status

---

## What the detector sends back to Laravel

The detector calls the existing route `POST /ads/update/{id}?status={N}` after analysis.

- **Auth:** `Authorization: Bearer {FAYROUZA_SERVICE_TOKEN}`
- **No request body** — status is in the query string only
- **Status values:**

| `status` param | Meaning         |
|---------------|-----------------|
| `1`           | AUTO_APPROVED   |
| `3`           | NEEDS_REVIEW    |
| `4`           | AUTO_REJECTED   |

**Example call the detector makes:**
```
POST https://fayrouza.sdevelopment.tech/api/ads/update/2399?status=1
Authorization: Bearer <FAYROUZA_SERVICE_TOKEN>
```

For this to work, the `/ads/update/{id}` route must:
- Accept `auth:sanctum` (Bearer token), not session-only auth
- Allow the service account (`ai-detector@internal.local`) to update any ad, not just their own

---

## What Laravel needs to send to the detector

**On ad creation**, call `POST {AD_DETECTOR_URL}/api/ads/moderate`:

- **Auth header:** `X-API-Key: {AD_DETECTOR_INTERNAL_KEY}`
- **Body (JSON):**

```json
{
  "ad_id": 2399,
  "ad_title": "iPhone 13",
  "ad_description": "Used iPhone 13, excellent condition",
  "ad_price": 15000,
  "ad_category": "Electronics",
  "image": "https://fayrouza.sdevelopment.tech/storage/2399/photo.jpg"
}
```

**Response is instant (202)** — the detector queues the job and responds immediately:
```json
{ "success": true, "job_id": "mod_2399_...", "estimated_seconds": 15 }
```
~15 seconds later the detector calls back to `/ads/update/{id}?status=N`.

---

## Changes needed in Laravel

### 1 — `.env`

```dotenv
AD_DETECTOR_URL=https://your-detector-domain.com
AD_DETECTOR_INTERNAL_KEY=fyr_int_your_strong_key_here
```

### 2 — `config/services.php`

```php
'ad_detector' => [
    'url'          => env('AD_DETECTOR_URL'),
    'internal_key' => env('AD_DETECTOR_INTERNAL_KEY'),
],
```

### 3 — `create_ad` controller (add after saving the ad)

```php
use Illuminate\Support\Facades\Http;

// After $ad->save() — set ad to pending and trigger detection
$ad->status = 3;
$ad->save();

$categoryName = optional($ad->category)->name ?? optional($ad->adType)->name ?? 'General';
$imageUrl = $ad->image ? url('storage/' . $ad->image) : null;
$title = is_array($ad->name) ? ($ad->name['en'] ?? $ad->name['ar'] ?? '') : $ad->name;
$description = is_array($ad->description) ? ($ad->description['en'] ?? $ad->description['ar'] ?? '') : $ad->description;

Http::withHeaders(['X-API-Key' => config('services.ad_detector.internal_key')])
    ->timeout(10)
    ->post(config('services.ad_detector.url') . '/api/ads/moderate', [
        'ad_id'          => $ad->id,
        'ad_title'       => $title,
        'ad_description' => $description,
        'ad_price'       => (float) ($ad->price ?? 0),
        'ad_category'    => $categoryName,
        'image'          => $imageUrl,
    ]);
```

### 4 — Allow service account to update any ad status

Create the service account once in tinker:

```php
$user = \App\Models\User::firstOrCreate(['email' => 'ai-detector@internal.local'], [
    'name' => 'AI Detector', 'password' => bcrypt(\Str::random(32)),
    'phone' => '00000000000', 'dial_code' => '+20', 'country_id' => 1, 'city_id' => 1,
]);
echo $user->createToken('ai-detector')->plainTextToken; // → paste into detector .env as FAYROUZA_SERVICE_TOKEN
```

Then in the `ads/update/{id}` controller or policy, add a bypass so the service account can update any ad:

```php
if (auth()->user()->email === 'ai-detector@internal.local') {
    // allowed — skip ownership check
} else {
    // your existing check here
}
```

Make sure the route uses `auth:sanctum` so Bearer tokens work:
```php
Route::post('/ads/update/{id}', [AdController::class, 'update'])->middleware('auth:sanctum');
```

### 5 — After changes

```bash
php artisan config:cache
php artisan route:cache
```
