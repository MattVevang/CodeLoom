export type ThemeMode = 'light' | 'dark' | 'system'

export type OutputFormat = 'markdown' | 'xml' | 'plain'

export type LLMApiType = 'openai' | 'ollama' | 'anthropic' | 'generic'

export interface FileNode {
  name: string
  path: string
  type: 'file' | 'directory'
  isSelected: boolean
  isExpanded: boolean
  children?: FileNode[]
  content?: string
  size?: number
  extension?: string
  handle?: FileSystemDirectoryHandle | FileSystemFileHandle
}

export interface PromptConfig {
  userPrompt: string
  includeFileTree: boolean
  includeFilePaths: boolean
  wrapContentInCodeBlocks: boolean
  outputFormat: OutputFormat
}

export interface AssembledPrompt {
  content: string
  tokenEstimate: number
  fileCount: number
  totalSize: number
}

export interface LLMEndpoint {
  id: string
  name: string
  url: string
  model: string
  apiType: LLMApiType
  apiKey?: string
  contextLength?: number
}

export interface FileFilterDefaults {
  respectGitignore: boolean
  skipBinaryFiles: boolean
  skipHiddenFiles: boolean
  maxFileSizeKB: number
  excludePatterns: string[]
}

export interface AppSettings {
  theme: ThemeMode
  llmEndpoints: LLMEndpoint[]
  activeLLMEndpoint: string | null
  defaultFilters: FileFilterDefaults
  outputFormat: OutputFormat
}

export interface LLMResponse {
  content: string
  raw?: unknown
  usage?: {
    promptTokens?: number
    completionTokens?: number
    totalTokens?: number
  }
}
