import { getStorageKey, themeStorageKey } from './app/core/storage'

function themeBeforePaint(baseURL: string) {
  const isolatedExamplePath = `${baseURL.replace(/\/+$/, '')}/app/exemplo-isolado/`
  return [
    'try {',
    `  const saved = localStorage.getItem(${JSON.stringify(getStorageKey(baseURL, themeStorageKey))});`,
    `  const isolated = location.pathname.startsWith(${JSON.stringify(isolatedExamplePath)});`,
    '  const chosen = isolated ? new URLSearchParams(location.search).get("tema") || saved : saved;',
    '  if (["cm-v4-light", "cm-v4-dark", "cm-v4-aurora"].includes(chosen)) document.documentElement.dataset.theme = chosen;',
    '} catch {}',
  ].join('\n')
}

export default defineNuxtConfig({
  compatibilityDate: '2026-11-18',
  ssr: false,
  modules: ['@cosmemilton/ui-vue/nuxt'],
  css: ['~/assets/app.css'],
  devtools: { enabled: false },
  app: {
    head: {
      htmlAttrs: { lang: 'pt-BR', 'data-theme': 'cm-v4-aurora', 'data-cm-skin': 'aurora-ops' },
    },
  },
  hooks: {
    ready(nuxt) {
      const { baseURL, head } = nuxt.options.app
      head.script = [...(head.script ?? []), { key: 'aurora-theme-before-paint', innerHTML: themeBeforePaint(baseURL) }]
    },
  },
})
