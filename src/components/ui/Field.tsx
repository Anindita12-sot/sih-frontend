import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from 'react'
import { useId } from 'react'

import { cn } from '@/lib/cn'

const controlClasses =
  'w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-sm text-ink ' +
  'placeholder:text-muted/70 transition-colors ' +
  'aria-[invalid=true]:border-danger disabled:cursor-not-allowed disabled:opacity-60'

interface FieldShellProps {
  id: string
  label: string
  hint?: string
  error?: string
  required?: boolean
  children: ReactNode
}

/**
 * Shared label/hint/error scaffolding. Ties the message elements to the control
 * via aria-describedby so screen readers announce validation failures.
 */
function FieldShell({
  id,
  label,
  hint,
  error,
  required,
  children,
}: FieldShellProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-ink">
        {label}
        {required && (
          <span className="ml-0.5 text-danger" aria-hidden="true">
            *
          </span>
        )}
      </label>
      {children}
      {hint && !error && (
        <p id={`${id}-hint`} className="text-xs text-muted">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} role="alert" className="text-xs font-medium text-danger">
          {error}
        </p>
      )}
    </div>
  )
}

function describedBy(id: string, hint?: string, error?: string) {
  if (error) return `${id}-error`
  if (hint) return `${id}-hint`
  return undefined
}

export interface TextFieldProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> {
  label: string
  hint?: string
  error?: string
}

export function TextField({
  label,
  hint,
  error,
  className,
  required,
  ...rest
}: TextFieldProps) {
  const id = useId()
  return (
    <FieldShell id={id} label={label} hint={hint} error={error} required={required}>
      <input
        id={id}
        aria-invalid={Boolean(error)}
        aria-describedby={describedBy(id, hint, error)}
        required={required}
        className={cn(controlClasses, className)}
        {...rest}
      />
    </FieldShell>
  )
}

export interface SelectFieldProps
  extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'id'> {
  label: string
  hint?: string
  error?: string
  options: { value: string; label: string }[]
  placeholder?: string
}

export function SelectField({
  label,
  hint,
  error,
  options,
  placeholder,
  className,
  required,
  ...rest
}: SelectFieldProps) {
  const id = useId()
  return (
    <FieldShell id={id} label={label} hint={hint} error={error} required={required}>
      <select
        id={id}
        aria-invalid={Boolean(error)}
        aria-describedby={describedBy(id, hint, error)}
        required={required}
        className={cn(controlClasses, className)}
        {...rest}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </FieldShell>
  )
}

export interface TextAreaFieldProps
  extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'id'> {
  label: string
  hint?: string
  error?: string
}

export function TextAreaField({
  label,
  hint,
  error,
  className,
  required,
  ...rest
}: TextAreaFieldProps) {
  const id = useId()
  return (
    <FieldShell id={id} label={label} hint={hint} error={error} required={required}>
      <textarea
        id={id}
        rows={4}
        aria-invalid={Boolean(error)}
        aria-describedby={describedBy(id, hint, error)}
        required={required}
        className={cn(controlClasses, 'resize-y', className)}
        {...rest}
      />
    </FieldShell>
  )
}
