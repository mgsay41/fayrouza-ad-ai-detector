# Fayrouza Ad AI Detector

AI-powered ad moderation system for the Fayrouza marketplace. Ads are automatically analyzed by Gemini AI and approved, flagged for review, or rejected based on content quality, pricing, and policy compliance.

## Repo Structure

```
fayrouza-ad-ai-detector/
├── backend/   # Express + TypeScript moderation API (Gemini AI, Redis queue)
└── frontend/  # React + Vite admin UI for manual testing and history
```

---

## Backend

Express.js + TypeScript service that receives ads via webhook, runs Gemini AI analysis, and posts the decision back to the Fayrouza marketplace API.

### Tech Stack

- **Runtime**: Node.js 20 + TypeScript
- **Framework**: Express.js
- **AI**: Google Gemini 2.5 Flash (text + image analysis)
- **Queue**: In-memory queue with configurable concurrency
- **Deployment**: Docker + docker-compose

### Getting Started

```bash
cd backend
cp .env.example .env   # fill in GEMINI_API_KEY and other values
npm install
npm run dev
```

Server starts on `http://localhost:3001`.

### Environment Variables

See [backend/.env.example](backend/.env.example) for the full list. Key variables:

| Variable | Description |
|----------|-------------|
| `GEMINI_API_KEY` | Google AI Studio API key |
| `GEMINI_MODEL` | Model to use (default: `gemini-2.5-flash`) |
| `FAYROUZA_API_URL` | Fayrouza marketplace API base URL |
| `FAYROUZA_SERVICE_TOKEN` | Service account token for posting decisions |
| `WEBHOOK_API_KEY` | Key Fayrouza sends in `x-api-key` header |
| `QUEUE_CONCURRENCY` | Parallel moderation jobs (1 for free Gemini tier) |
| `SCORE_AUTO_APPROVE` | Score threshold for auto-approval (default: 80) |
| `SCORE_NEEDS_REVIEW` | Score threshold below which ad goes to review (default: 40) |

### Docker

```bash
cd backend
docker-compose up --build
```

### API Endpoints

Import [Fayrouza.postman_collection.json](Fayrouza.postman_collection.json) for full request examples.

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/webhook/ad-created` | Receive new ad from Fayrouza (async) |
| `POST` | `/api/moderation/analyze` | Synchronous moderation (UI/testing) |
| `GET`  | `/api/admin/audit` | Query audit log |
| `POST` | `/api/admin/override` | Manual decision override |
| `GET`  | `/health` | Health check |

---

## Frontend

React + Vite UI for manually submitting ads and reviewing moderation history.

### Tech Stack

- **Framework**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS + shadcn/ui
- **i18n**: Arabic / English with RTL support

### Getting Started

```bash
cd frontend
cp .env.example .env   # set VITE_API_URL to backend URL
pnpm install
pnpm dev
```

Opens at `http://localhost:5173`.

### Environment Variables

| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | Backend URL (default: `http://localhost:3001`) |
| `VITE_MODERATION_API_KEY` | Must match backend `WEBHOOK_API_KEY` |
| `VITE_CLOUDINARY_CLOUD_NAME` | Cloudinary cloud for image uploads |
| `VITE_CLOUDINARY_UPLOAD_PRESET` | Cloudinary unsigned upload preset |

---

## License

MIT
