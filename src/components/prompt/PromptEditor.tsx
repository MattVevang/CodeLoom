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
    <section className="panel-surface flex min-h-0 flex-col overflow-hidden">
      <div className="border-b border-zinc-200/70 px-5 py-4 dark:border-zinc-800/80">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-zinc-950 dark:text-zinc-50">Prompt editor</h2>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              Describe the task for your local model and choose how CodeLoom packages the selected files.
            </p>
          </div>
          <div className="rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-sm font-medium text-indigo-700 dark:border-indigo-500/20 dark:bg-indigo-500/10 dark:text-indigo-200">
            {selectedCount} file{selectedCount === 1 ? '' : 's'} selected
          </div>
        </div>
      </div>

      <div className="grid min-h-0 flex-1 gap-4 p-5 xl:grid-cols-[minmax(0,1.6fr)_minmax(18rem,0.95fr)]">
        <div className="flex min-h-0 flex-col gap-3">
          <textarea
            value={config.userPrompt}
            onChange={(event) => setUserPrompt(event.target.value)}
            placeholder="Example: Create a concise architecture summary of these files, highlight the main abstractions, and suggest the best next refactor for local LLM fine-tuning."
            className="input-field min-h-[260px] flex-1 resize-none font-mono text-sm leading-6"
          />

          <div className="flex items-center justify-between gap-3 text-sm text-zinc-500 dark:text-zinc-400">
            <span>Guide the model with constraints, desired output style, and any specific questions.</span>
            <span>{config.userPrompt.length} characters</span>
          </div>
        </div>

        <div className="panel-muted flex flex-col gap-4 p-4">
          <div>
            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Prompt options</p>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              Tune the generated bundle for the target LLM or downstream workflow.
            </p>
          </div>

          <label className="flex items-center gap-3 rounded-lg border border-zinc-200/80 px-3 py-2 text-sm dark:border-zinc-800">
            <input
              type="checkbox"
              checked={config.includeFileTree}
              onChange={(event) => setIncludeFileTree(event.target.checked)}
              className="size-4 rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-950"
            />
            <span>Include file tree</span>
          </label>

          <label className="flex items-center gap-3 rounded-lg border border-zinc-200/80 px-3 py-2 text-sm dark:border-zinc-800">
            <input
              type="checkbox"
              checked={config.includeFilePaths}
              onChange={(event) => setIncludeFilePaths(event.target.checked)}
              className="size-4 rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-950"
            />
            <span>Include file paths</span>
          </label>

          <label className="flex items-center gap-3 rounded-lg border border-zinc-200/80 px-3 py-2 text-sm dark:border-zinc-800">
            <input
              type="checkbox"
              checked={config.wrapContentInCodeBlocks}
              onChange={(event) => setWrapContentInCodeBlocks(event.target.checked)}
              className="size-4 rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-950"
            />
            <span>Wrap in code blocks</span>
          </label>

          <label className="space-y-2 text-sm font-medium text-zinc-700 dark:text-zinc-200">
            <span className="block">Output format</span>
            <select
              value={config.outputFormat}
              onChange={(event) => {
                const nextFormat = event.target.value as OutputFormat
                setOutputFormat(nextFormat)
                setDefaultOutputFormat(nextFormat)
              }}
              className="input-field"
            >
              {outputFormats.map((format) => (
                <option key={format} value={format}>
                  {format.toUpperCase()}
                </option>
              ))}
            </select>
          </label>

          <div className="mt-auto space-y-3">
            <Button
              variant="primary"
              size="lg"
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
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Add a prompt and select at least one file to generate a bundle.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
