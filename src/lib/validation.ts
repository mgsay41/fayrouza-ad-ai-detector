import { z } from 'zod'
import type { Translations } from '../i18n'
import type { Category } from '../types'

export const categoryValues: Category[] = [
  'Electronics',
  'Vehicles',
  'Real Estate',
  'Clothing',
  'Home & Garden',
  'Services',
  'Other',
]

// Get translated categories
export function getCategories(t: Translations): Category[] {
  return [
    t.form.fields.category.electronics as Category,
    t.form.fields.category.vehicles as Category,
    t.form.fields.category.realEstate as Category,
    t.form.fields.category.clothing as Category,
    t.form.fields.category.homeGarden as Category,
    t.form.fields.category.services as Category,
    t.form.fields.category.other as Category,
  ]
}

// Factory function to create schema with translations
export function createAdSubmissionSchema(t: Translations) {
  return z.object({
    title: z
      .string()
      .min(5, t.validation.title.min)
      .max(100, t.validation.title.max),
    description: z
      .string()
      .min(20, t.validation.description.min)
      .max(1000, t.validation.description.max),
    price: z
      .number({
        message: t.validation.price.nan,
      })
      .min(0, t.validation.price.negative)
      .max(999999999, t.validation.price.tooHigh),
    category: z.enum(categoryValues, {
      message: t.validation.category.required,
    }),
    image: z
      .instanceof(File)
      .nullable()
      .refine(
        (file) => !file || file.size <= 5 * 1024 * 1024,
        t.validation.image.size
      )
      .refine(
        (file) => !file || ['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.type),
        t.validation.image.type
      )
      .optional(),
  })
}

// Default schema with English messages (for backward compatibility)
export const adSubmissionSchema = createAdSubmissionSchema(
  // Minimal translation object with English defaults
  {
    validation: {
      title: { min: 'Title must be at least 5 characters', max: 'Title must be less than 100 characters' },
      description: { min: 'Description must be at least 20 characters', max: 'Description must be less than 1000 characters' },
      price: { nan: 'Price must be a number', negative: 'Price cannot be negative', tooHigh: 'Price is too high' },
      category: { required: 'Please select a category' },
      image: { size: 'Image size must be less than 5MB', type: 'Only JPEG, PNG, GIF, and WebP images are allowed' },
    },
  } as Translations
)

export type AdSubmissionFormData = z.infer<typeof adSubmissionSchema>

// Get sample data based on language
export function getSampleDataSets(t: Translations) {
  return [
    {
      title: t.sampleData.clean.title,
      description: t.sampleData.clean.description,
      price: t.sampleData.clean.price,
      category: t.sampleData.clean.category as Category,
      expectedDecision: 'Approve' as const,
    },
    {
      title: t.sampleData.violating.title,
      description: t.sampleData.violating.description,
      price: t.sampleData.violating.price,
      category: t.sampleData.violating.category as Category,
      expectedDecision: 'Reject' as const,
    },
    {
      title: t.sampleData.suspicious.title,
      description: t.sampleData.suspicious.description,
      price: t.sampleData.suspicious.price,
      category: t.sampleData.suspicious.category as Category,
      expectedDecision: 'Review' as const,
    },
  ]
}

// Default sample data (English)
export const sampleDataSets = getSampleDataSets(
  {
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
  } as Translations
)
