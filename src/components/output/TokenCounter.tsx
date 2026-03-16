import { Info } from 'lucide-react'
import { formatTokenCount, getTokenWarningLevel } from '@/services/tokenEstimator'
import { cn } from '@/lib/utils'

interface TokenCounterProps {
  count: number
}

const toneClasses = {
  ok: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-200',
  warning: 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200',
  danger: 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-200',
} as const

export const TokenCounter = ({ count }: TokenCounterProps) => {
  const warningLevel = getTokenWarningLevel(count)

  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm font-medium',
        toneClasses[warningLevel],
      )}
    >
      <span>{formatTokenCount(count)} tokens</span>
      <span
        title="Tokens are the chunks a language model reads and writes. Larger prompts cost more context and may exceed model limits."
        className="inline-flex items-center"
      >
        <Info className="size-4" />
      </span>
    </div>
  )
}
