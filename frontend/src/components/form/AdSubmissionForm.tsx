import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useState, useCallback, useMemo } from 'react'
import { Upload, Loader2, FlaskConical, CheckCircle2, XCircle, AlertCircle } from 'lucide-react'
import { useI18n } from '../../i18n'
import { createAdSubmissionSchema, getCategories, testCases, type AdSubmissionFormData } from '../../lib/validation'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Textarea } from '../ui/textarea'
import { Label } from '../ui/label'
import { Select } from '../ui/select'
import { ImagePreview } from './ImagePreview'
import { cn } from '../../lib/utils'

interface AdSubmissionFormProps {
  onSubmit: (data: AdSubmissionFormData & { imageFile: File | null }) => void
  isLoading?: boolean
}

export function AdSubmissionForm({ onSubmit, isLoading = false }: AdSubmissionFormProps) {
  const { t, format, language } = useI18n()

  // Create schema with translations and memoize
  const schema = useMemo(() => createAdSubmissionSchema(t), [t])

  // Get translated categories
  const categories = useMemo(() => getCategories(t), [t])

  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imageLoading, setImageLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<AdSubmissionFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: '',
      description: '',
      price: 0,
      category: 'Other',
      image: null,
    },
  })

  const title = watch('title', '')
  const description = watch('description', '')

  const handleImageChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Create preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setImagePreview(reader.result as string)
    }
    reader.readAsDataURL(file)

    setImageFile(file)
    setValue('image', file, { shouldValidate: true })
  }, [setValue])

  const handleClearImage = useCallback(() => {
    setImagePreview(null)
    setImageFile(null)
    setValue('image', null, { shouldValidate: true })
  }, [setValue])

  const handleClearForm = useCallback(() => {
    reset()
    setImagePreview(null)
    setImageFile(null)
  }, [reset])

  const handleLoadTestCase = useCallback(async (tc: typeof testCases[number]) => {
    setValue('title', tc.title, { shouldValidate: true })
    setValue('description', tc.description, { shouldValidate: true })
    setValue('price', tc.price, { shouldValidate: true })
    setValue('category', tc.category, { shouldValidate: true })

    // Reset image state
    setImagePreview(null)
    setImageFile(null)
    setValue('image', null)

    if (!tc.imageUrl) return

    setImageLoading(true)
    try {
      const res = await fetch(tc.imageUrl)
      if (!res.ok) return
      const blob = await res.blob()
      const mimeType = blob.type || 'image/jpeg'
      const ext = mimeType.split('/')[1] ?? 'jpg'
      const file = new File([blob], `${tc.id}.${ext}`, { type: mimeType })
      setImageFile(file)
      setValue('image', file, { shouldValidate: true })
      const reader = new FileReader()
      reader.onloadend = () => setImagePreview(reader.result as string)
      reader.readAsDataURL(file)
    } catch {
      // Image fetch failed silently — form still usable without it
    } finally {
      setImageLoading(false)
    }
  }, [setValue])

  const onFormSubmit = (data: AdSubmissionFormData) => {
    onSubmit({ ...data, imageFile })
  }

  const ft = t.form.fields

  const expectedConfig = {
    approve: {
      icon: CheckCircle2,
      label: t.testCases.expected.approve,
      className: 'text-green-700 bg-green-50 border-green-200 hover:bg-green-100',
      dotClass: 'bg-green-500',
    },
    reject: {
      icon: XCircle,
      label: t.testCases.expected.reject,
      className: 'text-red-700 bg-red-50 border-red-200 hover:bg-red-100',
      dotClass: 'bg-red-500',
    },
    review: {
      icon: AlertCircle,
      label: t.testCases.expected.review,
      className: 'text-amber-700 bg-amber-50 border-amber-200 hover:bg-amber-100',
      dotClass: 'bg-amber-500',
    },
  } as const

  return (
    <>
      {/* Test Cases Panel */}
      <div className="rounded-lg border border-border bg-muted/20 p-4 space-y-3">
        <div className="flex items-center gap-2">
          <FlaskConical className="h-4 w-4 text-muted-foreground shrink-0" />
          <div>
            <p className="text-sm font-medium leading-none">{t.testCases.sectionTitle}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{t.testCases.sectionSubtitle}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {testCases.map((tc) => {
            const cfg = expectedConfig[tc.expected]
            const Icon = cfg.icon
            const label = language === 'ar' ? tc.labelAr : tc.labelEn
            return (
              <button
                key={tc.id}
                type="button"
                disabled={isLoading}
                onClick={() => handleLoadTestCase(tc)}
                className={cn(
                  'flex flex-col items-start gap-1.5 rounded-md border px-3 py-2 text-left text-xs transition-colors disabled:cursor-not-allowed disabled:opacity-50',
                  cfg.className
                )}
              >
                <span className="font-medium leading-tight">{label}</span>
                <span className="flex items-center gap-1 opacity-80">
                  <Icon className="h-3 w-3" />
                  {cfg.label}
                </span>
              </button>
            )
          })}
        </div>
      </div>

    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
      {/* Title Field */}
      <div className="space-y-2">
        <Label htmlFor="title">
          {ft.title.label} <span className="text-destructive">{t.form.required}</span>
        </Label>
        <Input
          id="title"
          placeholder={ft.title.placeholder}
          {...register('title')}
          className={cn(errors.title && 'border-destructive')}
          disabled={isLoading}
        />
        <div className="flex items-center justify-between">
          {errors.title ? (
            <p className="text-sm text-destructive">{errors.title.message}</p>
          ) : (
            <p className="text-sm text-muted-foreground">
              {ft.title.help}
            </p>
          )}
          <span className="text-xs text-muted-foreground">
            {format('form.fields.title.charCount', { count: title.length })}
          </span>
        </div>
      </div>

      {/* Description Field */}
      <div className="space-y-2">
        <Label htmlFor="description">
          {ft.description.label} <span className="text-destructive">{t.form.required}</span>
        </Label>
        <Textarea
          id="description"
          placeholder={ft.description.placeholder}
          rows={5}
          {...register('description')}
          className={cn(errors.description && 'border-destructive')}
          disabled={isLoading}
        />
        <div className="flex items-center justify-between">
          {errors.description ? (
            <p className="text-sm text-destructive">{errors.description.message}</p>
          ) : (
            <p className="text-sm text-muted-foreground">
              {ft.description.help}
            </p>
          )}
          <span className="text-xs text-muted-foreground">
            {format('form.fields.description.charCount', { count: description.length })}
          </span>
        </div>
      </div>

      {/* Price Field */}
      <div className="space-y-2">
        <Label htmlFor="price">
          {ft.price.label} <span className="text-destructive">{t.form.required}</span>
        </Label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            {ft.price.currency}
          </span>
          <Input
            id="price"
            type="number"
            step="0.01"
            placeholder={ft.price.placeholder}
            className="pl-8"
            {...register('price', { valueAsNumber: true })}
            disabled={isLoading}
          />
        </div>
        {errors.price && (
          <p className="text-sm text-destructive">{errors.price.message}</p>
        )}
      </div>

      {/* Category Field */}
      <div className="space-y-2">
        <Label htmlFor="category">
          {ft.category.label} <span className="text-destructive">{t.form.required}</span>
        </Label>
        <Select
          id="category"
          {...register('category')}
          disabled={isLoading}
        >
          <option value="">{ft.category.placeholder}</option>
          {categories.map(({ value, label }) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
        {errors.category && (
          <p className="text-sm text-destructive">{errors.category.message}</p>
        )}
      </div>

      {/* Image Upload */}
      <div className="space-y-2">
        <Label htmlFor="image">
          {ft.image.label}
        </Label>
        <div className="space-y-3">
          <Label
            htmlFor="image-upload"
            className={cn(
              'flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/20 p-6 cursor-pointer hover:bg-muted/30 transition-colors',
              (isLoading || imageLoading) && 'cursor-not-allowed opacity-50'
            )}
          >
            {imageLoading ? (
              <>
                <Loader2 className="h-8 w-8 text-muted-foreground mb-2 animate-spin" />
                <p className="text-sm font-medium text-foreground">Loading image...</p>
              </>
            ) : (
              <>
                <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm font-medium text-foreground">
                  {ft.image.uploadText}
                </p>
                <p className="text-xs text-muted-foreground">
                  {ft.image.uploadHint}
                </p>
              </>
            )}
            <Input
              id="image-upload"
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              className="hidden"
              onChange={handleImageChange}
              disabled={isLoading || imageLoading}
            />
          </Label>
          {errors.image && (
            <p className="text-sm text-destructive">{errors.image.message}</p>
          )}
          <ImagePreview
            image={imageFile}
            preview={imagePreview}
            onClear={handleClearImage}
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col gap-3 pt-4">
        {/* Form Actions */}
        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={handleClearForm}
            disabled={isLoading}
            className="flex-1"
          >
            {t.form.actions.clearForm}
          </Button>
          <Button
            type="submit"
            disabled={isLoading}
            className="flex-1"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {t.form.actions.submitting}
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                {t.form.actions.submit}
              </>
            )}
          </Button>
        </div>
      </div>
    </form>
    </>
  )
}
