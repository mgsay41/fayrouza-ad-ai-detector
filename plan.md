# Plan: Fayrouza Ad Moderation Express.js Backend

## Context

Replace the n8n cloud workflow with a production-grade Express.js + TypeScript backend.
Reorganize the repo into `frontend/` and `backend/` subfolders. Integrate with the
Fayrouza Laravel marketplace backend so ads are moderated automatically on creation.

**Final repo layout:**

```
fayrouza-ad-ai-detector/
├── frontend/    ← existing React Vite app (moved from root)
├── backend/     ← new Express.js moderation server
└── README.md
```

**Data flow:**

```
React Vite Frontend          Fayrouza Laravel Backend
  POST /webhook/moderate        POST /api/ads/moderate
  (sync, waits ~10s)            (async, returns 202 instantly)
          │                              │
          └──────────────┬──────────────┘
                         ▼
         EXPRESS.JS MODERATION BACKEND
                         │
              Google Gemini 2.5 Flash
            (text + image, in parallel)
                         │
         callback → Fayrouza Laravel Backend
           status: 1=approved / 3=review / 4=rejected
```

---

# PART A — Our App

## Phase 1 — Repo Restructure (move frontend)

Move all frontend files from the repo root into `frontend/` using `git mv` to preserve history.

**What moves into `frontend/`:**
`src/`, `public/`, `index.html`, `package.json`, `pnpm-lock.yaml`, `vite.config.ts`,
`tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json`, `tailwind.config.js`,
`postcss.config.js`, `components.json`, `eslint.config.js`, `.env`

**What stays at root:**
`.git/`, `.gitignore`, `README.md`, `Ad Moderation final.json`, `Fayrouza.postman_collection (1).json`

**Commands:**

```bash
mkdir frontend
git mv src frontend/src
git mv public frontend/public
git mv index.html frontend/index.html
git mv package.json frontend/package.json
git mv pnpm-lock.yaml frontend/pnpm-lock.yaml
git mv vite.config.ts frontend/vite.config.ts
git mv tsconfig.json frontend/tsconfig.json
git mv tsconfig.app.json frontend/tsconfig.app.json
git mv tsconfig.node.json frontend/tsconfig.node.json
git mv tailwind.config.js frontend/tailwind.config.js
git mv postcss.config.js frontend/postcss.config.js
git mv components.json frontend/components.json
git mv eslint.config.js frontend/eslint.config.js
git mv .env frontend/.env
cd frontend && pnpm install
```

**Root `.gitignore` additions:**

```
frontend/node_modules
backend/node_modules
backend/dist
backend/logs
```

**Verification:** `cd frontend && pnpm dev` — app still runs on port 5173.

---

## Phase 2 — Backend Scaffolding

Create `backend/` with all config files and the Express app skeleton.

**Files created:**

`backend/package.json` — dependencies:

```json
{
  "dependencies": {
    "@google/generative-ai": "^0.24.0",
    "axios": "^1.7.0",
    "bull": "^4.16.0",
    "cors": "^2.8.5",
    "dotenv": "^16.4.0",
    "express": "^4.19.0",
    "express-rate-limit": "^7.4.0",
    "morgan": "^1.10.0",
    "winston": "^3.14.0",
    "zod": "^3.23.0"
  },
  "devDependencies": {
    "@types/bull": "^4.10.0",
    "@types/cors": "^2.8.17",
    "@types/express": "^4.17.21",
    "@types/morgan": "^1.9.9",
    "@types/node": "^22.0.0",
    "tsx": "^4.19.0",
    "typescript": "^5.6.0"
  },
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js"
  }
}
```

`backend/src/config/index.ts` — reads and validates all env vars at startup; throws a clear
error if any required variable is missing so misconfigurations fail fast.

`backend/src/app.ts` — Express app factory (no `listen()` — keeps it testable):
JSON body parser, CORS, Morgan logging, all routers mounted, error handler last.

`backend/src/index.ts` — entry point: calls `createApp()` then `app.listen(PORT)`.

`backend/src/routes/health.ts` — `GET /health` returns server status, queue size, uptime.

`backend/src/middleware/auth.ts` — reads `X-API-Key` header, uses `crypto.timingSafeEqual`
to prevent timing attacks. Three separate keys for three scopes (webhook / internal / admin).

