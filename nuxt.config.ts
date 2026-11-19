import { getStorageKey, themeStorageKey } from './app/core/storage'

const baseURL = process.env.NUXT_APP_BASE_URL || '/'
const isolatedExamplePath = `${baseURL.replace(/\/+$/, '')}/app/exemplo-isolado/`
const themeBeforePaint = [
  'try {',
  `  const saved = localStorage.getItem(${JSON.stringify(getStorageKey(baseURL, themeStorageKey))});`,
  `  const isolated = location.pathname.startsWith(${JSON.stringify(isolatedExamplePath)});`,
  '  const chosen = isolated ? new URLSearchParams(location.search).get("tema") || saved : saved;',
  '  if (["cm-v4-light", "cm-v4-dark", "cm-v4-aurora"].includes(chosen)) document.documentElement.dataset.theme = chosen;',
  '} catch {}',
].join('\n')

export default defineNuxtConfig({
  compatibilityDate: '2026-11-18',
  ssr: false,
  modules: ['@cosmemilton/ui-vue/nuxt'],
  css: ['~/assets/app.css'],
  devtools: { enabled: false },
  app: {
    baseURL,
    head: {
      htmlAttrs: { lang: 'pt-BR', 'data-theme': 'cm-v4-aurora', 'data-cm-skin': 'aurora-ops' },
      script: [{ key: 'aurora-theme-before-paint', innerHTML: themeBeforePaint }],
    },
  },
})
