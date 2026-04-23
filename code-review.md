# Fayrouza Ad AI Detector — Code Review

**Date:** 2026-04-23  
**Reviewer:** Claude Sonnet 4.6  
**Scope:** Full-stack review — backend (Node/Express/TypeScript) and frontend (React/TypeScript/Vite)

---

## Summary

| Severity | Count |
|----------|-------|
| 🔴 Critical | 3 |
| 🟠 Medium | 10 |
| 🟡 Low | 7 |
| **Total** | **20** |

---

## Backend

---

### 🔴 Critical

---

#### 1. SSRF via arbitrary `imageUrl` fetch

**File:** `backend/src/services/gemini/imageAnalysis.ts:98`

`fetchImageAsBase64` calls `fetch(imageUrl, ...)` with no host validation. A caller can supply internal addresses such as `http://169.254.169.254/latest/meta-data/` (AWS IMDS), `http://localhost:6379` (Redis), or any other internal service. The field is validated with `z.string().url()` in the schema, which only confirms URL syntax — not that the destination is safe.

**Impact:** An attacker with access to the webhook or internal moderation API can probe or exfiltrate data from internal infrastructure.

**Fix:**
```typescript
import { URL } from 'url';

function isSafeUrl(raw: string): boolean {
  try {
    const { protocol, hostname } = new URL(raw);
    if (!['http:', 'https:'].includes(protocol)) return false;
    if (/^(localhost|127\.|10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.|169\.254\.)/.test(hostname)) return false;
    return true;
  } catch {
    return false;
  }
}
```
Call `isSafeUrl(imageUrl)` before fetching and return `null` if it fails.

---

#### 2. SSRF via arbitrary `callback_url`

**File:** `backend/src/services/fayrouza/adService.ts:32`

`postCallback(callbackUrl, result)` passes an arbitrary absolute URL to `fayrouzaClient.post`. Axios overrides `baseURL` when given an absolute URL, so an attacker who controls `callback_url` in a moderation request can redirect the full moderation result (including reasoning and violation details) to any host, including internal services.

`callback_url` is only validated as `z.string().url().optional()` — same issue as above.

**Impact:** Sensitive moderation results can be exfiltrated; internal services can be probed.

**Fix:** Either whitelist allowed callback domains in config, or validate against the same `isSafeUrl` helper above before posting.

---

#### 3. Webhook API key exposed in frontend bundle

**Files:** `frontend/.env:6`, `frontend/src/lib/api.ts:8`

`VITE_MODERATION_API_KEY` is baked into the JavaScript bundle at build time and sent as `X-API-Key` in every request from the browser. Since Vite prefixes public env vars with `VITE_`, this value is visible to any user who opens DevTools or reads the JS bundle. This key maps directly to `WEBHOOK_API_KEY` on the backend, which authenticates the `/webhook/moderate` endpoint.

**Impact:** The webhook endpoint's authentication is fully bypassed by anyone who inspects the frontend.

**Fix:** Either move the webhook call to a Backend-for-Frontend (BFF) so the key never leaves the server, or treat `/webhook/moderate` as a public endpoint and rely solely on rate limiting for abuse prevention.

---

### 🟠 Medium

---

#### 4. Timing-safe comparison leaks key length

**File:** `backend/src/middleware/auth.ts:13`

```typescript
if (bufA.length !== bufB.length) {
  bufA.compare(bufB);  // result discarded; not timing-safe
  return false;
}
```

When buffer lengths differ the function returns immediately without calling `crypto.timingSafeEqual`. This leaks — via response time — whether the attacker's key has the correct byte-length, which significantly narrows a brute-force attack. The `bufA.compare()` call does not help because its result is discarded.

**Fix:**
```typescript
function timingSafeCompare(a: string, b: string): boolean {
  const bufA = Buffer.from(a, 'utf-8');
  const bufB = Buffer.from(b, 'utf-8');
  const len = Math.max(bufA.length, bufB.length);
  const paddedA = Buffer.alloc(len); bufA.copy(paddedA);
  const paddedB = Buffer.alloc(len); bufB.copy(paddedB);
  return crypto.timingSafeEqual(paddedA, paddedB);
}
```

---

#### 5. Synchronous file read blocks event loop