`backend/src/middleware/rateLimiter.ts` — per-route rate limits:

- `/webhook/*` → 30 req/min per IP
- `/api/ads/*` → 100 req/min per IP
- `/api/admin/*` → 20 req/min per IP

`backend/src/middleware/validate.ts` — wraps a Zod schema into Express middleware,
returns `400` with field-level errors on mismatch.

`backend/src/middleware/errorHandler.ts` — global error handler; logs to Winston,
returns `{ success: false, error: "...", code: "..." }`.

**Verification:** `GET /health` returns `{ "status": "ok" }`.

---

## Phase 3 — Gemini AI Services

**Files created:**

`backend/src/utils/parseGeminiJson.ts` — strips markdown code fences from Gemini responses
and safely parses the JSON. Handles all response formats Gemini uses.

`backend/src/utils/retry.ts` — exponential backoff: 3 attempts with 1s/2s/4s delays.
Retries on 429 and 503; does NOT retry on 400/401.

`backend/src/services/gemini/client.ts` — single `GoogleGenerativeAI` instance from env.

`backend/src/services/gemini/types.ts` — `GeminiTextResult` and `GeminiImageResult` interfaces.

`backend/src/services/gemini/textAnalysis.ts` — calls Gemini with the full enhanced
Islamic Sharia text prompt. Enhancements over the n8n version:

- Arabic haram keywords: `خمر`, `كحول`, `ربا`, `قمار`, `حشيش`, `خنزير`, `سحر`, `شعوذة`
- Egyptian-specific alcohol brand transliterations
- MLM / network marketing Arabic keywords (`تسويق شبكي`)
- Riba (interest-based finance) detection in installment descriptions
- Non-Islamic items mislabeled as Islamic products

`backend/src/services/gemini/imageAnalysis.ts` — fetches the image URL server-side and
converts it to a base64 inline part before sending to Gemini vision. This avoids Cloudinary
CDN redirect/CORS failures that occur when passing URLs directly. Falls back gracefully if
image URL is absent or the fetch fails.

**Verification:** Run both services with a hardcoded test ad and log the output.

---

## Phase 4 — Moderation Engine

**Files created:**

`backend/src/services/moderation/types.ts` — `ModerationRequest` and `ModerationResult`
interfaces including `fayrouza_status: 1 | 3 | 4`.

`backend/src/services/moderation/scoring.ts` — pure functions, no side effects:

```
if text.decision === 'reject' OR image.decision === 'reject'
    → AUTO_REJECTED  (status 4)

elif averageConfidence >= SCORE_AUTO_APPROVE (default 80)
    → AUTO_APPROVED  (status 1)

elif averageConfidence >= SCORE_NEEDS_REVIEW (default 40)
    → NEEDS_REVIEW   (status 3)

else
    → AUTO_REJECTED  (status 4)

If only one analysis is available (no image or image fetch failed):
    use that single score instead of an average.
```

`backend/src/services/moderation/engine.ts` — orchestrator:

1. Calls `analyzeText()` and `analyzeImage()` in parallel via `Promise.all()`
2. Passes results to `scoring.ts` for the decision
3. Writes full result to audit log
4. Returns `ModerationResult`

**Verification:** Unit test `scoring.ts` with various input combinations.

---

## Phase 5 — Sync Webhook Route (React Frontend)

**Files created:**

`backend/src/schemas/webhookRequest.ts` — Zod schema accepting BOTH n8n-style field names
(`ad_title`, `ad_description`, `image`) AND clean names (`title`, `description`, `imageUrl`).
The React frontend works with only the API key header change — nothing else in `api.ts`.

`backend/src/routes/webhook.ts` — `POST /webhook/moderate`:

- Auth: `WEBHOOK_API_KEY`, rate limit: 30/min
- Calls `engine.runModeration()` synchronously, awaits full result
- Returns in exact n8n format so `normalizeN8NResponse()` works unchanged:
  ```json
  {
    "success": true,
    "data": {
      "decision": "AUTO_APPROVED",
      "confidence_score": 87,
      "reasoning": "=== TEXT ANALYSIS ===\n...",
      "processed_at": "4/22/2026, 10:20:16 PM",
      "details": { "text_decision": "approve", "text_confidence": 90, ... }
    }
  }
  ```

**Verification:**

