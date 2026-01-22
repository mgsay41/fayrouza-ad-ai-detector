import type { AdSubmissionFormData, WebhookPayload, WebhookResponse, N8NWebhookResponse, Decision } from '../types'

const WEBHOOK_URL = import.meta.env.VITE_N8N_WEBHOOK_URL || ''
const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || ''
const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || ''
const REQUEST_TIMEOUT = 30000 // 30 seconds

export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public response?: unknown
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

/**
 * Upload an image to Cloudinary using unsigned upload preset
 * @param file The file to upload
 * @returns The secure URL of the uploaded image
 */
export async function uploadToCloudinary(file: File): Promise<string> {
  // Validate Cloudinary configuration
  if (!CLOUDINARY_CLOUD_NAME) {
    throw new ApiError(
      'Cloudinary cloud name is not configured. Please set VITE_CLOUDINARY_CLOUD_NAME environment variable.'
    )
  }

  if (!CLOUDINARY_UPLOAD_PRESET) {
    throw new ApiError(
      'Cloudinary upload preset is not configured. Please set VITE_CLOUDINARY_UPLOAD_PRESET environment variable.'
    )
  }

  // Create form data for upload
  const formData = new FormData()
  formData.append('file', file)
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET)
  formData.append('folder', 'ad-detector') // Organize uploads in a folder

  try {
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
      {
        method: 'POST',
        body: formData,
      }
    )

    if (!response.ok) {
      let errorMessage = `Cloudinary upload failed! status: ${response.status}`
      try {
        const errorData = await response.json()
        errorMessage = errorData.error?.message || errorData.message || errorMessage
      } catch {
        // If we can't parse error as JSON, use default message
      }
      throw new ApiError(errorMessage, response.status)
    }

    const result = await response.json()

    if (!result.secure_url) {
      throw new ApiError('Invalid response from Cloudinary: missing secure_url')
    }

    return result.secure_url
  } catch (error) {
    if (error instanceof ApiError) {
      throw error
    }
    throw new ApiError(
      error instanceof Error ? error.message : 'Failed to upload image to Cloudinary'
    )
  }
}

/**
 * Normalize n8n webhook response to internal format
 * Handles n8n expression format (= prefix) and maps decision values
 */
function normalizeN8NResponse(n8nResponse: N8NWebhookResponse): WebhookResponse {
  const { data } = n8nResponse

  // Helper to strip = prefix from n8n expression values
  const stripPrefix = (value: string): string => value.startsWith('=') ? value.slice(1) : value

  // Normalize decision: AUTO_APPROVED -> Approve, AUTO_REJECTED -> Reject, MANUAL_REVIEW -> Review
  const decisionMap: Record<string, Decision> = {
    'AUTO_APPROVED': 'Approve',
    'AUTO_REJECTED': 'Reject',
    'MANUAL_REVIEW': 'Review',
    'APPROVED': 'Approve',
    'REJECTED': 'Reject',
    'REVIEW': 'Review',
  }

  const rawDecision = stripPrefix(data.decision).toUpperCase()
  const decision = decisionMap[rawDecision] || 'Review'

  // Parse confidence from "=100" to 1.0
  const rawConfidence = stripPrefix(data.confidence_score)
  const confidence = parseInt(rawConfidence, 10) / 100

  // Strip = prefix from reasoning
  const reasoning = stripPrefix(data.reasoning)

  return {
    decision,
    confidence,
    reasoning,
  }
}

