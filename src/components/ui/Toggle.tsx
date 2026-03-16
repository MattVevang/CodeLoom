import { cn } from '@/lib/utils'

interface ToggleProps {
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
  description?: string
  disabled?: boolean
}

export const Toggle = ({
  label,
  checked,
  onChange,
  description,
  disabled = false,
}: ToggleProps) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    disabled={disabled}
    onClick={() => onChange(!checked)}
    className={cn(
      'flex w-full items-center justify-between gap-4 rounded-lg border border-zinc-200/80 px-4 py-3 text-left transition-colors',
      'hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900/80',
      'focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2',
      'focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-60 dark:focus-visible:ring-offset-zinc-950',
    )}
  >
    <span className="min-w-0 space-y-1">
      <span className="block text-sm font-medium text-zinc-900 dark:text-zinc-100">{label}</span>
      {description ? (
        <span className="block text-xs text-zinc-500 dark:text-zinc-400">{description}</span>
      ) : null}
    </span>

    <span
      className={cn(
        'relative inline-flex h-6 w-11 shrink-0 rounded-full border transition-colors',
        checked
          ? 'border-indigo-500 bg-indigo-500'
          : 'border-zinc-300 bg-zinc-200 dark:border-zinc-700 dark:bg-zinc-800',
      )}
    >
      <span
        className={cn(
          'absolute top-0.5 left-0.5 size-5 rounded-full bg-white shadow-sm transition-transform',
          checked && 'translate-x-5',
        )}
      />
    </span>
  </button>
)
