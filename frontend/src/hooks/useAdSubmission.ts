import { useState, useCallback } from 'react'
import { submitAdToWebhook, ApiError } from '../lib/api'
import type { AdSubmissionFormData, AIResponse } from '../types'

interface SubmissionState {
  isLoading: boolean
  error: string | null
  data: AIResponse | null
}

interface UseAdSubmissionReturn {
  submit: (
    data: AdSubmissionFormData & { imageFile: File | null },
    useMock?: boolean
  ) => Promise<AIResponse | null>
  reset: () => void
  state: SubmissionState
}

export function useAdSubmission(): UseAdSubmissionReturn {
  const [state, setState] = useState<SubmissionState>({
    isLoading: false,
    error: null,
    data: null,
  })

  const reset = useCallback(() => {
    setState({
      isLoading: false,
      error: null,
      data: null,
    })
  }, [])

  const submit = useCallback(
    async (
      data: AdSubmissionFormData & { imageFile: File | null },
      useMock = false
    ): Promise<AIResponse | null> => {
      setState({ isLoading: true, error: null, data: null })

      try {
        // Use mock function if webhook URL is not configured or explicitly requested
        const shouldUseMock =
          useMock || !import.meta.env.VITE_API_URL

        if (shouldUseMock) {
          throw new ApiError('Mock mode is not available. Please configure VITE_API_URL.')
        }

        const { response, responseTime } = await submitAdToWebhook(data)

        const result: AIResponse = {
          decision: response.decision,
          confidence: response.confidence,
          reasoning: response.reasoning,
          violations: response.violations,
          recommendations: response.recommendations,
          rawResponse: response,
          responseTime,
          timestamp: new Date(),
        }

        setState({ isLoading: false, error: null, data: result })

        return result
      } catch (error) {
        let errorMessage = 'An unexpected error occurred'

        if (error instanceof ApiError) {
          errorMessage = error.message
        } else if (error instanceof Error) {
          errorMessage = error.message
        }

        setState({
          isLoading: false,
          error: errorMessage,
          data: null,
        })

        return null
      }
    },
    []
  )

  return {
    submit,
    reset,
    state,
  }
}