**File:** `backend/src/services/audit/logger.ts:57`

`queryAudit` calls `fs.readFileSync` on `audit.log`. This file can grow to megabytes in production and every call to `GET /api/admin/audit` freezes the entire Node.js event loop while reading, blocking all concurrent requests.

**Fix:** Replace with `fs.promises.readFile` and make `queryAudit` `async`:
```typescript
export async function queryAudit(filters: { ... }): Promise<AuditEntry[]> {
  const content = await fs.promises.readFile(logPath, 'utf-8');
  // ...
}
```

---

#### 6. Rate limiter ineffective behind reverse proxy

**File:** `backend/src/app.ts`

`express-rate-limit` identifies clients by `req.ip`. Without `app.set('trust proxy', 1)`, all requests forwarded through Nginx, Cloudflare, or any reverse proxy appear to come from the proxy's IP. This means all users share one counter and the limits trigger globally rather than per-client.

**Fix:** Add before mounting routes:
```typescript
app.set('trust proxy', 1);
```

---

#### 7. `processed_at` uses locale-dependent string format

**File:** `backend/src/services/moderation/engine.ts:65`

```typescript
processed_at: new Date().toLocaleString()  // e.g. "4/23/2026, 10:30:00 AM"
```

`toLocaleString()` produces a locale-dependent, non-standard string that cannot be reliably parsed by date libraries. The audit logger uses `toISOString()` for `created_at` — these formats should be consistent.

**Fix:**
```typescript
processed_at: new Date().toISOString()
```

---

#### 8. Chinese characters in Arabic/English prompt

**File:** `backend/src/services/gemini/textAnalysis.ts:90`

```
- Saudi-specific:能量的 / energy drinks are OK
```

`能量的` is Chinese ("energy's") — a copy-paste error. This injects unexpected characters into the Gemini prompt, which could confuse the model or produce unexpected behaviour for edge cases around energy drinks.

**Fix:**
```
- Saudi-specific: مشروبات الطاقة / energy drinks are OK
```

---

#### 9. No graceful drain on queue shutdown

**File:** `backend/src/index.ts:21`, `backend/src/services/queue/moderationQueue.ts`

On `SIGTERM`/`SIGINT`, the process calls `moderationQueue.close()` immediately without waiting for in-flight jobs to finish. Bull jobs that are mid-processing can be left in a stalled state and retried unnecessarily.

**Fix:**
```typescript
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received — shutting down gracefully');
  await moderationQueue.pause(true);   // stop pulling new jobs
  // optionally: wait for active count to reach 0 with a timeout
  await moderationQueue.close();
  process.exit(0);
});
```

---

#### 10. Missing `category` non-empty validation in webhook schema

**File:** `backend/src/schemas/webhookRequest.ts`

After the transform, `title` and `description` are checked with `.refine()` for non-empty values, but `category` defaults silently to `""`. An empty category string is passed to Gemini and degrades analysis quality without any error.

**Fix:** Add a third refine:
```typescript
.refine((data) => data.category.length > 0, {
  message: "Either 'category' or 'ad_category' is required",
  path: ['category'],
})
```

---

### 🟡 Low

---

#### 11. Duplicate `ModerationRequest` type

Two separate types share the same name:
- `backend/src/schemas/moderationRequest.ts` — schema output with `ad_id: number` (required) and `callback_url`
- `backend/src/services/moderation/types.ts` — engine type with `ad_id?: number` (optional), no `callback_url`

The queue imports from schemas; the engine imports from types. They are structurally compatible today but will diverge silently as the codebase evolves.

**Fix:** Unify into one canonical type or rename one to avoid collision (e.g. `ModerationEngineRequest`).

---

#### 12. `confidence_score` sent as string in webhook response

**File:** `backend/src/routes/webhook.ts:40`

```typescript
confidence_score: String(result.final_score)
```

The frontend immediately parses it back with `parseInt`. Sending the number directly would remove the string-roundtrip and be more consistent with other numeric fields in the response.

---

## Frontend

---

### 🟠 Medium

---

#### 13. Unvalidated data parsed from localStorage

**File:** `frontend/src/hooks/useAdHistory.ts:29`

```typescript
const parsed = JSON.parse(stored)  // trusted without validation
```

