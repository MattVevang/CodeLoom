import { create } from 'zustand'
import type { AssembledPrompt, OutputFormat, PromptConfig } from '@/types'

interface PromptStore {
  config: PromptConfig
  assembledPrompt: AssembledPrompt | null
  setUserPrompt: (prompt: string) => void
  setIncludeFileTree: (include: boolean) => void
  setIncludeFilePaths: (include: boolean) => void
  setWrapContentInCodeBlocks: (wrap: boolean) => void
  setOutputFormat: (format: OutputFormat) => void
  setAssembledPrompt: (prompt: AssembledPrompt | null) => void
  reset: () => void
}

const defaultConfig: PromptConfig = {
  userPrompt: '',
  includeFileTree: true,
  includeFilePaths: true,
  wrapContentInCodeBlocks: true,
  outputFormat: 'markdown',
}

export const usePromptStore = create<PromptStore>((set) => ({
  config: { ...defaultConfig },
  assembledPrompt: null,
  setUserPrompt: (prompt) =>
    set((state) => ({
      config: {
        ...state.config,
        userPrompt: prompt,
      },
    })),
  setIncludeFileTree: (include) =>
    set((state) => ({
      config: {
        ...state.config,
        includeFileTree: include,
      },
    })),
  setIncludeFilePaths: (include) =>
    set((state) => ({
      config: {
        ...state.config,
        includeFilePaths: include,
      },
    })),
  setWrapContentInCodeBlocks: (wrap) =>
    set((state) => ({
      config: {
        ...state.config,
        wrapContentInCodeBlocks: wrap,
      },
    })),
  setOutputFormat: (format) =>
    set((state) => ({
      config: {
        ...state.config,
        outputFormat: format,
      },
    })),
  setAssembledPrompt: (prompt) => set({ assembledPrompt: prompt }),
  reset: () =>
    set({
      config: { ...defaultConfig },
      assembledPrompt: null,
    }),
}))

export type { PromptStore }
