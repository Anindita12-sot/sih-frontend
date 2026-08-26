import type { ButtonHTMLAttributes, ReactNode } from 'react'

import { Spinner } from '@/components/ui/Spinner'
import { cn } from '@/lib/cn'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
type ButtonSize = 'sm' | 'md' | 'lg'

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-brand text-white hover:bg-brand-strong',
  secondary: 'bg-surface text-ink border border-line hover:bg-canvas',
  ghost: 'bg-transparent text-muted hover:bg-canvas hover:text-ink',
  danger: 'bg-danger text-white hover:opacity-90',
}

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'h-9 px-3 text-sm gap-1.5',
  md: 'h-11 px-4 text-sm gap-2',
  lg: 'h-12 px-6 text-base gap-2',
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  isLoading?: boolean
  /** Announced to screen readers while `isLoading` is true. */
  loadingText?: string
  fullWidth?: boolean
  leadingIcon?: ReactNode
}

export function Button({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  loadingText = 'Working…',
  fullWidth = false,
  leadingIcon,
  className,
  children,
  disabled,
  type = 'button',
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      // Disabling during submit is what actually prevents double submission.
      disabled={disabled || isLoading}
      aria-busy={isLoading}
      className={cn(
        'inline-flex items-center justify-center rounded-lg font-medium transition-colors',
        'disabled:cursor-not-allowed disabled:opacity-55',
        variantClasses[variant],
        sizeClasses[size],
        fullWidth && 'w-full',
        className,
      )}
      {...rest}
    >
      {isLoading ? (
        <>
          <Spinner size="sm" />
          <span>{loadingText}</span>
        </>
      ) : (
        <>
          {leadingIcon}
          {children}
        </>
      )}
    </button>
  )
}
