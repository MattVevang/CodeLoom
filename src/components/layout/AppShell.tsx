import { useState } from 'react'
import { OutputPanel } from '@/components/output/OutputPanel'
import { PromptEditor } from '@/components/prompt/PromptEditor'
import { SettingsPanel } from '@/components/settings/SettingsPanel'
import { Header } from '@/components/layout/Header'
import { Sidebar } from '@/components/layout/Sidebar'

export const AppShell = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)

  return (
    <div className="h-screen overflow-hidden bg-zinc-50 text-zinc-900 transition-colors dark:bg-zinc-950 dark:text-zinc-100">
      <Header
        onToggleSidebar={() => setSidebarOpen((open) => !open)}
        onOpenSettings={() => setSettingsOpen(true)}
      />

      <div className="flex h-[calc(100vh-4rem)] pt-16">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <main className="flex min-w-0 flex-1 flex-col gap-4 overflow-y-auto p-4 md:p-6 lg:overflow-hidden">
          <div className="min-h-[22rem] lg:h-[50%] lg:min-h-[16rem] lg:shrink-0 xl:h-[45%]">
            <PromptEditor />
          </div>
          <div className="min-h-[18rem] flex-1">
            <OutputPanel />
          </div>
        </main>
      </div>

      <SettingsPanel isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  )
}
