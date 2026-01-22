import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useState, useCallback, useMemo } from 'react'
import { Upload, Loader2 } from 'lucide-react'
import { useI18n } from '../../i18n'
import { createAdSubmissionSchema, getCategories, type AdSubmissionFormData } from '../../lib/validation'
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
  const { t, format } = useI18n()

  // Create schema with translations and memoize
  const schema = useMemo(() => createAdSubmissionSchema(t), [t])

  // Get translated categories
  const categories = useMemo(() => getCategories(t), [t])

  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)

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
      category: t.form.fields.category.other,
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

  const onFormSubmit = (data: AdSubmissionFormData) => {
    onSubmit({ ...data, imageFile })
  }

  const ft = t.form.fields

  return (
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
          {categories.map((category) => (
            <option key={category} value={category}>
              {category}
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
              isLoading && 'cursor-not-allowed opacity-50'
            )}
          >
            <Upload className="h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-sm font-medium text-foreground">
              {ft.image.uploadText}
            </p>
            <p className="text-xs text-muted-foreground">
              {ft.image.uploadHint}
            </p>
            <Input
              id="image-upload"
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              className="hidden"
              onChange={handleImageChange}
              disabled={isLoading}
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
  )
}
