import { cn } from '@/lib/cn'

const sizeClasses = {
  sm: 'size-4 border-2',
  md: 'size-6 border-2',
  lg: 'size-9 border-[3px]',
}

export function Spinner({
  size = 'md',
  className,
}: {
  size?: keyof typeof sizeClasses
  className?: string
}) {
  return (
    <span
      role="status"
      aria-label="Loading"
      className={cn(
        'inline-block animate-spin rounded-full border-current border-t-transparent',
        sizeClasses[size],
        className,
      )}
    />
  )
}
