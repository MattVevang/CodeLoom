import { Info } from 'lucide-react'
import { useState } from 'react'
import { isLocalEnvironment } from '@/lib/environment'
import { formatTokenCount, getTokenWarningLevel } from '@/services/tokenEstimator'
import { cn } from '@/lib/utils'

interface TokenCounterProps {
  count: number
  contextLimit?: number
}

const toneClasses = {
  ok: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-200',
  warning: 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200',
  danger: 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-200',
} as const

export const TokenCounter = ({ count, contextLimit }: TokenCounterProps) => {
  const [showTooltip, setShowTooltip] = useState(false)
  const isLocal = isLocalEnvironment()
  const warningLevel = contextLimit
    ? count > contextLimit ? 'danger' : count > contextLimit * 0.75 ? 'warning' : 'ok'
    : getTokenWarningLevel(count)

  return (
    <div className="relative inline-flex items-center gap-1">
      <div
        className={cn(
          'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-medium',
          toneClasses[warningLevel],
        )}
      >
        <span>{formatTokenCount(count)} tokens</span>
        <button
          type="button"
          className="inline-flex items-center rounded-full p-0.5 transition hover:opacity-70"
          onClick={() => setShowTooltip((v) => !v)}
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
          aria-label="Token estimation info"
        >
          <Info className="size-3.5" />
        </button>
      </div>
      {contextLimit ? (
        <span className={cn(
          'text-xs',
          warningLevel === 'danger' ? 'text-rose-600 dark:text-rose-400 font-semibold' : 'text-zinc-500 dark:text-zinc-400',
        )}>
          / {formatTokenCount(contextLimit)} ctx
        </span>
      ) : null}
      {showTooltip ? (
        <div className="absolute top-full left-0 z-50 mt-2 w-72 rounded-lg border border-zinc-200 bg-white p-3 text-xs leading-relaxed text-zinc-700 shadow-lg dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
          <p className="mb-1.5 font-semibold text-zinc-900 dark:text-zinc-100">How tokens are estimated</p>
          <p>
            Token count is approximated at ~4 characters per token, which aligns with common tokenizers
            (GPT, Llama, Mistral). Actual count varies by model and content.
          </p>
          {contextLimit ? (
            <p className="mt-1.5">
              <strong>Context limit:</strong> The selected model supports up to{' '}
              {formatTokenCount(contextLimit)} tokens. {warningLevel === 'danger'
                ? 'Your prompt exceeds this limit and will likely be truncated.'
                : warningLevel === 'warning'
                  ? 'Your prompt is approaching this limit.'
                  : 'Your prompt fits within this limit.'
              }
            </p>
          ) : isLocal ? (
            <p className="mt-1.5 text-zinc-500 dark:text-zinc-400">
              Configure an LLM endpoint with a model to see context size limits.
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
