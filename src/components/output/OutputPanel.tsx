import { Bot, Copy, Download, FileOutput, Loader2, Monitor, SendHorizontal, ShieldCheck, User } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { useClipboard } from '@/hooks/useClipboard'
import { isLocalEnvironment } from '@/lib/environment'
import { formatBytes } from '@/lib/utils'
import { chatWithLLM } from '@/services/llmBridge'
import { usePromptStore } from '@/stores/promptStore'
import { useSettingsStore } from '@/stores/settingsStore'
import { TokenCounter } from '@/components/output/TokenCounter'
import type { ChatMessage } from '@/types'

export const OutputPanel = () => {
  const isLocal = isLocalEnvironment()
  const assembledPrompt = usePromptStore((state) => state.assembledPrompt)
  const llmEndpoints = useSettingsStore((state) => state.llmEndpoints)
  const activeEndpointId = useSettingsStore((state) => state.activeLLMEndpoint)
  const { copy, copied } = useClipboard()
  const [isSending, setIsSending] = useState(false)
  const [sendError, setSendError] = useState<string | null>(null)
  const [conversation, setConversation] = useState<ChatMessage[]>([])
  const [followUp, setFollowUp] = useState('')
  const [showChat, setShowChat] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const activeEndpoint = useMemo(
    () => llmEndpoints.find((endpoint) => endpoint.id === activeEndpointId) ?? llmEndpoints[0] ?? null,
    [activeEndpointId, llmEndpoints],
  )

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [conversation])

  const handleDownload = () => {
    if (!assembledPrompt) return
    const blob = new Blob([assembledPrompt.content], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = 'codeloom-prompt.txt'
    anchor.click()
    URL.revokeObjectURL(url)
  }

  const handleDownloadConversation = () => {
    if (conversation.length === 0) return
    const text = conversation
      .map((m) => `--- ${m.role.toUpperCase()} ---\n${m.content}`)
      .join('\n\n')
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = 'codeloom-conversation.txt'
    anchor.click()
    URL.revokeObjectURL(url)
  }

  const sendMessages = async (messages: ChatMessage[]) => {
    if (!activeEndpoint) return
    setIsSending(true)
    setSendError(null)

    try {
      const response = await chatWithLLM(activeEndpoint, messages)
      if (response.content) {
        setConversation([...messages, { role: 'assistant', content: response.content }])
      } else {
        setSendError(`${activeEndpoint.name} returned an empty response.`)
      }
    } catch (error) {
      setSendError(error instanceof Error ? error.message : 'Unable to reach the selected LLM endpoint.')
    } finally {
      setIsSending(false)
    }
  }

  const handleSendInitial = () => {
    if (!assembledPrompt || !activeEndpoint) return
    const initial: ChatMessage[] = [{ role: 'user', content: assembledPrompt.content }]
    setConversation(initial)
    setShowChat(true)
    void sendMessages(initial)
  }

  const handleSendFollowUp = () => {
    const text = followUp.trim()
    if (!text || isSending) return
    const updated: ChatMessage[] = [...conversation, { role: 'user', content: text }]
    setConversation(updated)
    setFollowUp('')
    void sendMessages(updated)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendFollowUp()
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
        {!isLocal ? (
          <div className="mt-2 flex items-center gap-2 rounded-lg border border-amber-200/60 bg-amber-50/50 px-4 py-2.5 text-xs text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/5 dark:text-amber-300">
            <Monitor className="size-4 shrink-0" />
            <span>
              <strong>Hosted mode</strong> — copy or download your prompt and paste it into your LLM.
              For direct Send&nbsp;to&nbsp;LLM, run CodeLoom locally via Docker or npm.
            </span>
          </div>
        ) : null}
      </section>
    )
  }

  // Conversation view (local environment only)
  if (isLocal && showChat && conversation.length > 0) {
    return (
      <section className="panel-surface flex h-full min-h-0 flex-col overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200/70 px-5 py-3 dark:border-zinc-800/80">
          <div className="flex items-center gap-2 text-sm font-medium text-zinc-700 dark:text-zinc-200">
            <Bot className="size-4 text-indigo-500" />
            <span>Conversation</span>
            <span className="text-xs text-zinc-400 dark:text-zinc-500">
              {Math.floor(conversation.length / 2)} exchange{Math.floor(conversation.length / 2) !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" icon={<Download className="size-3.5" />} onClick={handleDownloadConversation}>
              Export
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setShowChat(false)}>
              Show prompt
            </Button>
            <Button variant="ghost" size="sm" onClick={() => { setConversation([]); setShowChat(false); setSendError(null) }}>
              New chat
            </Button>
          </div>
        </div>

        <div className="subtle-scrollbar min-h-0 flex-1 overflow-auto">
          <div className="flex flex-col gap-0.5">
            {conversation.map((msg, idx) => (
              <div
                key={idx}
                className={
                  msg.role === 'user'
                    ? 'border-b border-zinc-100 bg-white px-5 py-4 dark:border-zinc-800/50 dark:bg-zinc-900/50'
                    : 'border-b border-zinc-100 bg-zinc-50/80 px-5 py-4 dark:border-zinc-800/50 dark:bg-zinc-950/60'
                }
              >
                <div className="mb-2 flex items-center gap-2">
                  {msg.role === 'user' ? (
                    <User className="size-4 text-zinc-400" />
                  ) : (
                    <Bot className="size-4 text-indigo-500" />
                  )}
                  <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                    {msg.role === 'user' && idx === 0 ? 'Initial prompt' : msg.role === 'user' ? 'You' : 'Assistant'}
                  </span>
                  {msg.role === 'user' && idx === 0 ? (
                    <span className="text-xs text-zinc-400 dark:text-zinc-500">(context + files)</span>
                  ) : null}
                </div>
                <div className="pl-6">
                  <pre className="whitespace-pre-wrap break-words font-mono text-sm leading-6 text-zinc-800 dark:text-zinc-100">
                    <code>{msg.role === 'user' && idx === 0 && msg.content.length > 500
                      ? `${msg.content.slice(0, 500)}\n\n… [${(msg.content.length - 500).toLocaleString()} more characters — full context sent to model]`
                      : msg.content}</code>
                  </pre>
                </div>
              </div>
            ))}

            {isSending ? (
              <div className="flex items-center gap-3 px-5 py-4">
                <Loader2 className="size-4 animate-spin text-indigo-500" />
                <span className="text-sm text-zinc-500 dark:text-zinc-400">
                  Waiting for {activeEndpoint?.name ?? 'LLM'}…
                </span>
              </div>
            ) : null}

            <div ref={chatEndRef} />
          </div>
        </div>

        {sendError ? (
          <div className="border-t border-red-200/50 bg-red-50 px-5 py-2 text-sm text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300">
            {sendError}
          </div>
        ) : null}

        <div className="border-t border-zinc-200/70 bg-white px-4 py-3 dark:border-zinc-800/80 dark:bg-zinc-900/50">
          <div className="flex items-end gap-2">
            <textarea
              ref={textareaRef}
              value={followUp}
              onChange={(e) => setFollowUp(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Send a follow-up message… (Enter to send, Shift+Enter for new line)"
              rows={2}
              disabled={isSending}
              className="input-field min-h-[2.5rem] flex-1 resize-none"
            />
            <Button
              variant="primary"
              size="sm"
              loading={isSending}
              disabled={!followUp.trim() || isSending}
              icon={<SendHorizontal className="size-4" />}
              onClick={handleSendFollowUp}
              aria-label="Send follow-up"
            />
          </div>
        </div>
      </section>
    )
  }

  // Prompt preview (default)
  return (
    <section className="panel-surface flex h-full min-h-0 flex-col overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200/70 px-5 py-4 dark:border-zinc-800/80">
        <div className="flex flex-wrap items-center gap-2">
          <TokenCounter count={assembledPrompt.tokenEstimate} contextLimit={activeEndpoint?.contextLength} />
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
            onClick={() => { void copy(assembledPrompt.content) }}
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
          {isLocal && activeEndpoint ? (
            <Button
              variant="primary"
              size="sm"
              loading={isSending}
              icon={<SendHorizontal className="size-4" />}
              onClick={handleSendInitial}
            >
              Send to LLM
            </Button>
          ) : null}
          {isLocal && conversation.length > 0 ? (
            <Button
              variant="ghost"
              size="sm"
              icon={<Bot className="size-3.5" />}
              onClick={() => setShowChat(true)}
            >
              Show chat
            </Button>
          ) : null}
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-3 p-5">
        <div className="panel-muted subtle-scrollbar min-h-0 flex-1 overflow-auto p-4">
          <pre className="whitespace-pre-wrap break-words font-mono text-sm leading-6 text-zinc-800 dark:text-zinc-100">
            <code>{assembledPrompt.content}</code>
          </pre>
        </div>
      </div>
    </section>
  )
}
