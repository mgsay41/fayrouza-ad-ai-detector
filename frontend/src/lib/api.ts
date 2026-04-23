import type { AdSubmissionFormData, WebhookPayload, WebhookResponse, ModerationApiResponse, Decision } from '../types'

const API_URL = import.meta.env.VITE_API_URL || ''
const API_KEY = import.meta.env.VITE_MODERATION_API_KEY || ''
const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || ''
const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || ''
const REQUEST_TIMEOUT = 30000

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

function parseModerationResponse(apiResponse: ModerationApiResponse): WebhookResponse {
  const { data } = apiResponse

  const decisionMap: Record<string, Decision> = {
    'AUTO_APPROVED': 'Approve',
    'AUTO_REJECTED': 'Reject',
    'NEEDS_REVIEW': 'Review',
    'MANUAL_REVIEW': 'Review',
    'APPROVED': 'Approve',
    'REJECTED': 'Reject',
    'REVIEW': 'Review',
  }

  const decision = decisionMap[data.decision.toUpperCase()] || 'Review'
  const confidence = data.confidence_score / 100

  return {
    decision,
    confidence,
    reasoning: data.reasoning,
  }
}

export async function submitAdToWebhook(
  data: AdSubmissionFormData & { imageFile: File | null }
): Promise<{ response: WebhookResponse; responseTime: number }> {
  const startTime = performance.now()

  if (!API_URL) {
    throw new ApiError(
      'API URL is not configured. Please set VITE_API_URL environment variable.'
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
      const response = await fetch(`${API_URL}/webhook/moderate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': API_KEY,
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

      const apiResult = (await response.json()) as ModerationApiResponse

      if (!apiResult.success || !apiResult.data) {
        throw new ApiError('Invalid response format from API: missing success or data')
      }

      const normalizedResponse = parseModerationResponse(apiResult)

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


