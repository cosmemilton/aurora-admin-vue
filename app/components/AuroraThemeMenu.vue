<script setup lang="ts">
import { h } from 'vue'
import { Palette } from 'lucide-vue-next'
import { CmButton, CmDropdownMenu } from '@cosmemilton/ui-vue'
import { themes, useAuroraTheme } from '../composables/useAuroraTheme'

defineProps<{ triggerClass?: string }>()
const { theme, setTheme } = useAuroraTheme()
const current = computed(() => themes.find(item => item.id === theme.value)!)
const items = computed(() => themes.map(item => ({
  id: item.id, label: item.label, icon: h(item.icon, { size: 16, 'aria-hidden': true }),
  shortcut: item.id === theme.value ? 'Atual' : undefined,
  onSelect: () => setTheme(item.id),
})))
</script>

<template>
  <CmDropdownMenu :items="items">
    <template #trigger="{ triggerAttrs }">
      <CmButton
        v-bind="triggerAttrs" :class="triggerClass" variant="ghost" icon-only
        :aria-label="'Tema atual: ' + current.label"
      >
        <template #icon><Palette :size="18" aria-hidden="true" /></template>
      </CmButton>
    </template>
  </CmDropdownMenu>
</template>