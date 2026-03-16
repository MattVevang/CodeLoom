import { useCallback, useEffect, useRef } from 'react'
import { isBinaryFile } from '@/services/binaryDetector'
import { openDirectory, readDirectoryRecursive, readFileContent, supportsFileSystemAccess } from '@/services/fileSystem'
import type { ShouldSkipEntry } from '@/services/fileSystem'
import { isIgnored, parseGitignore } from '@/services/gitignoreParser'
import type { GitignoreRule } from '@/services/gitignoreParser'
import { useFileStore } from '@/stores/fileStore'
import { useSettingsStore } from '@/stores/settingsStore'
import type { FileFilterDefaults, FileNode } from '@/types'

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

const buildSkipCallback = (
  filters: FileFilterDefaults,
  gitignoreRules: GitignoreRule[],
): ShouldSkipEntry => (name, path, kind) => {
  if (filters.skipHiddenFiles && name.startsWith('.')) {
    return true
  }

  if (filters.respectGitignore && isIgnored(path, gitignoreRules)) {
    return true
  }

  if (kind === 'directory' && filters.excludePatterns.some((p) => matchesPattern(path, p))) {
    return true
  }

  return false
}

const hydrateFileContent = async (
  node: FileNode,
  filters: FileFilterDefaults,
): Promise<FileNode | null> => {
  if (node.type === 'directory') {
    const children = (
      await Promise.all((node.children ?? []).map((child) => hydrateFileContent(child, filters)))
    ).filter((child): child is FileNode => child !== null)

    if (node.path && children.length === 0) {
      return null
    }

    return { ...node, children, isExpanded: node.path === '', isSelected: false }
  }

  // File-level filters
  if (filters.excludePatterns.some((p) => matchesPattern(node.path, p))) {
    return null
  }

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

    return { ...node, content }
  } catch {
    // Keep the file in the tree even if content can't be read
    return node
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

const scanAndHydrate = async (
  directoryHandle: FileSystemDirectoryHandle,
  filters: FileFilterDefaults,
): Promise<FileNode> => {
  // Read .gitignore FIRST so we can skip ignored dirs during scan
  const gitignoreContent = filters.respectGitignore
    ? await readRootGitignore(directoryHandle)
    : ''
  const gitignoreRules = gitignoreContent ? parseGitignore(gitignoreContent) : []

  // Recursive scan with early skip for ignored/hidden directories
  const skipCallback = buildSkipCallback(filters, gitignoreRules)
  const rawTree = await readDirectoryRecursive(directoryHandle, '', skipCallback)

  // Hydrate: read file contents, apply file-level filters (binary, size, patterns)
  const hydrated = await hydrateFileContent(rawTree, filters)

  return hydrated ?? { ...rawTree, children: [] }
}

export const useFileSystem = () => {
  const filters = useSettingsStore((state) => state.defaultFilters)
  const setRootNode = useFileStore((state) => state.setRootNode)
  const setRootDirName = useFileStore((state) => state.setRootDirName)
  const setDirectoryHandle = useFileStore((state) => state.setDirectoryHandle)
  const setLoading = useFileStore((state) => state.setLoading)
  const setError = useFileStore((state) => state.setError)
  const isLoading = useFileStore((state) => state.isLoading)
  const error = useFileStore((state) => state.error)
  const filtersRef = useRef(filters)
  filtersRef.current = filters

  const openFolder = useCallback(async () => {
    if (!supportsFileSystemAccess()) {
      setError('Your browser does not support the File System Access API.')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const dirHandle = await openDirectory()
      const hydratedRoot = await scanAndHydrate(dirHandle, filtersRef.current)

      setDirectoryHandle(dirHandle)
      setRootDirName(dirHandle.name)
      setRootNode(hydratedRoot)
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
  }, [setDirectoryHandle, setError, setLoading, setRootDirName, setRootNode])

  // Re-scan when filter settings change (only if a folder is already open)
  useEffect(() => {
    const dirHandle = useFileStore.getState().directoryHandle
    if (!dirHandle) return

    let cancelled = false

    const refresh = async () => {
      setLoading(true)
      try {
        const hydratedRoot = await scanAndHydrate(dirHandle, filters)
        if (!cancelled) {
          setRootNode(hydratedRoot)
        }
      } catch {
        // Refresh is best-effort; keep existing tree
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void refresh()

    return () => { cancelled = true }
  }, [filters, setLoading, setRootNode])

  return {
    openFolder,
    isLoading,
    error,
  }
}
