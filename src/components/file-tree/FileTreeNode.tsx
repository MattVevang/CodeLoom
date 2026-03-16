import { ChevronDown, ChevronRight, FileCode, FileText, Folder, FolderOpen } from 'lucide-react'
import { useFileStore } from '@/stores/fileStore'
import { formatBytes } from '@/lib/utils'
import type { FileNode } from '@/types'

interface FileTreeNodeProps {
  node: FileNode
  depth: number
}

const codeExtensions = new Set(['js', 'jsx', 'ts', 'tsx', 'json', 'css', 'html', 'md', 'xml', 'yml', 'yaml'])

export const FileTreeNode = ({ node, depth }: FileTreeNodeProps) => {
  const toggleSelected = useFileStore((state) => state.toggleSelected)
  const toggleExpanded = useFileStore((state) => state.toggleExpanded)
  const isDirectory = node.type === 'directory'
  const FileIcon = isDirectory
    ? node.isExpanded
      ? FolderOpen
      : Folder
    : codeExtensions.has(node.extension ?? '')
      ? FileCode
      : FileText

  return (
    <div>
      <div
        className="group flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-zinc-700 transition-colors hover:bg-zinc-200/60 dark:text-zinc-200 dark:hover:bg-zinc-800/70"
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
      >
        {isDirectory ? (
          <button
            type="button"
            onClick={() => toggleExpanded(node.path)}
            className="rounded-sm p-0.5 text-zinc-500 transition hover:bg-zinc-300/60 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-700 dark:hover:text-zinc-100"
            aria-label={node.isExpanded ? 'Collapse folder' : 'Expand folder'}
          >
            {node.isExpanded ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
          </button>
        ) : (
          <span className="size-4 shrink-0" />
        )}

        <input
          type="checkbox"
          checked={node.isSelected}
          onChange={() => toggleSelected(node.path)}
          className="size-4 rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-950"
          aria-label={`Select ${node.name}`}
        />

        <FileIcon className="size-4 shrink-0 text-zinc-400 group-hover:text-indigo-500 dark:text-zinc-500 dark:group-hover:text-indigo-300" />

        {isDirectory ? (
          <button
            type="button"
            onClick={() => toggleExpanded(node.path)}
            className="min-w-0 flex-1 truncate text-left text-sm font-medium text-zinc-800 transition hover:text-zinc-950 dark:text-zinc-100 dark:hover:text-white"
          >
            {node.name}
          </button>
        ) : (
          <span className="min-w-0 flex-1 truncate">{node.name}</span>
        )}

        {node.type === 'file' && typeof node.size === 'number' ? (
          <span className="shrink-0 text-xs text-zinc-400 dark:text-zinc-500">{formatBytes(node.size)}</span>
        ) : null}
      </div>

      {isDirectory && node.isExpanded
        ? node.children?.map((child) => <FileTreeNode key={child.path} node={child} depth={depth + 1} />)
        : null}
    </div>
  )
}
