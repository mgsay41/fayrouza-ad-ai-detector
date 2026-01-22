# AI Ad Moderation Tester - Development Tasks

## Project Overview
A modern web application for testing an AI ad moderation system. Users submit ad details through a form, data is sent to an n8n webhook for AI analysis, and results are displayed with decision, confidence, reasoning, and recommendations.

**Tech Stack**: Vite + React + TypeScript + shadcn/ui + Tailwind CSS

---

## Phase 1: Project Setup

### 1.1 Initialize Project
- [ ] Create new Vite + React + TypeScript project: `pnpm create vite@latest . --template react-ts`
- [ ] Install dependencies: `pnpm install`
- [ ] Initialize shadcn/ui: `pnpm dlx shadcn@latest init`
- [ ] Configure Tailwind CSS for dark mode and RTL support
- [ ] Set up project folder structure:
  ```
  src/
  ├── components/
  │   ├── ui/           # shadcn components
  │   ├── form/         # Form-related components
  │   ├── results/      # Results display components
  │   └── layout/       # Layout components
  ├── lib/
  │   └── utils.ts      # Utilities (cn function, etc.)
  ├── hooks/
  │   └── useTheme.ts   # Theme hook
  ├── types/
  │   └── index.ts      # TypeScript types
  └── App.tsx
  ```

### 1.2 Install Additional Dependencies
- [ ] lucide-react for icons
- [ ] date-fns for date formatting (if needed)

### 1.3 Configure shadcn/ui Components
- [ ] Add required components: `button`, `input`, `textarea`, `select`, `label`, `card`, `badge`, `progress`, `spinner`, `dialog`, `switch`, `toast`
- [ ] Configure theme provider for dark/light mode
- [ ] Add RTL support configuration

---

## Phase 2: Type Definitions & Utilities

### 2.1 Create TypeScript Types
- [ ] Define `AdSubmission` type:
  ```typescript
  title: string
  description: string
  price: number
  category: string
  image: File | null
  ```

- [ ] Define `AIResponse` type:
  ```typescript
  decision: 'Approve' | 'Review' | 'Reject'
  confidence: number
  reasoning: string
  violations?: string[]
  recommendations?: string[]
  rawResponse?: unknown
  responseTime?: number
  timestamp: Date
  ```

- [ ] Define `AdHistoryItem` type (combines above + id)

### 2.2 Create Utility Functions
- [ ] `cn()` function for className merging (already from shadcn)
- [ ] `formatResponseTime(ms: number)` - Format milliseconds to readable time
- [ ] `getDecisionColor(decision: string)` - Return color for decision badge
- [ ] `base64ToFile()` - Convert base64 back to file for preview
- [ ] `exportToJSON()` - Export history/results to JSON file

---

## Phase 3: Layout & Theme

### 3.1 Theme Provider & Toggle
- [ ] Create `ThemeProvider` component with context
- [ ] Create `ThemeToggle` component (sun/moon icon button)
- [ ] Implement dark mode persistence in localStorage
- [ ] Apply dark mode classes to root element

### 3.2 RTL Provider & Toggle
- [ ] Create `RTLProvider` component with context
- [ ] Create `LanguageToggle` component (EN/AR button)
- [ ] Implement RTL direction switching
- [ ] Add appropriate RTL styles to Tailwind config

### 3.3 Main Layout
- [ ] Create `Layout` component with header
- [ ] Add app title/logo
- [ ] Position theme and language toggles in header
- [ ] Create responsive container with proper spacing

---

## Phase 4: Form Components

### 4.1 Ad Submission Form
- [ ] Create `AdSubmissionForm` component
- [ ] Add form fields:
  - [ ] Title input (text, required, max length 100)
  - [ ] Description textarea (required, max length 1000)
  - [ ] Price input (number, min 0)
  - [ ] Category dropdown (select with predefined options)
  - [ ] Image upload (file input, accept images only)
- [ ] Add image preview component
- [ ] Add form validation (Zod or react-hook-form)
- [ ] Add error messages for each field

### 4.2 Form Actions
- [ ] Create `ClearButton` component to reset form
- [ ] Create `SampleDataButton` to fill form with test data
- [ ] Create `SubmitButton` with loading state

### 4.3 Form Validation
- [ ] Implement client-side validation
- [ ] Show validation errors inline
- [ ] Disable submit button until form is valid
- [ ] Show character count for title and description

---

## Phase 5: API Integration

### 5.1 Webhook Service
- [ ] Create `submitAdToWebhook()` function
- [ ] Handle multipart/form-data conversion
- [ ] Convert image to base64 for sending
- [ ] Implement proper error handling for network errors
- [ ] Add timeout handling
- [ ] Handle CORS if needed (configure n8n)

### 5.2 Submission Hook
- [ ] Create `useAdSubmission()` custom hook
- [ ] Handle loading state during API call
- [ ] Handle success/error responses
- [ ] Track response time
- [ ] Return submission state and handlers

---

## Phase 6: Results Display

### 6.1 Results Container
- [ ] Create `ResultsDisplay` component
- [ ] Show/hide based on submission state
- [ ] Add loading spinner during submission
- [ ] Handle empty state