- POST a clean ad → `AUTO_APPROVED`
- POST `"title": "خمر مصري"` → `AUTO_REJECTED`
- Open `cd frontend && pnpm dev`, submit a real ad, see the result rendered

---

## Phase 6 — Fayrouza API Client

**Files created:**

`backend/src/services/fayrouza/client.ts` — Axios instance with `baseURL`, Bearer token,
`Accept: application/json`, 10s timeout, and Winston interceptors for all outbound calls.

`backend/src/services/fayrouza/adService.ts`:

- `updateAdStatus(adId, status)` → `POST /ads/update/{id}?status={status}` with retry
- `postCallback(callbackUrl, result)` → POSTs full `ModerationResult` to any given URL
- On retries exhausted: logs full result to audit so admin can apply it manually

`backend/src/utils/mapDecision.ts` — `AUTO_APPROVED→1`, `NEEDS_REVIEW→3`, `AUTO_REJECTED→4`

**Verification:** Call `updateAdStatus()` with a test ad, verify status changes in Fayrouza.

---

## Phase 7 — Async Route + Bull Queue (Laravel Integration)

**Files created:**

`backend/src/schemas/moderationRequest.ts` — Zod schema for the Laravel request:
`ad_id`, `ad_title`, `ad_description`, `ad_price`, `ad_category`, `image`, `user_id`,
`callback_url` (optional).

`backend/src/services/queue/moderationQueue.ts` — Bull queue backed by Redis:

- Processor: `engine.runModeration()` → `updateAdStatus()` → `postCallback()` if provided
- Gemini failure after retries: leaves ad at status `3`, logs failure
- Callback failure: logs full result to audit for manual recovery
- Bull prevents duplicate processing in PM2 cluster mode

`backend/src/routes/moderation.ts` — `POST /api/ads/moderate`:

- Auth: `INTERNAL_API_KEY`, rate limit: 100/min
- Adds job to Bull queue, returns `202 Accepted` immediately:
  ```json
  { "success": true, "job_id": "mod_2399_1745320816", "estimated_seconds": 15 }
  ```

**Verification:**

- POST → `202` + `job_id`
- After ~15s, `callback_url` receives the decision payload
- Fayrouza ad status changes from `3` to `1` or `4`

---

## Phase 8 — Admin Endpoints & Audit Trail

**Files created:**

`backend/src/services/audit/logger.ts` — Winston writing structured JSON lines to
`backend/logs/audit.log`. Each entry includes: `ad_id`, `job_id`, `decision`,
`confidence_score`, `violations`, `processing_ms`, `source`, `created_at`.

`backend/src/routes/admin.ts`:

- `POST /api/admin/override` — Auth: `ADMIN_API_KEY`
  Body: `{ ad_id, decision, reason, reviewer_id }` → updates Fayrouza status + audit log
- `GET /api/admin/audit` — Auth: `ADMIN_API_KEY`
  Params: `ad_id`, `decision`, `limit`, `offset` → returns paginated audit entries

**Verification:**

- Override a rejected ad to approved — check Fayrouza status and audit log entry
- Query audit for a specific `ad_id` — see full decision history

---

## Phase 9 — Frontend Wiring

**Two file changes only:**

`frontend/.env`:

```bash
VITE_N8N_WEBHOOK_URL=https://your-vps-domain.com/webhook/moderate
VITE_MODERATION_API_KEY=fyr_wh_...
```

`frontend/src/lib/api.ts` — add one header to the existing fetch call:

```typescript
'X-API-Key': import.meta.env.VITE_MODERATION_API_KEY || '',
```

No other changes. Response format is identical to n8n — all display components work as-is.

**Verification:** Submit a real ad from the React UI, see result with confidence bar and
violations list rendered correctly.

---

# PART B — Fayrouza Laravel Backend Changes

All changes are **purely additive** — no existing tables, endpoints, or logic is touched.

## Change 1 — New migration: `moderation_results` table

**Why:** The Express backend calls back with a full AI report (confidence, violations,
reasoning). Without this table the details are lost — only the status change survives.
This table also enables a future admin dashboard where sellers can see exactly why their
ad was rejected.

