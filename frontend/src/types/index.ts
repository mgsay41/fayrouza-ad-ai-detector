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

export interface ModerationApiResponse {
  success: boolean
  data: {
    decision: string
    confidence_score: number
    reasoning: string
    processed_at: string
    details?: {
      text_decision: string | null
      text_confidence: number | null
      text_reasoning: string | null
      text_violations: string[]
      text_concerns: string[]
      image_decision: string | null
      image_confidence: number | null
      image_reasoning: string | null
      image_violations: string[]
      image_concerns: string[]
    }
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
