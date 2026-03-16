import { useCallback } from 'react'
import { isBinaryFile } from '@/services/binaryDetector'
import { openDirectory, readDirectoryRecursive, readFileContent, supportsFileSystemAccess } from '@/services/fileSystem'
import { isIgnored, parseGitignore } from '@/services/gitignoreParser'
import { useFileStore } from '@/stores/fileStore'
import { useSettingsStore } from '@/stores/settingsStore'
import type { FileNode } from '@/types'

const matchesPattern = (value: string, pattern: string): boolean => {
  const normalizedPattern = pattern.trim().replace(/\\/g, '/')

  if (!normalizedPattern) {
    return false
  }

  const escaped = normalizedPattern
    .replace(/[|\\{}()[\]^$+?.]/g, '\\$&')
    .replace(/\*/g, '.*')

  return new RegExp(`^${escaped}$`, 'i').test(value) || new RegExp(escaped, 'i').test(value)
}

const shouldSkipNode = (
  node: FileNode,
  respectGitignore: boolean,
  skipHiddenFiles: boolean,
  excludePatterns: string[],
  gitignoreRules: ReturnType<typeof parseGitignore>,
): boolean => {
  if (node.path && skipHiddenFiles && node.name.startsWith('.')) {
    return true
  }

  if (node.path && respectGitignore && isIgnored(node.path, gitignoreRules)) {
    return true
  }

  return excludePatterns.some((pattern) => matchesPattern(node.path, pattern))
}

const hydrateNode = async (
  node: FileNode,
  filters: ReturnType<typeof useSettingsStore.getState>['defaultFilters'],
  gitignoreRules: ReturnType<typeof parseGitignore>,
): Promise<FileNode | null> => {
  if (
    shouldSkipNode(
      node,
      filters.respectGitignore,
      filters.skipHiddenFiles,
      filters.excludePatterns,
      gitignoreRules,
    )
  ) {
    return null
  }

  if (node.type === 'file') {
    if (typeof node.size === 'number' && node.size > filters.maxFileSizeKB * 1024) {
      return null
    }

    if (!node.handle || node.handle.kind !== 'file') {
      return node
    }

    try {
      const content = await readFileContent(node.handle)

      if (filters.skipBinaryFiles && isBinaryFile(content, node.name)) {
        return null
      }

      return {
        ...node,
        content,
      }
    } catch {
      return null
    }
  }

  const children = (
    await Promise.all((node.children ?? []).map((child) => hydrateNode(child, filters, gitignoreRules)))
  ).filter((child): child is FileNode => child !== null)

  if (node.path && children.length === 0) {
    return null
  }

  return {
    ...node,
    children,
    isExpanded: node.path === '',
    isSelected: false,
  }
}

const readRootGitignore = async (dirHandle: FileSystemDirectoryHandle): Promise<string> => {
  try {
    const fileHandle = await dirHandle.getFileHandle('.gitignore')
    return readFileContent(fileHandle)
  } catch {
    return ''
  }
}

export const useFileSystem = () => {
  const filters = useSettingsStore((state) => state.defaultFilters)
  const setRootNode = useFileStore((state) => state.setRootNode)
  const setRootDirName = useFileStore((state) => state.setRootDirName)
  const setLoading = useFileStore((state) => state.setLoading)
  const setError = useFileStore((state) => state.setError)
  const isLoading = useFileStore((state) => state.isLoading)
  const error = useFileStore((state) => state.error)

  const openFolder = useCallback(async () => {
    if (!supportsFileSystemAccess()) {
      setError('Your browser does not support the File System Access API.')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const directoryHandle = await openDirectory()
      const rootNode = await readDirectoryRecursive(directoryHandle)
      const gitignoreContent = filters.respectGitignore
        ? await readRootGitignore(directoryHandle)
        : ''
      const gitignoreRules = gitignoreContent ? parseGitignore(gitignoreContent) : []
      const hydratedRoot = await hydrateNode(rootNode, filters, gitignoreRules)

      setRootDirName(directoryHandle.name)
      setRootNode(
        hydratedRoot ?? {
          ...rootNode,
          children: [],
        },
      )
    } catch (caughtError) {
      if (caughtError instanceof DOMException && caughtError.name === 'AbortError') {
        setLoading(false)
        return
      }

      setError(
        caughtError instanceof Error ? caughtError.message : 'Unable to open the selected folder.',
      )
    } finally {
      setLoading(false)
    }
  }, [filters, setError, setLoading, setRootDirName, setRootNode])

  return {
    openFolder,
    isLoading,
    error,
  }
}
