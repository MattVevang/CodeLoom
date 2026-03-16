import { create } from 'zustand'
import type { FileNode } from '@/types'

interface FileStore {
  rootNode: FileNode | null
  rootDirName: string
  isLoading: boolean
  error: string | null
  setRootNode: (node: FileNode | null) => void
  setRootDirName: (name: string) => void
  toggleSelected: (path: string) => void
  toggleExpanded: (path: string) => void
  selectAll: () => void
  deselectAll: () => void
  setFileContent: (path: string, content: string) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  getSelectedFiles: () => FileNode[]
  getSelectedCount: () => number
  reset: () => void
}

const initialState = {
  rootNode: null as FileNode | null,
  rootDirName: '',
  isLoading: false,
  error: null as string | null,
}

const setSubtreeSelection = (node: FileNode, selected: boolean): FileNode => ({
  ...node,
  isSelected: selected,
  children: node.children?.map((child) => setSubtreeSelection(child, selected)),
})

const syncDirectorySelection = (node: FileNode): FileNode => {
  if (node.type !== 'directory' || !node.children) {
    return node
  }

  const children = node.children.map(syncDirectorySelection)

  return {
    ...node,
    children,
    isSelected: children.length > 0 && children.every((child) => child.isSelected),
  }
}

const toggleSelectionInTree = (node: FileNode, path: string): FileNode => {
  if (node.path === path) {
    return setSubtreeSelection(node, !node.isSelected)
  }

  if (!node.children) {
    return node
  }

  const children = node.children.map((child) => toggleSelectionInTree(child, path))
  const changed = children.some((child, index) => child !== node.children?.[index])

  if (!changed) {
    return node
  }

  return syncDirectorySelection({
    ...node,
    children,
  })
}

const toggleExpandedInTree = (node: FileNode, path: string): FileNode => {
  if (node.path === path && node.type === 'directory') {
    return {
      ...node,
      isExpanded: !node.isExpanded,
    }
  }

  if (!node.children) {
    return node
  }

  const children = node.children.map((child) => toggleExpandedInTree(child, path))
  const changed = children.some((child, index) => child !== node.children?.[index])

  return changed
    ? {
        ...node,
        children,
      }
    : node
}

const setFileContentInTree = (node: FileNode, path: string, content: string): FileNode => {
  if (node.path === path && node.type === 'file') {
    return {
      ...node,
      content,
      size: node.size ?? new TextEncoder().encode(content).length,
    }
  }

  if (!node.children) {
    return node
  }

  const children = node.children.map((child) => setFileContentInTree(child, path, content))
  const changed = children.some((child, index) => child !== node.children?.[index])

  return changed
    ? {
        ...node,
        children,
      }
    : node
}

const collectSelectedFiles = (node: FileNode): FileNode[] => {
  const selectedFiles = node.type === 'file' && node.isSelected ? [node] : []

  if (!node.children) {
    return selectedFiles
  }

  return selectedFiles.concat(...node.children.map(collectSelectedFiles))
}

export const useFileStore = create<FileStore>((set, get) => ({
  ...initialState,
  setRootNode: (node) => set({ rootNode: node }),
  setRootDirName: (name) => set({ rootDirName: name }),
  toggleSelected: (path) =>
    set((state) => ({
      rootNode: state.rootNode ? toggleSelectionInTree(state.rootNode, path) : null,
    })),
  toggleExpanded: (path) =>
    set((state) => ({
      rootNode: state.rootNode ? toggleExpandedInTree(state.rootNode, path) : null,
    })),
  selectAll: () =>
    set((state) => ({
      rootNode: state.rootNode ? setSubtreeSelection(state.rootNode, true) : null,
    })),
  deselectAll: () =>
    set((state) => ({
      rootNode: state.rootNode ? setSubtreeSelection(state.rootNode, false) : null,
    })),
  setFileContent: (path, content) =>
    set((state) => ({
      rootNode: state.rootNode ? setFileContentInTree(state.rootNode, path, content) : null,
    })),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  getSelectedFiles: () => {
    const { rootNode } = get()
    return rootNode ? collectSelectedFiles(rootNode) : []
  },
  getSelectedCount: () => get().getSelectedFiles().length,
  reset: () => set(initialState),
}))

export type { FileStore }