```sql
CREATE TABLE moderation_results (
  id               BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  ad_id            BIGINT UNSIGNED NOT NULL,
  job_id           VARCHAR(100),
  decision         ENUM('AUTO_APPROVED','AUTO_REJECTED','NEEDS_REVIEW') NOT NULL,
  confidence_score TINYINT UNSIGNED,
  reasoning        TEXT,
  text_analysis    JSON,
  image_analysis   JSON,
  violations       JSON,
  source           ENUM('gemini_analysis','admin_override') DEFAULT 'gemini_analysis',
  processed_at     TIMESTAMP,
  created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (ad_id) REFERENCES ads(id) ON DELETE CASCADE
);
```

## Change 2 — New endpoint: `POST /api/moderation/callback`

**Why:** This is the secure machine-to-machine endpoint the Express backend POSTs to
after finishing analysis. Without it there is no way for Express to send the decision back.
Protected by a dedicated Bearer token (`FAYROUZA_SERVICE_TOKEN`) so nothing can fake a
decision. On receipt: saves result to `moderation_results`, updates the ad status internally,
optionally sends a push notification to the ad owner.

## Change 3 — New Laravel Queue Job: `TriggerAdModerationJob`

**Why:** When a seller submits an ad, Laravel must forward it to Express asynchronously
via a Queue Job — NOT inline in the `create_ad` request. If done inline, the seller waits
10–15 seconds for AI analysis before getting a response (unacceptable UX). Instead: ad
is saved with `status=3` (pending) instantly, the seller gets a fast response, and the job
is dispatched. The queue worker POSTs to `https://your-vps.com/api/ads/moderate`.

Triggered by an Eloquent Observer on the `Ad` model — fires on every `created` event
where `status = 3`. Passes `ad_id`, all fields, image URL, and
`callback_url = https://fayrouza.sdevelopment.tech/api/moderation/callback`.

## Change 4 — Service account token

**Why:** The Express backend needs a Bearer token to call `/api/moderation/callback`.
Create a dedicated service account in the Fayrouza admin panel with minimum permissions
(moderation callback only). Copy the token into `backend/.env` as `FAYROUZA_SERVICE_TOKEN`.
If it leaks it cannot be used as a real user login or to access other API sections.

---

# PART C — VPS Hosting

## Phase 10 — Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 22 LTS via nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.0/install.sh | bash
source ~/.bashrc
nvm install 22 && nvm use 22
node --version   # v22.x.x

# Install Redis (required by Bull queue)
sudo apt install redis-server -y
sudo systemctl enable redis-server && sudo systemctl start redis-server
redis-cli ping   # should print PONG

# Install PM2 (process manager)
npm install -g pm2

# Install Nginx (reverse proxy)
sudo apt install nginx -y && sudo systemctl enable nginx

# Install Certbot (SSL)
sudo apt install certbot python3-certbot-nginx -y
```

Prerequisites:

- Ubuntu 22.04 LTS VPS (min 1 vCPU, 2GB RAM recommended)
- A domain pointed at the VPS IP (e.g. `moderation.yourdomain.com`)
- SSH access as a non-root sudo user

---

## Phase 11 — Deploy the Application

```bash
# Clone the repo
git clone https://github.com/your-org/fayrouza-ad-ai-detector.git /var/www/moderation
cd /var/www/moderation/backend

# Install production deps and compile TypeScript
npm ci --omit=dev
npm run build
mkdir -p logs

# Create .env from template
cp .env.example .env
nano .env
```

Fill in `backend/.env`:

```bash
PORT=3001
NODE_ENV=production

# Generate each with: openssl rand -hex 32
WEBHOOK_API_KEY=fyr_wh_...
INTERNAL_API_KEY=fyr_int_...
ADMIN_API_KEY=fyr_adm_...

GEMINI_API_KEY=your_real_key
GEMINI_MODEL=gemini-2.5-flash

FAYROUZA_API_URL=https://fayrouza.sdevelopment.tech/api
FAYROUZA_SERVICE_TOKEN=<token from Fayrouza admin panel>

