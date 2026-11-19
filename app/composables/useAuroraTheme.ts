import { Moon, Sparkles, Sun } from 'lucide-vue-next'
import { getStorageKey, themeStorageKey } from '../core/storage'
export const themes = [
  { id: 'cm-v4-aurora', label: 'Aurora', icon: Sparkles },
  { id: 'cm-v4-light', label: 'Claro', icon: Sun },
  { id: 'cm-v4-dark', label: 'Escuro', icon: Moon },
] as const

export type ThemeId = (typeof themes)[number]['id']

export function asTheme(value: unknown): ThemeId {
  return themes.find(item => item.id === value)?.id ?? 'cm-v4-aurora'
}

export function useAuroraTheme() {
  const key = getStorageKey(useRuntimeConfig().app.baseURL, themeStorageKey)
  const theme = useState<ThemeId>('aurora-theme', () => {
    if (!import.meta.client) return 'cm-v4-aurora'
    try { return asTheme(localStorage.getItem(key)) } catch { return 'cm-v4-aurora' }
  })
  function setTheme(value: ThemeId) {
    theme.value = value
    if (import.meta.client) {
      try { localStorage.setItem(key, value) } catch {}
    }
  }
  return { theme, setTheme }
}