All fields — including `decision`, `confidence`, `timestamp`, and `violations` — are used directly from the parsed value. If localStorage is corrupted (quota overflow, manual edit, or an XSS payload), this can cause silent rendering errors or unexpected UI state.

**Fix:** Validate the parsed value with a Zod schema matching `AdHistoryItem` before calling `setHistory`.

---

#### 14. Base64 image data exhausts localStorage quota silently

**File:** `frontend/src/hooks/useAdHistory.ts`

Each history entry stores the full base64-encoded image (up to 5MB per entry × 50 max items). LocalStorage is capped at ~5–10MB depending on the browser. Writes fail silently — the `catch` block only logs to the console. Users lose history data with no feedback.

**Fix:** Either omit `imageData` from localStorage (reload from the Cloudinary URL stored in the moderation payload), or catch `QuotaExceededError` specifically and show a user-visible warning:
```typescript
} catch (error) {
  if (error instanceof DOMException && error.name === 'QuotaExceededError') {
    // notify user
  }
  console.error('Failed to save history:', error);
}
```

---

#### 15. `window.confirm()` used for destructive action

**File:** `frontend/src/App.tsx:184`

```typescript
if (confirm(t.history.clearAllConfirm)) {
```

`window.confirm()` is synchronous, visually inconsistent with the app's design system, and can be suppressed by browser automation or certain browser settings.

**Fix:** Use the `<Dialog>` component already present in `frontend/src/components/ui/dialog.tsx`.

---

#### 16. `getDecisionLabel` missing from `useEffect` dependency array

**File:** `frontend/src/App.tsx:36`, `App.tsx:92`

`getDecisionLabel` is defined inline (not memoized) and used inside the `useEffect` at line 48, but it is absent from the dependency array at line 92. React will emit an `exhaustive-deps` ESLint warning and the stale-closure bug could surface if translations change at runtime without triggering the effect.

**Fix:** Either move `getDecisionLabel` inside the effect body, or wrap it in `useCallback` (capturing `t`) and add it to the dependency array.

---

#### 17. `NaN` confidence propagates on malformed webhook response

**File:** `frontend/src/lib/api.ts:105`

```typescript
const rawConfidence = stripPrefix(data.confidence_score)
const confidence = parseInt(rawConfidence, 10) / 100
```

If `confidence_score` is `""`, `"="`, or missing, `parseInt` returns `NaN`. `NaN / 100` is still `NaN`. This propagates silently to `ConfidenceBar` and the toast percentage display.

**Fix:**
```typescript
const confidence = (parseInt(rawConfidence, 10) || 0) / 100
```

---

### 🟡 Low

---

#### 18. Dead `mockSubmitAdToWebhook` export

**File:** `frontend/src/lib/api.ts:227`

The mock function is exported but `App.tsx` never calls it (it always passes `false` as `useMock`). It increases bundle size, may confuse future developers, and contains naive detection logic that does not match production behaviour.

**Fix:** Remove the export. Keep a local version in a test/fixtures file if needed for unit tests.

---

#### 19. Misleading `useMock = true` default in `useAdSubmission`

**File:** `frontend/src/hooks/useAdSubmission.ts:38`

The hook's `submit` function defaults `useMock` to `true`, implying mock is the safe default. However, `App.tsx` always overrides this with `false`. A future caller who relies on the default will silently get mock data instead of hitting the real API.

**Fix:** Default to `false`, matching the only caller's intent.

---

#### 20. Translated category values bypass English enum validation

**File:** `frontend/src/lib/validation.ts`

`getCategories(t)` returns translated strings (e.g. `إلكترونيات` in Arabic) as `<option>` values, and these are what gets submitted to the backend. The `categoryValues` constant and the Zod enum are English-only. If the backend ever adds strict category validation (which it currently does not), Arabic-language submissions would fail silently.

**Fix:** Submit a stable English key as the option value, and use the translated label only for display.

---

## Overall Assessment

The core moderation logic (Gemini integration, scoring, retry, queue) is well-structured and readable. The main concerns before production deployment are the three critical items — both SSRF vectors and the exposed API key — as they represent concrete, exploitable vulnerabilities. The medium items (sync file read, rate-limiter proxy config, localStorage quota) should be addressed before launch. The low items are code quality improvements that reduce future maintenance risk.
