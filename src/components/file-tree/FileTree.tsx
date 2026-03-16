import { FolderOpen, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { FileTreeNode } from '@/components/file-tree/FileTreeNode'
import { useFileStore } from '@/stores/fileStore'
import type { FileNode } from '@/types'

const filterNodes = (nodes: FileNode[], searchTerm: string): FileNode[] => {
  const normalizedSearch = searchTerm.trim().toLowerCase()

  if (!normalizedSearch) {
    return nodes
  }

  return nodes.flatMap((node) => {
    const matchesSelf = node.name.toLowerCase().includes(normalizedSearch)

    if (node.type === 'file') {
      return matchesSelf ? [node] : []
    }

    const filteredChildren = filterNodes(node.children ?? [], normalizedSearch)

    if (matchesSelf) {
      return [{ ...node, isExpanded: true }]
    }

    if (filteredChildren.length > 0) {
      return [{ ...node, children: filteredChildren, isExpanded: true }]
    }

    return []
  })
}

export const FileTree = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const rootNode = useFileStore((state) => state.rootNode)

  const visibleNodes = useMemo(
    () => filterNodes(rootNode?.children ?? [], searchTerm),
    [rootNode, searchTerm],
  )

  if (!rootNode) {
    return (
      <div className="panel-muted flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
        <FolderOpen className="size-10 text-zinc-400 dark:text-zinc-600" />
        <div>
          <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">No folder open</p>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Pick a repository to browse files, select context, and assemble prompts.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="panel-muted flex h-full min-h-0 flex-col overflow-hidden">
      <div className="border-b border-zinc-200/70 p-3 dark:border-zinc-800/80">
        <label className="relative block">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-zinc-400" />
          <input
            type="search"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Filter files by name"
            className="input-field pl-9"
          />
        </label>
      </div>

      <div className="subtle-scrollbar min-h-0 flex-1 overflow-y-auto p-2">
        {visibleNodes.length > 0 ? (
          visibleNodes.map((node) => <FileTreeNode key={node.path} node={node} depth={0} />)
        ) : (
          <div className="flex h-full items-center justify-center px-4 text-center text-sm text-zinc-500 dark:text-zinc-400">
            {searchTerm
              ? 'No files match your current filter.'
              : 'No readable text files were found with the current filters.'}
          </div>
        )}
      </div>
    </div>
  )
}
