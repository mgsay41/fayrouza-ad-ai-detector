# AI Ad Moderation Tester

A modern web application for testing an AI ad moderation system. Users submit ad details through a form, data is sent to an n8n webhook for AI analysis, and results are displayed with decision, confidence, reasoning, and recommendations.

## Features

- **Ad Submission Form**: Submit ads with title, description, price, category, and image
- **AI Analysis**: Send submissions to n8n webhook for AI moderation
- **Results Display**: View AI decision (Approve/Review/Reject), confidence score, reasoning, violations, and recommendations
- **Submission History**: Track all past submissions with filtering and export options
- **Dark/Light Mode**: Toggle between themes
- **RTL Support**: Support for right-to-left languages (Arabic)
- **Responsive Design**: Works on desktop, tablet, and mobile devices

## Tech Stack

- **Framework**: Vite + React 18 + TypeScript
- **Styling**: Tailwind CSS + shadcn/ui components
- **Form Handling**: React Hook Form + Zod validation
- **Icons**: Lucide React
- **Build Tool**: Vite 5

## Getting Started

### Prerequisites

- Node.js 18+ and pnpm

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd fayrouza-ad-ai-detector
```

2. Install dependencies:
```bash
pnpm install
```

3. Set up environment variables:

Copy the `.env.example` file to `.env`:

```bash
cp .env.example .env
```

Edit `.env` and configure your n8n webhook URL:

```env
VITE_N8N_WEBHOOK_URL=https://your-n8n-instance.com/webhook/your-webhook-path
```

> **Note**: If `VITE_N8N_WEBHOOK_URL` is not set, the app will use mock data for testing purposes.

### Development

Start the development server:

```bash
pnpm dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Production Build

Build for production:

```bash
pnpm build
```

Preview the production build:

```bash
pnpm preview
```

The built files will be in the `dist/` directory.

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_N8N_WEBHOOK_URL` | The n8n webhook URL for AI analysis | (uses mock data if not set) |

### Deploying with a Base Path

If you need to deploy your app to a subdirectory (e.g., `https://example.com/ad-detector/`), update the `base` option in `vite.config.ts`:

```typescript
export default defineConfig({
  base: '/ad-detector/',
  // ... rest of config
})
```

## API Response Format

The n8n webhook should return JSON in this format:

```json
{
  "decision": "Approve|Review|Reject",
  "confidence": 0.95,
  "reasoning": "Detailed explanation...",
  "violations": ["violation1", "violation2"],
  "recommendations": ["suggestion1", "suggestion2"]
}
```

### Request Payload

The app sends the following payload to the webhook:

```json
{
  "title": "Ad title",
  "description": "Ad description",
  "price": 100,
  "category": "Electronics",
  "imageData": "data:image/jpeg;base64,..."
}
```

## Project Structure

```
src/
├── components/
│   ├── form/          # Form-related components
│   ├── history/       # History management components
│   ├── layout/        # Layout components (header, footer)
│   ├── results/       # Results display components
│   └── ui/            # shadcn/ui base components
├── hooks/
│   ├── useAdHistory.ts    # History management hook
│   ├── useAdSubmission.ts # Form submission hook
│   ├── useTheme.tsx       # Theme management
│   ├── useRTL.tsx         # RTL/LTR support
│   └── use-toast.ts       # Toast notifications
├── lib/
│   ├── api.ts        # API calls to n8n webhook
│   ├── utils.ts      # Utility functions
│   └── validation.ts # Zod validation schemas
├── types/
│   └── index.ts      # TypeScript type definitions
└── App.tsx           # Main application component
```

## Available Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start development server |
| `pnpm build` | Build for production |
| `pnpm preview` | Preview production build |
| `pnpm lint` | Run ESLint |
| `pnpm type-check` | Run TypeScript type checking |

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## License

MIT

## Support

For issues and questions, please open an issue on the repository.
