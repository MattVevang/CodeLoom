import { Menu, Moon, Settings, Sun, Workflow } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useTheme } from '@/hooks/useTheme'
import { useFileStore } from '@/stores/fileStore'

interface HeaderProps {
  onOpenSettings: () => void
  onToggleSidebar: () => void
}

export const Header = ({ onOpenSettings, onToggleSidebar }: HeaderProps) => {
  const rootDirName = useFileStore((state) => state.rootDirName)
  const { isDark, setTheme } = useTheme()

  return (
    <header className="fixed inset-x-0 top-0 z-40 border-b border-zinc-200/70 bg-white/80 backdrop-blur-lg dark:border-zinc-800/80 dark:bg-zinc-900/80">
      <div className="mx-auto flex h-16 items-center gap-3 px-4 lg:px-6">
        <Button
          variant="ghost"
          size="sm"
          className="md:hidden"
          icon={<Menu className="size-4" />}
          onClick={onToggleSidebar}
          aria-label="Open sidebar"
        />

        <div className="flex min-w-0 items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-indigo-600/10 text-indigo-600 shadow-sm shadow-indigo-950/10 dark:bg-indigo-500/15 dark:text-indigo-300">
            <Workflow className="size-5" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">CodeLoom</p>
            <p className="hidden text-xs text-zinc-500 dark:text-zinc-400 sm:block">
              Weave source files into local LLM-ready prompts
            </p>
          </div>
        </div>

        <div className="min-w-0 flex-1 px-2 text-center">
          <p className="truncate text-sm font-medium text-zinc-600 dark:text-zinc-300">
            {rootDirName || 'No folder selected'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            icon={isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
            onClick={() => setTheme(isDark ? 'light' : 'dark')}
            aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
          />
          <Button
            variant="ghost"
            size="sm"
            icon={<Settings className="size-4" />}
            onClick={onOpenSettings}
            aria-label="Open settings"
          />
        </div>
      </div>
    </header>
  )
}
