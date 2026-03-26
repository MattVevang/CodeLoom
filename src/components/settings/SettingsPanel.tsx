import { CheckCircle2, Plus, RefreshCw, Trash2, Wifi, XCircle } from 'lucide-react'
import { useState } from 'react'
import type { FormEvent } from 'react'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Toggle } from '@/components/ui/Toggle'
import { isLocalEnvironment } from '@/lib/environment'
import { getModelInfo, listModelsDetailed, testConnection } from '@/services/llmBridge'
import type { ModelInfo } from '@/services/llmBridge'
import { useSettingsStore } from '@/stores/settingsStore'
import type { LLMApiType, ThemeMode } from '@/types'

interface SettingsPanelProps {
  isOpen: boolean
  onClose: () => void
}

interface EndpointFormState {
  name: string
  url: string
  model: string
  apiType: LLMApiType
  apiKey: string
}

const initialFormState: EndpointFormState = {
  name: '',
  url: 'http://localhost:11434',
  model: '',
  apiType: 'ollama',
  apiKey: '',
}

const themeOptions: Array<{ value: ThemeMode; label: string }> = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'system', label: 'System' },
]

export const SettingsPanel = ({ isOpen, onClose }: SettingsPanelProps) => {
  const isLocal = isLocalEnvironment()
  const theme = useSettingsStore((state) => state.theme)
  const setTheme = useSettingsStore((state) => state.setTheme)
  const llmEndpoints = useSettingsStore((state) => state.llmEndpoints)
  const activeLLMEndpoint = useSettingsStore((state) => state.activeLLMEndpoint)
  const addLLMEndpoint = useSettingsStore((state) => state.addLLMEndpoint)
  const removeLLMEndpoint = useSettingsStore((state) => state.removeLLMEndpoint)
  const setActiveLLMEndpoint = useSettingsStore((state) => state.setActiveLLMEndpoint)
  const updateLLMEndpoint = useSettingsStore((state) => state.updateLLMEndpoint)
  const defaultFilters = useSettingsStore((state) => state.defaultFilters)
  const updateDefaultFilters = useSettingsStore((state) => state.updateDefaultFilters)
  const [formState, setFormState] = useState<EndpointFormState>(initialFormState)
  const [testingId, setTestingId] = useState<string | null>(null)
  const [connectionResults, setConnectionResults] = useState<Record<string, boolean>>({})
  const [detectedModels, setDetectedModels] = useState<ModelInfo[]>([])
  const [detectingModels, setDetectingModels] = useState(false)

  const handleDetectModels = async () => {
    if (!formState.url.trim()) return
    setDetectingModels(true)
    try {
      const models = await listModelsDetailed({
        id: '', name: '', url: formState.url.trim(),
        model: '', apiType: formState.apiType,
      })
      setDetectedModels(models)
      if (models.length > 0 && !formState.model) {
        setFormState((s) => ({ ...s, model: models[0].name }))
      }
    } catch {
      setDetectedModels([])
    } finally {
      setDetectingModels(false)
    }
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!formState.name.trim() || !formState.url.trim() || !formState.model.trim()) {
      return
    }

    let contextLength: number | undefined
    try {
      const info = await getModelInfo(
        { id: '', name: '', url: formState.url.trim(), model: formState.model.trim(), apiType: formState.apiType },
        formState.model.trim(),
      )
      contextLength = info.contextLength
    } catch {
      // best-effort
    }

    addLLMEndpoint({
      name: formState.name.trim(),
      url: formState.url.trim(),
      model: formState.model.trim(),
      apiType: formState.apiType,
      apiKey: formState.apiKey.trim() || undefined,
      contextLength,
    })
    setFormState(initialFormState)
    setDetectedModels([])
  }

  const handleTestConnection = async (endpointId: string) => {
    const endpoint = llmEndpoints.find((item) => item.id === endpointId)
    if (!endpoint) {
      return
    }

    setTestingId(endpointId)

    try {
      const result = await testConnection(endpoint)
      setConnectionResults((state) => ({
        ...state,
        [endpointId]: result,
      }))

      if (result && !endpoint.contextLength) {
        try {
          const info = await getModelInfo(endpoint, endpoint.model)
          if (info.contextLength) {
            updateLLMEndpoint(endpoint.id, { contextLength: info.contextLength })
          }
        } catch {
          // best-effort
        }
      }
    } finally {
      setTestingId(null)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Settings" className="max-w-5xl">
      <div className="grid gap-6 p-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <div className="space-y-6">
          <section className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-400">
                Theme
              </h3>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                Pick the workspace chrome that feels best for long prompt-weaving sessions.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {themeOptions.map((option) => (
                <Button
                  key={option.value}
                  variant={theme === option.value ? 'primary' : 'secondary'}
                  onClick={() => setTheme(option.value)}
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </section>

          <section className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-400">
                File filter defaults
              </h3>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                Keep noisy files out of your prompt bundle by default.
              </p>
            </div>

            <div className="space-y-3">
              <Toggle
                label="Respect .gitignore"
                checked={defaultFilters.respectGitignore}
                onChange={(checked) => updateDefaultFilters({ respectGitignore: checked })}
              />
              <Toggle
                label="Skip binary files"
                checked={defaultFilters.skipBinaryFiles}
                onChange={(checked) => updateDefaultFilters({ skipBinaryFiles: checked })}
              />
              <Toggle
                label="Skip hidden files"
                checked={defaultFilters.skipHiddenFiles}
                onChange={(checked) => updateDefaultFilters({ skipHiddenFiles: checked })}
              />
            </div>

            <label className="block space-y-2 text-sm font-medium text-zinc-700 dark:text-zinc-200">
              <span>Max file size (KB)</span>
              <input
                type="number"
                min={1}
                value={defaultFilters.maxFileSizeKB}
                onChange={(event) =>
                  updateDefaultFilters({
                    maxFileSizeKB: Math.max(1, Number(event.target.value) || 1),
                  })
                }
                className="input-field"
              />
            </label>

            <label className="block space-y-2 text-sm font-medium text-zinc-700 dark:text-zinc-200">
              <span>Exclude patterns</span>
              <input
                type="text"
                value={defaultFilters.excludePatterns.join(', ')}
                onChange={(event) =>
                  updateDefaultFilters({
                    excludePatterns: event.target.value
                      .split(',')
                      .map((pattern) => pattern.trim())
                      .filter(Boolean),
                  })
                }
                placeholder="dist/**, *.lock, coverage/**"
                className="input-field"
              />
            </label>
          </section>
        </div>

        {isLocal ? (
        <div className="space-y-6">
          <section className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-400">
                LLM endpoints
              </h3>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                Manage local or remote model endpoints used to send completed prompt bundles.
              </p>
            </div>

            <div className="space-y-3">
              {llmEndpoints.length > 0 ? (
                llmEndpoints.map((endpoint) => {
                  const connectionState = connectionResults[endpoint.id]
                  const isActive = endpoint.id === activeLLMEndpoint

                  return (
                    <div
                      key={endpoint.id}
                      className="rounded-lg border border-zinc-200/80 bg-zinc-50/80 p-4 dark:border-zinc-800 dark:bg-zinc-950/70"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                              {endpoint.name}
                            </p>
                            {isActive ? (
                              <span className="rounded-full bg-indigo-600/10 px-2 py-0.5 text-xs font-medium text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-200">
                                Active
                              </span>
                            ) : null}
                          </div>
                          <p className="text-sm text-zinc-500 dark:text-zinc-400">{endpoint.url}</p>
                          <p className="text-xs uppercase tracking-[0.16em] text-zinc-400 dark:text-zinc-500">
                            {endpoint.apiType} · {endpoint.model}
                            {endpoint.contextLength ? ` · ${new Intl.NumberFormat().format(endpoint.contextLength)} ctx` : ''}
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <Button
                            variant={isActive ? 'primary' : 'secondary'}
                            size="sm"
                            onClick={() => setActiveLLMEndpoint(endpoint.id)}
                          >
                            {isActive ? 'Selected' : 'Use'}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            loading={testingId === endpoint.id}
                            icon={<Wifi className="size-4" />}
                            onClick={() => {
                              void handleTestConnection(endpoint.id)
                            }}
                          >
                            Test
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            icon={<Trash2 className="size-4" />}
                            onClick={() => removeLLMEndpoint(endpoint.id)}
                          >
                            Delete
                          </Button>
                        </div>
                      </div>

                      {typeof connectionState === 'boolean' ? (
                        <div className="mt-3 flex items-center gap-2 text-sm">
                          {connectionState ? (
                            <>
                              <CheckCircle2 className="size-4 text-emerald-500" />
                              <span className="text-emerald-700 dark:text-emerald-300">
                                Connection succeeded.
                              </span>
                            </>
                          ) : (
                            <>
                              <XCircle className="size-4 text-rose-500" />
                              <span className="text-rose-700 dark:text-rose-300">Connection failed.</span>
                            </>
                          )}
                        </div>
                      ) : null}
                    </div>
                  )
                })
              ) : (
                <div className="rounded-lg border border-dashed border-zinc-300 px-4 py-6 text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
                  No endpoints configured yet. Add one below to enable one-click LLM handoff.
                </div>
              )}
            </div>
          </section>

          <section className="space-y-4 rounded-lg border border-zinc-200/80 p-4 dark:border-zinc-800">
            <div className="flex items-center gap-2">
              <Plus className="size-4 text-indigo-500" />
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Add endpoint</h3>
            </div>

            <form className="grid gap-3 md:grid-cols-2" onSubmit={(e) => { void handleSubmit(e) }}>
              <input
                type="text"
                value={formState.name}
                onChange={(event) => setFormState((state) => ({ ...state, name: event.target.value }))}
                placeholder="Name (e.g. My Ollama)"
                className="input-field"
              />
              <div className="flex gap-2">
                <input
                  type="url"
                  value={formState.url}
                  onChange={(event) => setFormState((state) => ({ ...state, url: event.target.value }))}
                  placeholder="URL"
                  className="input-field"
                />
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  loading={detectingModels}
                  icon={<RefreshCw className="size-3.5" />}
                  onClick={() => { void handleDetectModels() }}
                  aria-label="Detect available models"
                />
              </div>
              {detectedModels.length > 0 ? (
                <div className="md:col-span-2">
                  <label className="block space-y-1 text-xs font-medium text-zinc-600 dark:text-zinc-400">
                    <span>Detected models — select one:</span>
                    <select
                      value={formState.model}
                      onChange={(event) => setFormState((s) => ({ ...s, model: event.target.value }))}
                      className="input-field text-sm"
                    >
                      <option value="" disabled>Choose a model…</option>
                      {detectedModels.map((m) => (
                        <option key={m.name} value={m.name}>
                          {m.name}{m.parameterSize ? ` (${m.parameterSize})` : ''}{m.quantization ? ` [${m.quantization}]` : ''}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              ) : (
                <input
                  type="text"
                  value={formState.model}
                  onChange={(event) => setFormState((state) => ({ ...state, model: event.target.value }))}
                  placeholder="Model name"
                  className="input-field"
                />
              )}
              <select
                value={formState.apiType}
                onChange={(event) => {
                  setFormState((state) => ({
                    ...state,
                    apiType: event.target.value as LLMApiType,
                  }))
                  setDetectedModels([])
                }}
                className="input-field"
              >
                <option value="ollama">Ollama</option>
                <option value="openai">OpenAI-compatible</option>
                <option value="anthropic">Anthropic</option>
                <option value="generic">Generic JSON endpoint</option>
              </select>
              <input
                type="password"
                value={formState.apiKey}
                onChange={(event) => setFormState((state) => ({ ...state, apiKey: event.target.value }))}
                placeholder="API key (optional)"
                className="input-field md:col-span-2"
              />
              <div className="md:col-span-2 flex justify-end">
                <Button type="submit" variant="primary" icon={<Plus className="size-4" />}>
                  Add endpoint
                </Button>
              </div>
            </form>
          </section>
        </div>
        ) : (
        <div className="space-y-6">
          <section className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-400">
                LLM integration
              </h3>
            </div>

            <div className="rounded-lg border border-amber-200/60 bg-amber-50/50 p-4 dark:border-amber-500/20 dark:bg-amber-500/5">
              <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                LLM features are available when running locally
              </p>
              <p className="mt-2 text-sm text-amber-700 dark:text-amber-300">
                Browser security prevents this hosted site from connecting to LLM services on your
                device. To use the Send&nbsp;to&nbsp;LLM feature, run CodeLoom locally:
              </p>
              <div className="mt-3 space-y-2">
                <div className="rounded-md bg-amber-100/60 p-3 dark:bg-amber-500/10">
                  <p className="text-xs font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-300">
                    Docker (recommended)
                  </p>
                  <code className="mt-1 block text-sm text-amber-900 dark:text-amber-100">
                    docker compose up --build -d
                  </code>
                  <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
                    Then open <strong>http://localhost:8080</strong>
                  </p>
                </div>
                <div className="rounded-md bg-amber-100/60 p-3 dark:bg-amber-500/10">
                  <p className="text-xs font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-300">
                    npm
                  </p>
                  <code className="mt-1 block text-sm text-amber-900 dark:text-amber-100">
                    npm install &amp;&amp; npm run dev
                  </code>
                  <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
                    Then open <strong>http://localhost:5173</strong>
                  </p>
                </div>
              </div>
              <p className="mt-3 text-xs text-amber-600 dark:text-amber-400">
                All other features — file browsing, prompt assembly, copy, and download — work fully
                on this hosted version.
              </p>
            </div>
          </section>
        </div>
        )}
      </div>

      <div className="flex justify-end border-t border-zinc-200/70 px-6 py-4 dark:border-zinc-800/80">
        <Button variant="secondary" onClick={onClose}>
          Close
        </Button>
      </div>
    </Modal>
  )
}