### 6.2 Decision Badge
- [ ] Create `DecisionBadge` component
- [ ] Color coding: Green (Approve), Orange (Review), Red (Reject)
- [ ] Add icon for each decision type
- [ ] Animate badge appearance

### 6.3 Confidence Score
- [ ] Create `ConfidenceBar` component using Progress
- [ ] Show percentage value
- [ ] Color-code based on confidence level
- [ ] Animate progress bar fill

### 6.4 Details Sections
- [ ] Create `ReasoningSection` to display AI reasoning
- [ ] Create `ViolationsSection` for violations list (if any)
- [ ] Create `RecommendationsSection` for recommendations (if any)
- [ ] Add appropriate icons for each section

### 6.5 JSON Viewer
- [ ] Create `JSONViewer` collapsible component
- [ ] Syntax highlighting for JSON
- [ ] Copy to clipboard button
- [ ] Toggle expand/collapse

### 6.6 Response Time
- [ ] Display response time in ms
- [ ] Add icon and label

---

## Phase 7: History Management

### 7.1 History Storage
- [ ] Create `useAdHistory()` custom hook
- [ ] Save submissions to localStorage
- [ ] Load history on app mount
- [ ] Implement max history limit (e.g., last 50 items)
- [ ] Handle localStorage errors gracefully

### 7.2 History Display
- [ ] Create `HistoryList` component
- [ ] Show summary cards for each submission
- [ ] Add delete button for individual items
- [ ] Add clear all button
- [ ] Show decision badge on each history item

### 7.3 History Actions
- [ ] Create `ExportButton` to export all history as JSON
- [ ] Create `HistoryDetail` modal to view full results
- [ ] Add filter/search functionality (optional)

---

## Phase 8: Polish & UX Enhancements

### 8.1 Loading States
- [ ] Add skeleton loaders during initial load
- [ ] Add spinner during form submission
- [ ] Disable form inputs during submission

### 8.2 Error Handling
- [ ] Create error toast notifications
- [ ] Show user-friendly error messages
- [ ] Add retry button on failure
- [ ] Handle network timeouts

### 8.3 Copy to Clipboard
- [ ] Add copy button for AI response
- [ ] Show toast confirmation on copy
- [ ] Handle clipboard errors

### 8.4 Sample Test Data
- [ ] Create predefined test cases:
  - [ ] Clean ad (should Approve)
  - [ ] Suspicious ad (should Review)
  - [ ] Violating ad (should Reject)
- [ ] Add button to populate form with sample data

### 8.5 Animations & Transitions
- [ ] Add fade-in animation for results
- [ ] Add slide-in animation for form validation errors
- [ ] Add hover states for buttons
- [ ] Add smooth transitions for theme toggle

---

## Phase 9: Configuration & Environment

### 9.1 Environment Variables
- [ ] Create `.env.example` with N8N_WEBHOOK_URL placeholder
- [ ] Add instructions for setting up webhook URL
- [ ] Support different environments (dev/prod)

### 9.2 Build Configuration
- [ ] Configure Vite for production build
- [ ] Set up proper base path if needed
- [ ] Optimize bundle size

---

## Phase 10: Testing & Documentation

### 10.1 Testing Checklist
- [ ] Test form validation with empty inputs
- [ ] Test form validation with invalid data
- [ ] Test image upload with various formats
- [ ] Test image upload with large files
- [ ] Test submission with valid data
- [ ] Test submission with API errors
- [ ] Test submission with network timeout
- [ ] Test dark mode toggle
- [ ] Test RTL toggle
- [ ] Test history persistence across sessions
- [ ] Test export to JSON
- [ ] Test copy to clipboard
- [ ] Test on mobile devices
- [ ] Test on different browsers

### 10.2 Documentation
- [ ] Create README.md with:
  - [ ] Project overview
  - [ ] Installation instructions
  - [ ] Environment setup
  - [ ] Usage guide
  - [ ] Configuration options
- [ ] Add inline code comments for complex logic
- [ ] Document API response format expected from n8n

---

## Optional Enhancements (Future)

- [ ] Add multiple image upload support
- [ ] Add batch testing (test multiple ads at once)
- [ ] Add statistics/analytics dashboard
- [ ] Add ability to edit and resubmit ads
- [ ] Add webhook URL configuration in UI
- [ ] Add history search and filter
- [ ] Add comparison view for multiple submissions
- [ ] Add keyboard shortcuts
- [ ] Add PWA support
- [ ] Add export to CSV/PDF

---

## API Response Format Expected

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

---

## Priority Order

1. **Must Have** (MVP): Phases 1-6
2. **Should Have**: Phase 7
3. **Nice to Have**: Phase 8
4. **Final**: Phases 9-10

---

## Notes

- All components should be reusable and follow React best practices
- Use TypeScript strictly - no `any` types
- Follow shadcn/ui patterns for consistency
- Ensure accessibility (ARIA labels, keyboard navigation)
- Mobile-first responsive design
- RTL support must work for all components
