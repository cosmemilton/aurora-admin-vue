const artworkFiles = {
  'cm-v4-aurora': { background: 'login-v1-aurora-claro.webp', side: 'login-v2-aurora-claro.webp' },
  'cm-v4-light': { background: 'login-v1-claro.webp', side: 'login-v2-claro.webp' },
  'cm-v4-dark': { background: 'login-v1-aurora.webp', side: 'login-v2-ribbon.webp' },
} as const

export function useAuthArtwork(theme: Ref<keyof typeof artworkFiles>) {
  const base = useRuntimeConfig().app.baseURL.replace(/\/+$/, '')

  return computed(() => {
    const files = artworkFiles[theme.value]
    return { background: `${base}/${files.background}`, side: `${base}/${files.side}` }
  })
}
