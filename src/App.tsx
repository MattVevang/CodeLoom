import { AppShell } from '@/components/layout/AppShell'
import { useTheme } from '@/hooks/useTheme'

function App() {
  useTheme()

  return <AppShell />
}

export default App
