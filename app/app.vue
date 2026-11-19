<script setup lang="ts">
import { CmToastProvider } from '@cosmemilton/ui-vue'
import { asTheme, useAuroraTheme } from './composables/useAuroraTheme'

const { theme } = useAuroraTheme()
const route = useRoute()
const activeTheme = computed(() => {
  if (route.path === '/app/exemplo-isolado/tema/theme-provider/basic') return 'cm-v4-dark'
  if (route.path === '/app/exemplo-isolado/tema/theme-provider/advanced') return 'cm-v4-aurora'
  return route.path.startsWith('/app/exemplo-isolado/') && route.query.tema
    ? asTheme(route.query.tema) : theme.value
})
useHead({ htmlAttrs: { 'data-theme': activeTheme, 'data-cm-skin': 'aurora-ops', lang: 'pt-BR' } })
</script>

<template>
  <CmToastProvider><NuxtPage /></CmToastProvider>
</template>