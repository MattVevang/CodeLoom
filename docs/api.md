# CodeLoom API Reference

This document describes the core client-side modules that make up CodeLoom's architecture. The Zustand stores listed here already exist in `src/stores`, while the service and hook sections define the intended module boundaries for the app.

## Services Reference

### `fileSystem`
**Purpose:** Open local directories, build file trees, and read file contents in the browser.

**Exports**
```ts
pickDirectory(): Promise<FileSystemDirectoryHandle>
buildFileTree(handle: FileSystemDirectoryHandle, options?: FileScanOptions): Promise<FileNode>
readFileContent(handle: FileSystemFileHandle): Promise<string>
readSelectedFiles(root: FileNode): Promise<FileNode[]>
```

**Usage**
```ts
const dirHandle = await fileSystem.pickDirectory()
const tree = await fileSystem.buildFileTree(dirHandle, { skipHiddenFiles: true })
```

### `promptAssembler`
**Purpose:** Turn selected files and prompt settings into a single output payload.

**Exports**
```ts
assemblePrompt(files: FileNode[], config: PromptConfig): AssembledPrompt
renderFileTree(root: FileNode): string
formatFileSection(file: FileNode, config: PromptConfig): string
```

**Usage**
```ts
const result = promptAssembler.assemblePrompt(selectedFiles, promptConfig)
console.log(result.content)
```

### `tokenEstimator`
**Purpose:** Provide a rough token estimate before prompt export or bridge submission.

**Exports**
```ts
estimateTokens(text: string): number
estimateFiles(files: FileNode[]): { fileCount: number; totalSize: number; tokenEstimate: number }
```

**Usage**
```ts
const estimate = tokenEstimator.estimateTokens(assembledPrompt.content)
```

### `llmBridge`
**Purpose:** Send assembled prompts to a user-selected local chat-completions-style endpoint.

**Exports**
```ts
buildRequest(prompt: string, endpoint: LLMEndpoint): LLMBridgeRequest
sendPrompt(request: LLMBridgeRequest): Promise<LLMBridgeResponse>
testConnection(endpoint: LLMEndpoint): Promise<boolean>
```

**Usage**
```ts
const request = llmBridge.buildRequest(assembledPrompt.content, endpoint)
const response = await llmBridge.sendPrompt(request)
```

### `gitignoreParser`
**Purpose:** Parse ignore rules so directory scans can skip irrelevant files.

**Exports**
```ts
parseGitignore(contents: string): IgnoreMatcher
matchesPath(path: string, matcher: IgnoreMatcher): boolean
```

**Usage**
```ts
const matcher = gitignoreParser.parseGitignore(gitignoreText)
const shouldSkip = gitignoreParser.matchesPath('dist/index.js', matcher)
```

### `binaryDetector`
**Purpose:** Detect binary files before reading them into prompt output.

**Exports**
```ts
isBinaryBuffer(buffer: ArrayBuffer): boolean
isBinaryFile(file: File): Promise<boolean>
```

**Usage**
```ts
if (!(await binaryDetector.isBinaryFile(file))) {
  // safe to include as text
}
```

## Stores Reference

### `fileStore`
**Purpose:** Hold the file tree, selection state, file content cache, and loading state.

**Current shape**
```ts
rootNode: FileNode | null
rootDirName: string
isLoading: boolean
error: string | null
setRootNode(node: FileNode): void
setRootDirName(name: string): void
toggleSelected(path: string): void
toggleExpanded(path: string): void
selectAll(): void
deselectAll(): void
setFileContent(path: string, content: string): void
setLoading(loading: boolean): void
setError(error: string | null): void
getSelectedFiles(): FileNode[]
getSelectedCount(): number
reset(): void
```

### `promptStore`
**Purpose:** Keep prompt configuration and the most recent assembled output.

**Current shape**
```ts
config: PromptConfig
assembledPrompt: AssembledPrompt | null
setUserPrompt(prompt: string): void
setIncludeFileTree(include: boolean): void
setIncludeFilePaths(include: boolean): void
setWrapContentInCodeBlocks(wrap: boolean): void
setOutputFormat(format: 'markdown' | 'xml' | 'plain'): void
setAssembledPrompt(prompt: AssembledPrompt | null): void
reset(): void
```

### `settingsStore`
**Purpose:** Persist theme, filters, output format, and local endpoint definitions.

**Current shape**
```ts
theme: 'light' | 'dark' | 'system'
llmEndpoints: LLMEndpoint[]
activeLLMEndpoint: string | null
defaultFilters: {
  respectGitignore: boolean
  skipBinaryFiles: boolean
  skipHiddenFiles: boolean
  includePatterns: string[]
  excludePatterns: string[]
  maxFileSizeKB: number
}
outputFormat: 'markdown' | 'xml' | 'plain'
setTheme(theme: 'light' | 'dark' | 'system'): void
addLLMEndpoint(endpoint: LLMEndpoint): void
removeLLMEndpoint(name: string): void
updateLLMEndpoint(name: string, endpoint: Partial<LLMEndpoint>): void
setActiveLLMEndpoint(name: string | null): void
updateFilters(filters: Partial<AppSettings['defaultFilters']>): void
setOutputFormat(format: 'markdown' | 'xml' | 'plain'): void
resetToDefaults(): void
```

## Hooks Reference

### `useTheme`
**Purpose:** Resolve and apply the active UI theme from settings.

**Suggested signature**
```ts
useTheme(): {
  theme: 'light' | 'dark' | 'system'
  resolvedTheme: 'light' | 'dark'
  setTheme(theme: 'light' | 'dark' | 'system'): void
}
```

### `useClipboard`
**Purpose:** Copy generated output and expose copy-state feedback.

**Suggested signature**
```ts
useClipboard(): {
  copied: boolean
  copy(value: string): Promise<boolean>
  reset(): void
}
```

### `useFileSystem`
**Purpose:** Wrap browser file-system interactions for components.

**Suggested signature**
```ts
useFileSystem(): {
  isSupported: boolean
  openDirectory(): Promise<void>
  readFile(node: FileNode): Promise<string>
  refreshTree(): Promise<void>
}
```
