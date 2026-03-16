import { Copy, Download, FileOutput, SendHorizontal, ShieldCheck } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { useClipboard } from '@/hooks/useClipboard'
import { formatBytes } from '@/lib/utils'
import { sendToLLM } from '@/services/llmBridge'
import { usePromptStore } from '@/stores/promptStore'
import { useSettingsStore } from '@/stores/settingsStore'
import { TokenCounter } from '@/components/output/TokenCounter'

export const OutputPanel = () => {
  const assembledPrompt = usePromptStore((state) => state.assembledPrompt)
  const llmEndpoints = useSettingsStore((state) => state.llmEndpoints)
  const activeEndpointId = useSettingsStore((state) => state.activeLLMEndpoint)
  const { copy, copied } = useClipboard()
  const [isSending, setIsSending] = useState(false)
  const [sendStatus, setSendStatus] = useState<string | null>(null)

  const activeEndpoint = useMemo(
    () => llmEndpoints.find((endpoint) => endpoint.id === activeEndpointId) ?? llmEndpoints[0] ?? null,
    [activeEndpointId, llmEndpoints],
  )

  const handleDownload = () => {
    if (!assembledPrompt) {
      return
    }

    const blob = new Blob([assembledPrompt.content], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = 'codeloom-prompt.txt'
    anchor.click()
    URL.revokeObjectURL(url)
  }

  const handleSend = async () => {
    if (!assembledPrompt || !activeEndpoint) {
      return
    }

    setIsSending(true)
    setSendStatus(null)

    try {
      const response = await sendToLLM(activeEndpoint, assembledPrompt.content)
      setSendStatus(
        response.content
          ? `Sent to ${activeEndpoint.name}. Response received successfully.`
          : `Sent to ${activeEndpoint.name}. The endpoint returned an empty response.`,
      )
    } catch (error) {
      setSendStatus(error instanceof Error ? error.message : 'Unable to reach the selected LLM endpoint.')
    } finally {
      setIsSending(false)
    }
  }

  if (!assembledPrompt) {
    return (
      <section className="panel-surface flex h-full min-h-0 flex-col items-center justify-center gap-4 px-6 text-center">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-indigo-600/10 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300">
          <FileOutput className="size-7" />
        </div>
        <div className="max-w-md space-y-2">
          <h2 className="text-lg font-semibold text-zinc-950 dark:text-zinc-50">Prompt output</h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Generate a prompt to preview the final context bundle, estimate token usage, and share it with your local LLM.
          </p>
        </div>
        <div className="mt-2 flex items-center gap-2 rounded-lg border border-emerald-200/60 bg-emerald-50/50 px-4 py-2.5 text-xs text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/5 dark:text-emerald-300">
          <ShieldCheck className="size-4 shrink-0" />
          <span>
            <strong>Your data never leaves your device.</strong> All file reading, prompt assembly, and processing happens entirely in your browser. Nothing is sent to any server unless you explicitly choose to send a prompt to your own local LLM endpoint.
          </span>
        </div>
      </section>
    )
  }

  return (
    <section className="panel-surface flex h-full min-h-0 flex-col overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200/70 px-5 py-4 dark:border-zinc-800/80">
        <div className="flex flex-wrap items-center gap-2">
          <TokenCounter count={assembledPrompt.tokenEstimate} />
          <span className="rounded-full border border-zinc-200 px-3 py-1 text-sm text-zinc-600 dark:border-zinc-700 dark:text-zinc-300">
            {assembledPrompt.fileCount} file{assembledPrompt.fileCount === 1 ? '' : 's'}
          </span>
          <span className="rounded-full border border-zinc-200 px-3 py-1 text-sm text-zinc-600 dark:border-zinc-700 dark:text-zinc-300">
            {formatBytes(assembledPrompt.totalSize)}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            icon={<Copy className="size-4" />}
            onClick={() => {
              void copy(assembledPrompt.content)
            }}
          >
            {copied ? 'Copied' : 'Copy'}
          </Button>
          <Button
            variant="secondary"
            size="sm"
            icon={<Download className="size-4" />}
            onClick={handleDownload}
          >
            Download
          </Button>
          {activeEndpoint ? (
            <Button
              variant="primary"
              size="sm"
              loading={isSending}
              icon={<SendHorizontal className="size-4" />}
              onClick={() => {
                void handleSend()
              }}
            >
              Send to LLM
            </Button>
          ) : null}
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-3 p-5">
        {sendStatus ? (
          <div className="rounded-lg border border-zinc-200/80 bg-zinc-50 px-3 py-2 text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950/70 dark:text-zinc-300">
            {sendStatus}
          </div>
        ) : null}

        <div className="panel-muted subtle-scrollbar min-h-0 flex-1 overflow-auto p-4">
          <pre className="whitespace-pre-wrap break-words font-mono text-sm leading-6 text-zinc-800 dark:text-zinc-100">
            <code>{assembledPrompt.content}</code>
          </pre>
        </div>
      </div>
    </section>
  )
}
