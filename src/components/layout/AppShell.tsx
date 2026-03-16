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
    <div className="min-h-screen bg-zinc-50 text-zinc-900 transition-colors dark:bg-zinc-950 dark:text-zinc-100">
      <Header
        onToggleSidebar={() => setSidebarOpen((open) => !open)}
        onOpenSettings={() => setSettingsOpen(true)}
      />

      <div className="flex min-h-screen pt-16">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <main className="grid flex-1 grid-rows-[minmax(20rem,0.85fr)_minmax(24rem,1.15fr)] gap-4 p-4 md:p-6">
          <PromptEditor />
          <OutputPanel />
        </main>
      </div>

      <SettingsPanel isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  )
}
