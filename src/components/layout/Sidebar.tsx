import { FolderOpen, PanelLeftClose } from 'lucide-react'
import { useMemo } from 'react'
import { FileTree } from '@/components/file-tree/FileTree'
import { Button } from '@/components/ui/Button'
import { useFileSystem } from '@/hooks/useFileSystem'
import { cn } from '@/lib/utils'
import { useFileStore } from '@/stores/fileStore'
import type { FileNode } from '@/types'

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

const countFiles = (node: FileNode | null): number => {
  if (!node) {
    return 0
  }

  if (node.type === 'file') {
    return 1
  }

  return (node.children ?? []).reduce((total, child) => total + countFiles(child), 0)
}

export const Sidebar = ({ isOpen, onClose }: SidebarProps) => {
  const rootNode = useFileStore((state) => state.rootNode)
  const selectAll = useFileStore((state) => state.selectAll)
  const deselectAll = useFileStore((state) => state.deselectAll)
  const selectedCount = useFileStore((state) => state.getSelectedCount())
  const { openFolder, isLoading, error } = useFileSystem()

  const totalFiles = useMemo(() => countFiles(rootNode), [rootNode])

  return (
    <>
      <div
        className={cn(
          'fixed inset-0 z-20 bg-zinc-950/40 backdrop-blur-sm transition-opacity md:hidden',
          isOpen ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
        onClick={onClose}
      />

      <aside
        className={cn(
          'fixed inset-y-16 left-0 z-30 flex w-[300px] flex-col border-r border-zinc-200/80 bg-white/90 transition-transform duration-300 dark:border-zinc-800/80 dark:bg-zinc-950/90',
          'md:static md:inset-y-auto md:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex items-center justify-between border-b border-zinc-200/70 p-4 dark:border-zinc-800/80 md:hidden">
          <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Project files</p>
          <Button
            variant="ghost"
            size="sm"
            icon={<PanelLeftClose className="size-4" />}
            onClick={onClose}
            aria-label="Close sidebar"
          />
        </div>

        <div className="flex min-h-0 flex-1 flex-col p-4">
          <Button
            variant="primary"
            fullWidth
            loading={isLoading}
            icon={<FolderOpen className="size-4" />}
            onClick={() => {
              void openFolder()
            }}
          >
            Open Folder
          </Button>

          {error ? (
            <div className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300">
              {error}
            </div>
          ) : null}

          <div className="mt-4 min-h-0 flex-1 overflow-hidden">
            <FileTree />
          </div>

          <div className="mt-4 space-y-3 border-t border-zinc-200/70 pt-4 dark:border-zinc-800/80">
            <div className="text-sm text-zinc-600 dark:text-zinc-300">
              <span className="font-semibold text-zinc-900 dark:text-zinc-100">{selectedCount}</span>
              {' '}
              of
              {' '}
              <span className="font-semibold text-zinc-900 dark:text-zinc-100">{totalFiles}</span>
              {' '}
              files selected
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="secondary" size="sm" disabled={totalFiles === 0} onClick={selectAll}>
                Select All
              </Button>
              <Button variant="ghost" size="sm" disabled={selectedCount === 0} onClick={deselectAll}>
                Deselect All
              </Button>
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}