export async function submitAdToWebhook(
  data: AdSubmissionFormData & { imageFile: File | null }
): Promise<{ response: WebhookResponse; responseTime: number }> {
  const startTime = performance.now()

  // Validate webhook URL
  if (!WEBHOOK_URL) {
    throw new ApiError(
      'Webhook URL is not configured. Please set VITE_N8N_WEBHOOK_URL environment variable.'
    )
  }

  try {
    // Upload image to Cloudinary first if present
    let imageUrl: string | undefined
    if (data.imageFile) {
      imageUrl = await uploadToCloudinary(data.imageFile)
    }

    // Prepare payload with Cloudinary URL instead of base64
    const payload: WebhookPayload = {
      title: data.title,
      description: data.description,
      price: data.price,
      category: data.category,
      imageUrl,
    }

    // Create abort controller for timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT)

    try {
      // Send request to n8n webhook with image URL
      const response = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      // Check for HTTP errors
      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`
        try {
          const errorData = await response.json()
          errorMessage = errorData.message || errorData.error || errorMessage
        } catch {
          // If we can't parse error as JSON, use default message
        }
        throw new ApiError(errorMessage, response.status)
      }

      // Parse response as n8n format
      const n8nResult = (await response.json()) as N8NWebhookResponse

      // Validate response structure
      if (!n8nResult.success || !n8nResult.data) {
        throw new ApiError('Invalid response format from webhook: missing success or data')
      }

      // Normalize n8n response to internal format
      const normalizedResponse = normalizeN8NResponse(n8nResult)

      const responseTime = performance.now() - startTime

      return { response: normalizedResponse, responseTime }
    } catch (error) {
      clearTimeout(timeoutId)

      // Handle abort (timeout)
      if (error instanceof Error && error.name === 'AbortError') {
        throw new ApiError('Request timeout. The server took too long to respond.')
      }

      // Re-throw API errors
      if (error instanceof ApiError) {
        throw error
      }

      // Handle network errors
      if (error instanceof TypeError) {
        throw new ApiError(
          'Network error. Please check your internet connection and try again.'
        )
      }

      // Unknown error
      throw new ApiError(
        error instanceof Error ? error.message : 'An unknown error occurred'
      )
    }
  } catch (error) {
    // Handle errors during image processing
    if (error instanceof ApiError) {
      throw error
    }
    throw new ApiError(
      error instanceof Error ? error.message : 'Failed to process submission'
    )
  }
}

// Mock function for testing without a real webhook
export async function mockSubmitAdToWebhook(
  data: AdSubmissionFormData & { imageFile: File | null }
): Promise<{ response: WebhookResponse; responseTime: number }> {
  const startTime = performance.now()

  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 1500))

  const responseTime = performance.now() - startTime

  // Simple mock logic based on content
  const title = data.title.toLowerCase()
  const description = data.description.toLowerCase()

  let decision: 'Approve' | 'Review' | 'Reject' = 'Approve'
  const violations: string[] = []
  const recommendations: string[] = []

  // Check for suspicious patterns
  if (
    title.includes('rich') ||
    title.includes('quick') ||
    title.includes('easy') ||
    description.includes('get rich') ||
    description.includes('no experience') ||
    description.includes('act now') ||
    description.includes('limited time')
  ) {
    decision = 'Reject'
    violations.push('Uses get-rich-quick language patterns')
    violations.push('Creates false urgency with time-sensitive language')
    recommendations.push('Remove exaggerated claims about earning potential')
    recommendations.push('Use factual descriptions instead of hype')
  } else if (
    description.includes('contact for') ||
    description.includes('details') ||
    title.includes('luxury')
  ) {
    decision = 'Review'
    violations.push('Insufficient detail in description')
    recommendations.push('Add more specific details about the item/service')
    recommendations.push('Include clear pricing or condition information')
  }

  const response: WebhookResponse = {
    decision,
    confidence: decision === 'Approve' ? 0.95 : decision === 'Reject' ? 0.92 : 0.75,
    reasoning:
      decision === 'Approve'
        ? 'The ad appears to be legitimate with clear, factual information. No suspicious language patterns detected.'
        : decision === 'Reject'
        ? 'The ad contains language commonly associated with scams or misleading claims. Multiple red flags detected.'
        : 'The ad requires additional review. Some elements need clarification before approval.',
    violations: violations.length > 0 ? violations : undefined,
    recommendations: recommendations.length > 0 ? recommendations : undefined,
  }

  return { response, responseTime }
}
