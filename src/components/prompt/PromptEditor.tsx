import { Sparkles } from 'lucide-react'
import { useMemo } from 'react'
import { assemblePrompt } from '@/services/promptAssembler'
import { useFileStore } from '@/stores/fileStore'
import { usePromptStore } from '@/stores/promptStore'
import { useSettingsStore } from '@/stores/settingsStore'
import { Button } from '@/components/ui/Button'
import type { FileNode, OutputFormat } from '@/types'

const outputFormats: OutputFormat[] = ['markdown', 'xml', 'plain']

const countSelected = (node: FileNode | null): number => {
  if (!node) return 0
  if (node.type === 'file') return node.isSelected ? 1 : 0
  return (node.children ?? []).reduce((sum, child) => sum + countSelected(child), 0)
}

export const PromptEditor = () => {
  const rootNode = useFileStore((state) => state.rootNode)
  const selectedCount = useMemo(() => countSelected(rootNode), [rootNode])
  const config = usePromptStore((state) => state.config)
  const setUserPrompt = usePromptStore((state) => state.setUserPrompt)
  const setIncludeFileTree = usePromptStore((state) => state.setIncludeFileTree)
  const setIncludeFilePaths = usePromptStore((state) => state.setIncludeFilePaths)
  const setWrapContentInCodeBlocks = usePromptStore((state) => state.setWrapContentInCodeBlocks)
  const setOutputFormat = usePromptStore((state) => state.setOutputFormat)
  const setAssembledPrompt = usePromptStore((state) => state.setAssembledPrompt)
  const setDefaultOutputFormat = useSettingsStore((state) => state.setOutputFormat)

  const canGenerate = selectedCount > 0 && config.userPrompt.trim().length > 0

  return (
    <section className="panel-surface flex h-full min-h-0 flex-col overflow-hidden">
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-zinc-200/70 px-4 py-3 dark:border-zinc-800/80">
        <h2 className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">Prompt editor</h2>
        <div className="rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-700 dark:border-indigo-500/20 dark:bg-indigo-500/10 dark:text-indigo-200">
          {selectedCount} file{selectedCount === 1 ? '' : 's'} selected
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto lg:flex-row">
        <div className="flex min-h-[8rem] flex-1 flex-col gap-2 p-4">
          <textarea
            value={config.userPrompt}
            onChange={(event) => setUserPrompt(event.target.value)}
            placeholder="Describe the task for your local model. Example: Create a concise architecture summary of these files, highlight the main abstractions, and suggest the best next refactor."
            className="input-field min-h-0 flex-1 resize-none font-mono text-sm leading-6"
          />
          <div className="flex items-center justify-between gap-3 text-xs text-zinc-500 dark:text-zinc-400">
            <span>{config.userPrompt.length} chars</span>
          </div>
        </div>

        <div className="shrink-0 border-t border-zinc-200/70 p-4 dark:border-zinc-800/80 lg:w-64 lg:border-t-0 lg:border-l xl:w-72">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Options</p>

          <div className="space-y-2">
            <label className="flex items-center gap-2.5 rounded-md border border-zinc-200/80 px-2.5 py-1.5 text-sm dark:border-zinc-800">
              <input type="checkbox" checked={config.includeFileTree} onChange={(event) => setIncludeFileTree(event.target.checked)} className="size-3.5 rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-950" />
              <span>Include file tree</span>
            </label>

            <label className="flex items-center gap-2.5 rounded-md border border-zinc-200/80 px-2.5 py-1.5 text-sm dark:border-zinc-800">
              <input type="checkbox" checked={config.includeFilePaths} onChange={(event) => setIncludeFilePaths(event.target.checked)} className="size-3.5 rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-950" />
              <span>Include file paths</span>
            </label>

            <label className="flex items-center gap-2.5 rounded-md border border-zinc-200/80 px-2.5 py-1.5 text-sm dark:border-zinc-800">
              <input type="checkbox" checked={config.wrapContentInCodeBlocks} onChange={(event) => setWrapContentInCodeBlocks(event.target.checked)} className="size-3.5 rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-950" />
              <span>Wrap in code blocks</span>
            </label>

            <label className="block space-y-1 text-sm font-medium text-zinc-700 dark:text-zinc-200">
              <span className="text-xs">Format</span>
              <select
                value={config.outputFormat}
                onChange={(event) => {
                  const nextFormat = event.target.value as OutputFormat
                  setOutputFormat(nextFormat)
                  setDefaultOutputFormat(nextFormat)
                }}
                className="input-field text-sm"
              >
                {outputFormats.map((format) => (
                  <option key={format} value={format}>
                    {format === 'xml' ? 'XML (recommended for local LLMs)' : format.toUpperCase()}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="mt-4">
            <Button
              variant="primary"
              size="md"
              fullWidth
              icon={<Sparkles className="size-4" />}
              disabled={!canGenerate}
              onClick={() => {
                const files = useFileStore.getState().getSelectedFiles()
                setAssembledPrompt(assemblePrompt(files, config))
              }}
            >
              Generate Prompt
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