REDIS_HOST=127.0.0.1
REDIS_PORT=6379
SCORE_AUTO_APPROVE=80
SCORE_NEEDS_REVIEW=40
CORS_ALLOWED_ORIGINS=https://your-react-app.com
```

---

## Phase 12 — Configure Nginx

```bash
sudo nano /etc/nginx/sites-available/moderation
```

```nginx
server {
    listen 80;
    server_name moderation.yourdomain.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name moderation.yourdomain.com;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;

    add_header X-Content-Type-Options nosniff;
    add_header X-Frame-Options DENY;
    add_header Referrer-Policy no-referrer;

    proxy_read_timeout 60s;
    proxy_connect_timeout 10s;

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/moderation /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

---

## Phase 13 — SSL Certificate

```bash
sudo certbot --nginx -d moderation.yourdomain.com
sudo certbot renew --dry-run   # verify auto-renewal works
```

---

## Phase 14 — Firewall

```bash
sudo ufw allow 22/tcp    # SSH — do this FIRST or you'll lock yourself out
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw deny 3001       # block direct Node.js access from outside
sudo ufw enable
sudo ufw status
```

---

## Phase 15 — Start with PM2

`backend/pm2.config.js`:

```javascript
module.exports = {
  apps: [
    {
      name: "fayrouza-moderation",
      script: "./dist/index.js",
      instances: 2,
      exec_mode: "cluster",
      watch: false,
      max_memory_restart: "300M",
      env_production: { NODE_ENV: "production" },
      log_file: "./logs/combined.log",
      error_file: "./logs/error.log",
      time: true,
    },
  ],
};
```

```bash
cd /var/www/moderation/backend
pm2 start pm2.config.js --env production
pm2 save
pm2 startup   # follow the printed sudo command exactly
pm2 status
```

---

## Phase 16 — Smoke Test & Ongoing Updates

**Smoke tests:**

```bash
# Health check
curl https://moderation.yourdomain.com/health

# Clean ad → should approve
curl -X POST https://moderation.yourdomain.com/webhook/moderate \
  -H "Content-Type: application/json" -H "X-API-Key: YOUR_WEBHOOK_API_KEY" \
  -d '{"title":"iPhone 15","description":"Excellent condition, barely used","price":15000,"category":"Electronics"}'

# Haram ad → should reject
curl -X POST https://moderation.yourdomain.com/webhook/moderate \
  -H "Content-Type: application/json" -H "X-API-Key: YOUR_WEBHOOK_API_KEY" \
  -d '{"title":"خمر مصري للبيع","description":"بيع زجاجات خمر","price":100,"category":"Food"}'

# Async Laravel path → should return 202
curl -X POST https://moderation.yourdomain.com/api/ads/moderate \
  -H "Content-Type: application/json" -H "X-API-Key: YOUR_INTERNAL_API_KEY" \
  -d '{"ad_id":1,"ad_title":"Test Ad","ad_description":"Great product","ad_price":500,"ad_category":"Electronics","callback_url":"https://webhook.site/your-test-id"}'
```

**Future deployments:**

```bash
cd /var/www/moderation && git pull origin main
cd backend && npm ci --omit=dev && npm run build
pm2 reload fayrouza-moderation   # zero-downtime reload
```

**Troubleshooting:**

| Problem                   | Check                                                     |
| ------------------------- | --------------------------------------------------------- |
| `502 Bad Gateway`         | `pm2 status` and `pm2 logs`                               |
| Gemini errors             | Verify `GEMINI_API_KEY`; check quota at Google AI Studio  |
| Jobs not processing       | `redis-cli ping`; check `pm2 logs` for Bull errors        |
| Callback to Laravel fails | Verify `FAYROUZA_SERVICE_TOKEN`; test with curl manually  |
| SSL errors                | `sudo certbot renew`; check domain DNS points to this VPS |

---

## End-to-End Verification Checklist

- [ ] `cd frontend && pnpm dev` — React app runs after the folder move
- [ ] `GET /health` returns `{ "status": "ok" }` with queue and uptime
- [ ] React frontend submits clean ad → shows `AUTO_APPROVED`
- [ ] React frontend submits `"title": "خمر مصري"` → shows `AUTO_REJECTED`
- [ ] `POST /api/ads/moderate` returns `202 Accepted` + `job_id`
- [ ] ~15s later, `callback_url` receives the full moderation payload
- [ ] Fayrouza ad status changes from `3` (pending) to `1` or `4`
- [ ] `POST /api/admin/override` on a rejected ad → status updates in Fayrouza
- [ ] `GET /api/admin/audit?ad_id=X` returns full decision history
- [ ] VPS smoke tests pass, PM2 shows 2 online workers
