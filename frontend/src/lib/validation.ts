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

export const categoryLabels: Record<Category, string> = {
  Electronics: 'Electronics',
  Vehicles: 'Vehicles',
  'Real Estate': 'Real Estate',
  Clothing: 'Clothing',
  'Home & Garden': 'Home & Garden',
  Services: 'Services',
  Other: 'Other',
}

export function getCategoryLabels(t: Translations): Record<Category, string> {
  return {
    Electronics: t.form.fields.category.electronics,
    Vehicles: t.form.fields.category.vehicles,
    'Real Estate': t.form.fields.category.realEstate,
    Clothing: t.form.fields.category.clothing,
    'Home & Garden': t.form.fields.category.homeGarden,
    Services: t.form.fields.category.services,
    Other: t.form.fields.category.other,
  }
}

export function getCategories(t: Translations): { value: Category; label: string }[] {
  const labels = getCategoryLabels(t)
  return categoryValues.map((value) => ({ value, label: labels[value] }))
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

export interface TestCase {
  id: string
  labelEn: string
  labelAr: string
  expected: 'approve' | 'reject' | 'review'
  title: string
  description: string
  price: number
  category: Category
  imageUrl?: string
}

export const testCases: TestCase[] = [
  {
    id: 'approve_phone',
    labelEn: 'Legitimate Phone',
    labelAr: 'هاتف مشروع',
    expected: 'approve',
    title: 'iPhone 15 Pro Max 256GB Black Titanium',
    description: 'Selling my iPhone 15 Pro Max 256GB Black Titanium. Excellent condition, used for 6 months. Comes with original box, charger and case included. No scratches or damage.',
    price: 55000,
    category: 'Electronics',
    imageUrl: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=600&q=80',
  },
  {
    id: 'approve_furniture',
    labelEn: 'Furniture (Legitimate)',
    labelAr: 'أثاث (مشروع)',
    expected: 'approve',
    title: 'Solid Wood Dining Table - 6 Persons',
    description: 'Solid wood dining table for 6 people. Very good condition, moving so selling. Dimensions 180x90cm. Brown color. No scratches. Can deliver within Cairo.',
    price: 3500,
    category: 'Home & Garden',
    imageUrl: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&q=80',
  },
  {
    id: 'reject_alcohol',
    labelEn: 'Arabic Alcohol Ad',
    labelAr: 'إعلان كحول عربي',
    expected: 'reject',
    title: 'ويسكي جوني ووكر بلاك ليبل للبيع',
    description: 'بيبيع زجاجة ويسكي جوني ووكر بلاك ليبل 750ml اصلية وغير مفتوحة. السعر قابل للتفاوض.',
    price: 800,
    category: 'Other',
    imageUrl: 'https://images.unsplash.com/photo-1569529465841-dfecdab7503b?w=600&q=80',
  },
  {
    id: 'reject_firearm',
    labelEn: 'Firearms',
    labelAr: 'أسلحة نارية',
    expected: 'reject',
    title: 'Glock 19 Pistol for Sale - 9mm',
    description: 'Selling a Glock 19 semi-automatic pistol 9mm. Comes with 2 magazines and 200 rounds of ammunition. Barely used, excellent condition.',
    price: 12000,
    category: 'Other',
  },
  {
    id: 'reject_drugs',
    labelEn: 'Drug Paraphernalia',
    labelAr: 'أدوات مخدرات',
    expected: 'reject',
    title: 'Glass Water Pipe Bong 30cm',
    description: 'High quality glass water pipe bong, 30cm tall. Perfect for smoking herbs and marijuana. Easy to clean. Ships discreetly.',
    price: 450,
    category: 'Other',
  },
  {
    id: 'reject_counterfeit',
    labelEn: 'Counterfeit Goods',
    labelAr: 'بضائع مزيفة',
    expected: 'reject',
    title: 'Rolex Submariner Replica - High Quality Copy',
    description: 'Premium quality Rolex Submariner replica watch. Swiss movement, sapphire glass. Looks exactly like the original. Nobody will know the difference. AAA grade copy.',
    price: 1500,
    category: 'Other',
    imageUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&q=80',
  },
  {
    id: 'review_shisha',
    labelEn: 'Shisha Tobacco',
    labelAr: 'تبغ شيشة',
    expected: 'review',
    title: 'Al Fakher Shisha Tobacco - Double Apple 250g',
    description: 'Al Fakher double apple shisha tobacco 250g. Original sealed pack. Popular flavour for home hookah use. Fresh stock, best quality.',
    price: 85,
    category: 'Other',
    imageUrl: 'https://images.unsplash.com/photo-1547036967-23d11aacaee0?w=600&q=80',
  },
  {
    id: 'reject_roqya',
    labelEn: 'Paid Roqya Service',
    labelAr: 'خدمة رقية مدفوعة',
    expected: 'reject',
    title: 'Roqya Sharyia Service - Remove Black Magic',
    description: 'Professional roqya sharyia services. Remove sihr, ayn, and jinn. Contact me for home visits. Guaranteed results and barakah.',
    price: 200,
    category: 'Services',
  },
]

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
