import { Loader2 } from 'lucide-react'
import { forwardRef } from 'react'
import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  icon?: ReactNode
  loading?: boolean
  fullWidth?: boolean
}

const variantClasses = {
  primary:
    'bg-indigo-600 text-white shadow-sm shadow-indigo-950/15 hover:bg-indigo-500 dark:bg-indigo-500 dark:hover:bg-indigo-400',
  secondary:
    'border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800',
  ghost:
    'bg-transparent text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-800/80 dark:hover:text-white',
  danger:
    'bg-rose-600 text-white shadow-sm shadow-rose-950/15 hover:bg-rose-500 dark:bg-rose-500 dark:hover:bg-rose-400',
} as const

const sizeClasses = {
  sm: 'h-9 gap-2 px-3 text-sm',
  md: 'h-10 gap-2.5 px-4 text-sm',
  lg: 'h-11 gap-3 px-5 text-base',
} as const

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      children,
      variant = 'secondary',
      size = 'md',
      icon,
      loading = false,
      fullWidth = false,
      disabled,
      type = 'button',
      ...props
    },
    ref,
  ) => (
    <button
      ref={ref}
      type={type}
      className={cn(
        'inline-flex items-center justify-center rounded-md font-medium transition-all duration-200',
        'focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2',
        'focus-visible:ring-offset-white disabled:pointer-events-none disabled:opacity-60',
        'dark:focus-visible:ring-offset-zinc-950',
        variantClasses[variant],
        sizeClasses[size],
        fullWidth && 'w-full',
        className,
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <Loader2 className="size-4 animate-spin" /> : icon}
      {children ? <span>{children}</span> : null}
    </button>
  ),
)

Button.displayName = 'Button'
