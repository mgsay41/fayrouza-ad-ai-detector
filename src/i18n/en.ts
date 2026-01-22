// English translations
export const en = {
  // Language and direction
  language: {
    name: 'English',
    code: 'en',
    direction: 'ltr',
  },

  // Layout
  layout: {
    title: 'Fayrouza Ad AI Detector',
    subtitle: 'AI-Powered Ad Moderation Testing',
    footer: 'Fayrouza Ad AI Detector © {year}',
    switchToArabic: 'Switch to Arabic',
    switchToEnglish: 'Switch to English',
  },

  // View modes
  view: {
    form: {
      title: 'Submit Ad for AI Analysis',
      subtitle: 'Fill in the details below to test the AI ad moderation system.',
    },
    history: {
      title: 'Submission History',
      subtitle: 'View your past {count} submission{s}.',
      subtitleSingular: 'submission',
      subtitlePlural: 'submissions',
      noHistory: 'No History Yet',
      noHistoryDesc: 'Submit an ad for analysis and it will appear here. You can view past submissions and their results.',
      noFilterMatch: 'No submissions match the current filter.',
      viewHistory: 'View History ({count})',
      backToForm: 'Back to Form',
    },
  },

  // Form
  form: {
    fields: {
      title: {
        label: 'Ad Title',
        placeholder: 'Enter a descriptive title for your ad',
        required: 'Title must be at least 5 characters',
        help: 'Minimum 5 characters',
        charCount: '{count}/100',
      },
      description: {
        label: 'Description',
        placeholder: 'Provide a detailed description of what you\'re offering...',
        required: 'Description must be at least 20 characters',
        help: 'Minimum 20 characters',
        charCount: '{count}/1000',
      },
      price: {
        label: 'Price',
        placeholder: '0.00',
        currency: '$',
      },
      category: {
        label: 'Category',
        placeholder: 'Select a category',
        required: 'Please select a category',
        // Categories
        electronics: 'Electronics',
        vehicles: 'Vehicles',
        realEstate: 'Real Estate',
        clothing: 'Clothing',
        homeGarden: 'Home & Garden',
        services: 'Services',
        other: 'Other',
      },
      image: {
        label: 'Ad Image',
        uploadText: 'Click to upload or drag and drop',
        uploadHint: 'JPEG, PNG, GIF, or WebP (max 5MB)',
        sizeError: 'Image size must be less than 5MB',
        typeError: 'Only JPEG, PNG, GIF, and WebP images are allowed',
      },
    },

    actions: {
      submit: 'Submit for Analysis',
      submitting: 'Analyzing...',
      clearForm: 'Clear Form',
      loadSample: {
        clean: 'Load Clean Ad Sample',
        violating: 'Load Violating Ad Sample',
        suspicious: 'Load Suspicious Ad Sample',
      },
    },

    infoBox: {
      title: 'How it works:',
      steps: [
        'Fill in all required fields (marked with *)',
        'Optionally upload an image for the ad',
        'Click "Submit for Analysis" to send to the AI',
        'View the AI decision, confidence score, and recommendations',
      ],
      note: 'Note: Currently using mock data. Set VITE_N8N_WEBHOOK_URL to use real AI analysis.',
    },

    required: '*',
  },

  // Validation errors
  validation: {
    title: {
      min: 'Title must be at least 5 characters',
      max: 'Title must be less than 100 characters',
    },
    description: {
      min: 'Description must be at least 20 characters',
      max: 'Description must be less than 1000 characters',
    },
    price: {
      nan: 'Price must be a number',
      negative: 'Price cannot be negative',
      tooHigh: 'Price is too high',
    },
    category: {
      required: 'Please select a category',
    },
    image: {
      size: 'Image size must be less than 5MB',
      type: 'Only JPEG, PNG, GIF, and WebP images are allowed',
    },
  },

  // Results
  results: {
    title: 'AI Analysis Complete',
    subtitle: 'Your ad has been analyzed by the AI moderation system',
    submitAnother: 'Submit Another Ad',

    confidence: 'Confidence Score',
    reasoning: 'Reasoning',
    violations: 'Violations Detected',
    recommendations: 'Recommendations',
    responseTime: 'Response time: {time}',

    // Decisions
    decision: {
      approve: 'Approve',
      review: 'Review',
      reject: 'Reject',
    },

    // JSON Viewer
    jsonViewer: {
      title: 'Full AI Response (JSON)',
      copy: 'Copy',
      copied: 'Copied to Clipboard',
      copiedDesc: 'JSON response has been copied to your clipboard.',
      copyFailed: 'Copy Failed',
      copyFailedDesc: 'Failed to copy to clipboard. Please try again.',
    },
  },

  // History
  history: {
    confidence: 'Confidence:',
    viewDetails: 'View Details',
    delete: 'Delete',
    clearAll: 'Clear All',
    clearAllConfirm: 'Are you sure you want to clear all history? This action cannot be undone.',
    cleared: 'History Cleared',
    clearedDesc: 'All submission history has been removed.',
    deleted: 'Item Deleted',
    deletedDesc: 'History item has been removed.',
    export: 'Export',

    // Filters
    filter: {
      all: 'All',
      approve: 'Approve',
      review: 'Review',
      reject: 'Reject',
    },

    // Detail modal
    detail: {
      submittedOn: 'Submitted on {date}',
      adDetails: 'Ad Details',
      image: 'Image',
      aiResult: 'AI Analysis Result',
      aiResultDesc: 'Moderation decision for this ad',
      fullResponse: 'Full API Response',
    },
  },

  // Toast notifications
  toast: {
    analysisComplete: 'Analysis Complete',
    analysisDesc: 'AI decision: {decision} with {confidence}% confidence',

    approved: 'Ad Approved',
    rejected: 'Ad Rejected',
    review: 'Ad Requires Review',

    submissionFailed: 'Submission Failed',
  },

  // Sample data
  sampleData: {
    clean: {
      title: 'iPhone 15 Pro Max - Excellent Condition',
      description: 'Selling my iPhone 15 Pro Max 256GB in excellent condition. Always kept in a case with screen protector. Battery health at 96%. Comes with original box and charger. No scratches or dents.',
      price: 899,
      category: 'Electronics',
    },
    violating: {
      title: 'GET RICH QUICK - Limited Time Offer!!!',
      description: 'Make $10000 per week working from home! No experience needed. Act NOW before this opportunity is gone forever! Call us immediately!!!',
      price: 99,
      category: 'Services',
    },
    suspicious: {
      title: 'Luxury Apartment for Rent - Downtown',
      description: 'Beautiful 2 bedroom apartment in the heart of downtown. Modern finishes, great view. Contact for more details and to schedule a viewing.',
      price: 2500,
      category: 'Real Estate',
    },
  },

  // Common
  common: {
    error: 'Error',
    loading: 'Loading...',
    cancel: 'Cancel',
    confirm: 'Confirm',
    close: 'Close',
  },
} as const

export type Translations = typeof en
