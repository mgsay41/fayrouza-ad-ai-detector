export interface AdSubmission {
  title: string
  description: string
  price: number
  category: Category
  image: File | null
}

export type Category =
  | 'Electronics'
  | 'Vehicles'
  | 'Real Estate'
  | 'Clothing'
  | 'Home & Garden'
  | 'Services'
  | 'Other'

export type Decision = 'Approve' | 'Review' | 'Reject'

export interface AIResponse {
  decision: Decision
  confidence: number
  reasoning: string
  violations?: string[]
  recommendations?: string[]
  rawResponse?: unknown
  responseTime?: number
  timestamp: Date
}

export interface AdHistoryItem extends AIResponse {
  id: string
  adData: {
    title: string
    description: string
    price: number
    category: Category
    imageData?: string
  }
}

export interface WebhookPayload {
  title: string
  description: string
  price: number
  category: Category
  imageUrl?: string
}

// Raw webhook response format from n8n
export interface N8NWebhookResponse {
  success: boolean
  data: {
    decision: string      // Format: "=AUTO_APPROVED", "=AUTO_REJECTED", "=MANUAL_REVIEW"
    confidence_score: string  // Format: "=100" (string with = prefix)
    reasoning: string     // Format: "=Content violates..."
    processed_at: string  // Format: "=1/22/2026, 10:20:16 PM"
  }
}

// Internal webhook response format (normalized)
export interface WebhookResponse {
  decision: Decision
  confidence: number
  reasoning: string
  violations?: string[]
  recommendations?: string[]
}

export interface SampleData {
  title: string
  description: string
  price: number
  category: Category
  expectedDecision: Decision
}

// Re-export form data type from validation
export type { AdSubmissionFormData } from '../lib/validation'
