import type { FileNode } from '@/types'

interface DirectoryPickerWindow extends Window {
  showDirectoryPicker?: () => Promise<FileSystemDirectoryHandle>
}

interface IterableDirectoryHandle extends FileSystemDirectoryHandle {
  values: () => AsyncIterable<FileSystemHandle>
}

const getExtension = (fileName: string): string => {
  const dotIndex = fileName.lastIndexOf('.')
  return dotIndex >= 0 ? fileName.slice(dotIndex + 1).toLowerCase() : ''
}

const sortNodes = (nodes: FileNode[]): FileNode[] => [...nodes].sort((left, right) => {
  if (left.type !== right.type) {
    return left.type === 'directory' ? -1 : 1
  }

  return left.name.localeCompare(right.name)
})

export const supportsFileSystemAccess = (): boolean =>
  typeof window !== 'undefined' && typeof (window as DirectoryPickerWindow).showDirectoryPicker === 'function'

export const openDirectory = async (): Promise<FileSystemDirectoryHandle> => {
  const picker = (window as DirectoryPickerWindow).showDirectoryPicker

  if (typeof picker !== 'function') {
    throw new Error('File System Access API is not available in this browser.')
  }

  return picker.call(window)
}

export const readDirectoryRecursive = async (
  dirHandle: FileSystemDirectoryHandle,
  currentPath = '',
): Promise<FileNode> => {
  const children: FileNode[] = []

  for await (const handle of (dirHandle as IterableDirectoryHandle).values()) {
    const name = handle.name
    const path = currentPath ? `${currentPath}/${name}` : name

    if (handle.kind === 'directory') {
      children.push(await readDirectoryRecursive(handle as FileSystemDirectoryHandle, path))
      continue
    }

    const fileHandle = handle as FileSystemFileHandle
    let size: number | undefined

    try {
      size = (await fileHandle.getFile()).size
    } catch {
      size = undefined
    }

    children.push({
      name,
      path,
      type: 'file',
      isSelected: false,
      isExpanded: false,
      size,
      extension: getExtension(name),
      handle: fileHandle,
    })
  }

  return {
    name: dirHandle.name,
    path: currentPath,
    type: 'directory',
    isSelected: false,
    isExpanded: true,
    children: sortNodes(children),
    handle: dirHandle,
  }
}

export const readFileContent = async (fileHandle: FileSystemFileHandle): Promise<string> => {
  const file = await fileHandle.getFile()
  return file.text()
}
