import { useEffect, useMemo, useState } from 'react'
import { useSettingsStore } from '@/stores/settingsStore'

const mediaQuery = '(prefers-color-scheme: dark)'

const getSystemPreference = (): boolean =>
  typeof window !== 'undefined' && window.matchMedia(mediaQuery).matches

export const useTheme = () => {
  const theme = useSettingsStore((state) => state.theme)
  const setTheme = useSettingsStore((state) => state.setTheme)
  const [systemPrefersDark, setSystemPrefersDark] = useState(getSystemPreference)

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined
    }

    const matcher = window.matchMedia(mediaQuery)
    const handleChange = (event: MediaQueryListEvent) => setSystemPrefersDark(event.matches)

    matcher.addEventListener('change', handleChange)

    return () => matcher.removeEventListener('change', handleChange)
  }, [])

  const isDark = useMemo(
    () => (theme === 'system' ? systemPrefersDark : theme === 'dark'),
    [systemPrefersDark, theme],
  )

  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle('dark', isDark)
    root.style.colorScheme = isDark ? 'dark' : 'light'
  }, [isDark, theme])

  return {
    theme,
    setTheme,
    isDark,
  }
}
