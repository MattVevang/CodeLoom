import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AppSettings, FileFilterDefaults, LLMEndpoint, OutputFormat, ThemeMode } from '@/types'

interface SettingsStore extends AppSettings {
  setTheme: (theme: ThemeMode) => void
  addLLMEndpoint: (endpoint: Omit<LLMEndpoint, 'id'> | LLMEndpoint) => void
  updateLLMEndpoint: (id: string, endpoint: Partial<LLMEndpoint>) => void
  removeLLMEndpoint: (id: string) => void
  setActiveLLMEndpoint: (id: string | null) => void
  updateDefaultFilters: (filters: Partial<FileFilterDefaults>) => void
  setOutputFormat: (format: OutputFormat) => void
  reset: () => void
}

const defaultSettings: AppSettings = {
  theme: 'system',
  llmEndpoints: [],
  activeLLMEndpoint: null,
  defaultFilters: {
    respectGitignore: true,
    skipBinaryFiles: true,
    skipHiddenFiles: true,
    maxFileSizeKB: 512,
    excludePatterns: [],
  },
  outputFormat: 'markdown',
}

const createEndpointId = (): string => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }

  return `endpoint-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      ...defaultSettings,
      setTheme: (theme) => set({ theme }),
      addLLMEndpoint: (endpoint) =>
        set((state) => {
          const nextEndpoint = {
            ...endpoint,
            id: 'id' in endpoint ? endpoint.id : createEndpointId(),
          }

          return {
            llmEndpoints: [...state.llmEndpoints, nextEndpoint],
            activeLLMEndpoint: state.activeLLMEndpoint ?? nextEndpoint.id,
          }
        }),
      updateLLMEndpoint: (id, endpoint) =>
        set((state) => ({
          llmEndpoints: state.llmEndpoints.map((item) =>
            item.id === id ? { ...item, ...endpoint } : item,
          ),
        })),
      removeLLMEndpoint: (id) =>
        set((state) => ({
          llmEndpoints: state.llmEndpoints.filter((endpoint) => endpoint.id !== id),
          activeLLMEndpoint: state.activeLLMEndpoint === id ? null : state.activeLLMEndpoint,
        })),
      setActiveLLMEndpoint: (id) => set({ activeLLMEndpoint: id }),
      updateDefaultFilters: (filters) =>
        set((state) => ({
          defaultFilters: {
            ...state.defaultFilters,
            ...filters,
          },
        })),
      setOutputFormat: (format) => set({ outputFormat: format }),
      reset: () => set(defaultSettings),
    }),
    {
      name: 'codeloom-settings',
      partialize: (state) => ({
        theme: state.theme,
        llmEndpoints: state.llmEndpoints,
        activeLLMEndpoint: state.activeLLMEndpoint,
        defaultFilters: state.defaultFilters,
        outputFormat: state.outputFormat,
      }),
    },
  ),
)

export type { SettingsStore }
