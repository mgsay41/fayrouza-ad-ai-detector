import { X, Image as ImageIcon } from 'lucide-react'
import { Button } from '../ui/button'
import { cn } from '../../lib/utils'

interface ImagePreviewProps {
  image: File | null
  preview: string | null
  onClear: () => void
  className?: string
}

export function ImagePreview({ image, preview, onClear, className }: ImagePreviewProps) {
  if (!image && !preview) {
    return (
      <div className={cn(
        'flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/20 p-8 text-center',
        className
      )}>
        <ImageIcon className="h-12 w-12 text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground">No image selected</p>
        <p className="text-xs text-muted-foreground mt-1">
          JPEG, PNG, GIF, or WebP (max 5MB)
        </p>
      </div>
    )
  }

  return (
    <div className={cn('relative rounded-lg border border-border overflow-hidden', className)}>
      {preview ? (
        <img
          src={preview}
          alt="Preview"
          className="h-64 w-full object-contain bg-muted/20"
        />
      ) : (
        <div className="h-64 w-full flex items-center justify-center bg-muted/20">
          <ImageIcon className="h-12 w-12 text-muted-foreground" />
        </div>
      )}
      <div className="absolute bottom-0 left-0 right-0 bg-background/80 backdrop-blur-sm p-2 flex items-center justify-between">
        <p className="text-xs text-muted-foreground truncate flex-1">
          {image?.name || 'Unknown'}
        </p>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onClear}
          className="h-8 w-8"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
